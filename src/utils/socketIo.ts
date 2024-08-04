import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io"; // Correct import

let io: SocketIOServer;

export function initializeSocketIO(server: Server) {
  io = new SocketIOServer(server); // Initialize Socket.IO with the server instance
  console.log("Socket.IO initialized");

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    socket.on("sendNotification", (data) => {
      io.emit("costume-notification", data); // Emit notification to all connected clients
    });

    socket.on("update-location", (data) => {
      io.emit("change-location", data); // Emit location to all connected clients
    });
  });
}

export function getIo() {
  if (!io) {
    console.error("Socket.IO not initialized");
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
