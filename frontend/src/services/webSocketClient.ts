import { useChatStore } from '../store/useChatStore';

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("Conectado al servidor de WebSockets");
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_MESSAGE") {
          useChatStore.getState().addIncomingMessage(data.payload);
        }
      } catch (e) {
        console.error("Error al decodificar mensaje WS:", e);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket desconectado. Reintentando en 5 segundos...");
      setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const wsClient = new WebSocketClient(import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws");
