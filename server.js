const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");

require("dotenv").config();
require("./config/database");

const app = express();
const http = require("http");
const socketIo = require("socket.io");

app.use(logger("dev"));
app.use(express.json());
app.use(favicon(path.join(__dirname, "build", "favicon.ico")));
app.use(express.static(path.join(__dirname, "build")));

app.use("/api/users", require("./routes/api/users"));
app.use(require("./config/auth")); // Protect routes below this. These routes will have access to the "req.user" variable.
app.use("/api/groups", require("./routes/api/groups"));
app.use("/api/messages", require("./routes/api/messages"));
app.use("/api/uploadImage", require("./routes/api/uploadImage"));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const port = process.env.PORT || 3001;
// app.listen(port, function () {
//   console.log(`Express app running on port ${port}`);
// });

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const USER_JOIN_CHAT = "USER_JOIN_CHAT";
const USER_LEAVE_CHAT = "USER_LEAVE_CHAT";
const NEW_CHAT_MESSAGE = "NEW_CHAT_MESSAGE";

io.on("connection", function (socket) {
  console.log(`Client connected to ${socket.id}`);

  const { roomId, user } = socket.handshake.query;

  socket.join(roomId);

  // const user = addUser(socket.id, roomId, name);
  io.in(roomId).emit(USER_JOIN_CHAT, user);

  socket.on(NEW_CHAT_MESSAGE, (message) => {
    io.in(roomId).emit(NEW_CHAT_MESSAGE, message);
  });

  socket.on("disconnect", () => {
    console.log("disconnected - server");
    socket.leave(roomId);
  });

  socket.on("chatMessage", (msg) => {
    io.emit("message", msg);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
