const port = process.env.PORT || 3001; // Use the platform-assigned port or default to 3001
const io = require("socket.io")(port, {
  cors: {
    origin: "*", // Update this with your frontend URL for production
    methods: ["GET", "POST"],
  },
});
console.log(`Server running on port ${port}`);

const peers = {}; // Store peers as { socketId: peerId }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Register peer ID
  socket.on("register-peer", (peerId) => {
    peers[socket.id] = peerId;
    console.log("Registered Peer ID:", peerId);
    console.log("Current Peers:", peers);
    // Notify all clients of the updated peers list
    io.emit("peers-list", Object.values(peers));
  });

  // Handle call requests
  socket.on("call-peer", (peerId) => {
    console.log(`Call request to Peer ID: ${peerId}`);
    const targetSocket = Object.keys(peers).find(
      (key) => peers[key] === peerId
    );
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
      io.to(targetSocket).emit("signal", { from: peers[socket.id], signal }); // Forward signaling data with sender info
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
