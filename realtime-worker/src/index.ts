import { DurableObject } from "cloudflare:workers";

type ConnectionAttachment = {
  userId: string;
  identity: string;
};

type RealtimeEvent = {
  type: string;
  occurredAt: string;
  [key: string]: unknown;
};

export class RealtimeRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required.", { status: 426 });
    }

    const userId = request.headers.get("X-Realtime-User-Id");
    const identity = request.headers.get("X-Realtime-Identity");
    if (!userId || !identity) {
      return new Response("Missing authenticated connection context.", { status: 401 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const attachment: ConnectionAttachment = { userId, identity };

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(attachment);

    return new Response(null, { status: 101, webSocket: client });
  }

  async broadcast(event: RealtimeEvent): Promise<number> {
    if (!isRealtimeEvent(event)) {
      throw new TypeError("Invalid realtime event.");
    }

    const message = JSON.stringify(event);
    let delivered = 0;

    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
        delivered += 1;
      } catch (error) {
        console.error(JSON.stringify({
          event: "realtime_broadcast_error",
          message: error instanceof Error ? error.message : "Unknown WebSocket error"
        }));
      }
    }

    return delivered;
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    // Per ora il canale è soltanto server -> client. I flussi di scrittura restano REST.
    if (message === "ping") {
      socket.send("pong");
    }
  }

  webSocketClose(socket: WebSocket, code: number, reason: string, wasClean: boolean): void {
    socket.close(code, reason);
    console.log(JSON.stringify({ event: "realtime_socket_closed", code, reason, wasClean }));
  }

  webSocketError(_socket: WebSocket, error: unknown): void {
    console.error(JSON.stringify({
      event: "realtime_socket_error",
      message: error instanceof Error ? error.message : "Unknown WebSocket error"
    }));
  }
}

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate["type"] === "string"
    && candidate["type"].length > 0
    && typeof candidate["occurredAt"] === "string";
}

export default {
  fetch(): Response {
    // Il Worker non espone un endpoint pubblico: Pages accede direttamente al namespace DO.
    return new Response("Not found.", { status: 404 });
  }
} satisfies ExportedHandler<Env>;
