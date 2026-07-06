import os
import asyncio
import json
import redis.asyncio as aioredis
from urllib.parse import urlparse
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.adapters.inbound.http import webhooks, chats
from typing import List

# URL de Redis desde variables de entorno
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

def mask_redis_url(url: str) -> str:
    """Enmascara credenciales en la URL de Redis para logs seguros."""
    try:
        parsed = urlparse(url)
        if parsed.password:
            masked = url.replace(f":{parsed.password}@", ":***@")
            return masked
        return url
    except Exception:
        return "redis://***"

# --- websocket connection manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Si falla la conexión con algún cliente, lo limpiamos después
                pass

manager = ConnectionManager()

# --- Tarea asíncrona para escuchar Pub/Sub de Redis y retransmitir a WebSockets ---
async def redis_websocket_broadcaster():
    print(f"WS Broadcaster: Conectando a Redis Pub/Sub en {mask_redis_url(REDIS_URL)}...")
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("ws_broadcast")
    print("WS Broadcaster: Suscrito al canal 'ws_broadcast'")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                #data es un string JSON que el worker publica
                await manager.broadcast(data)
    except asyncio.CancelledError:
        await pubsub.unsubscribe("ws_broadcast")
        await redis_client.close()
    except Exception as e:
        print(f"Error en WS Broadcaster: {e}")
        # Intentar reconexión en caso de error de red
        await asyncio.sleep(5)
        asyncio.create_task(redis_websocket_broadcaster())

# --- Manejador del ciclo de vida de la App (FastAPI Lifespan) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Arranca la tarea en segundo plano
    task = asyncio.create_task(redis_websocket_broadcaster())
    yield
    # Shutdown: Cancela la tarea al apagar el servidor
    task.cancel()

app = FastAPI(title="CloserFlow AI API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(chats.router, prefix="/api/v1")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Escuchar mensajes del cliente (para mantener vivo)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "running", "app": "CloserFlow AI"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}
