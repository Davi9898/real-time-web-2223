const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const fetch = require("node-fetch"); 

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Static folder
app.use(express.static(path.join(__dirname, "public")));

const GuessBot = "Info";

async function selectCountry(room) {
  const roomToRegion = {
    Europe: "europe",
    America: "america",
    Africa: "africa",
  };

  const region = roomToRegion[room];
  const response = await fetch(
    `https://restcountries.com/v3.1/region/${region}`
  );
  const data = await response.json();
  const randomIndex = Math.floor(Math.random() * data.length);
  const apiResponse = data[randomIndex];
  const name = apiResponse.name.common;
  const capital = apiResponse.capital[0];

  roomData[room] = { name, capital };
  io.to(room).emit("country", roomData[room]);
}

const roomData = {};


io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room, score }) => {
    const user = userJoin(socket.id, username, room, score);

    socket.join(user.room);

    if (getRoomUsers(user.room).length == 1) {
      selectCountry(user.room);
    } else {
      io.to(room).emit("country", roomData[user.room]);
    }

    // Welcome user
    socket.emit(
      "message",
      formatMessage(GuessBot, "Welcome to the Capital Guessing game")
    );

    
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(GuessBot, `${user.username} has joined the chat`)
      );

    
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("correct", () => {
    const user = getCurrentUser(socket.id);
  });

  socket.on("requestRoomUsers", () => {
    const user = getCurrentUser(socket.id);
    if (user) {
      const roomUsers = getRoomUsers(user.room);
      socket.emit("roomUsers", { room: user.room, users: roomUsers });
    }
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    const selectedCapital = roomData[user.room]?.capital || "";

    // Send the message only if the socket is connected
    if (socket.connected) {
      socket.volatile.emit("message", formatMessage(user.username, msg));
    }

    if (msg.toLowerCase() === selectedCapital.toLowerCase()) {
      if (user) {
        user.score += 1;
        socket.emit("updateScore", user.score); // Send the updated score back to the use
        const message = `${user.username} guessed the correct answer`;
        io.to(user.room).emit("message", formatMessage(GuessBot, message));
        selectCountry(user.room);

        // Send updated users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    }

    if (msg.toLowerCase() === "/skip") {
      selectCountry(user.room);
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(GuessBot, `${user.username} has left the chat`)
      );
    }

    // Send users and room info
    if (user && user.room) {
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    } else {
      console.log("user or user.room is undefined");
    }
  });
});

const PORT = process.env.PORT || 3200;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
