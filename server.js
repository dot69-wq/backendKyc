const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (update this for production)
    methods: ["GET", "POST"],
  },
});

const peers = {}; // Store peers as { socketId: peerId }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Register peer ID
  socket.on("register-peer", (peerId) => {
    peers[socket.id] = peerId;
    console.log("Registered Peer ID:", peerId);
    console.log("Current Peers:", peers);
    io.emit("peers-list", Object.values(peers)); // Notify all clients of the updated peers list
  });

  // Handle call requests
  socket.on("call-peer", (peerId) => {
    console.log(`Call request to Peer ID: ${peerId}`);
    const targetSocket = Object.keys(peers).find((key) => peers[key] === peerId);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", peers[socket.id]); // Notify recipient
    } else {
      console.log("Target peer not found");
    }
  });

  // Handle WebRTC signaling data
  socket.on("signal", (data) => {
    const { to, signal } = data;
    const targetSocket = Object.keys(peers).find((key) => peers[key] === to);
    if (targetSocket) {
      io.to(targetSocket).emit("signal", { from: peers[socket.id], signal }); // Forward signaling data
    } else {
      console.log("Target peer not found for signaling");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    delete peers[socket.id]; // Remove peer from list
    io.emit("peers-list", Object.values(peers)); // Notify all clients of updated peers list
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});