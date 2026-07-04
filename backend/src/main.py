from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.adapters.inbound.http import webhooks, chats
from typing import List

app = FastAPI(title="CloserFlow AI API", version="1.0.0")

# Habilitar CORS para que el frontend (React + Vite) pueda consumir la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar por la URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas HTTP de webhooks e IA
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(chats.router, prefix="/api/v1")

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
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Escucha mensajes del cliente (opcional para ping/pong o chats)
            data = await websocket.receive_text()
            # Enviar de vuelta a todos como broadcast
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"status": "running", "app": "CloserFlow AI"}
