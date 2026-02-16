/**
 * WebSocket broadcast: mantiene conexiones y envía mensajes a todos.
 * Usado para eventos Presence (check-in) en tiempo real.
 */
type Socket = { send: (data: string) => void };

const connections = new Set<Socket>();

export function addWsConnection(socket: Socket): void {
  connections.add(socket);
}

export function removeWsConnection(socket: Socket): void {
  connections.delete(socket);
}

export function broadcast(data: object): void {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  for (const socket of connections) {
    try {
      socket.send(payload);
    } catch {
      connections.delete(socket);
    }
  }
}
