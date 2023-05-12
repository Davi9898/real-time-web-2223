const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

const params = new URLSearchParams(location.search);
const username = params.get("username");
const room = params.get("room");

// FLag om te te laten zien of de client connected
let isConnected = false;

// Buffer om onverstuurde berichten op te slaan
let messageBuffer = [];

const socket = io();

socket.on("connect", function () {
  isConnected = true;

  // Resend any unsent messages
  while (messageBuffer.length > 0) {
    const msg = messageBuffer.shift();
    socket.emit("chatMessage", msg);
  }
});

socket.on("disconnect", function () {
  isConnected = false;
});

// Chatroom Joinen
let storedScores = JSON.parse(localStorage.getItem("scores") || "{}");
let storedScore = storedScores[username] || 0;
socket.emit("joinRoom", { username, room, score: storedScore });

// Verkrijgen van room en users
socket.on("roomUsers", ({ room, users }) => {
  updateRoomUsers(room, users);
});

// Bericht van Server
socket.on("message", (message) => {
  setTimeout(() => {
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
});

let selectedCountry;
let selectedCapital;
let data;

socket.on("data", (newData) => {
  data = newData;
  const randomIndex = Math.floor(Math.random() * data.length);
  selectedCountry = data[randomIndex];
  const name = selectedCountry.name.common;
  selectedCapital = selectedCountry.capital[0];
  document.getElementById("country-name").textContent = name;
});

socket.on("country", ({ name, capital }) => {
  document.getElementById("country-name").textContent = "Country: " + name;
  selectedCountry = name;
  selectedCapital = capital;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Input value krijgen
  const msg = e.target.elements.msg.value;

  // Als client is geconnect, emit de messages dan meteen
  // Anders voeg ze toe aan de buffer en laat ze sturen wanneer reconnet
  if (isConnected) {
    socket.emit("chatMessage", msg);
  } else {
    messageBuffer.push(msg);
  }

  // verwijderen input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

socket.on("updateScore", (score) => {
  storedScores[username] = score;
  localStorage.setItem("scores", JSON.stringify(storedScores));
  socket.emit("requestRoomUsers");
});

socket.on('reconnect', () => {
  // Rejoin the room
  let storedScores = JSON.parse(localStorage.getItem("scores") || "{}");
  let storedScore = storedScores[username] || 0;
  socket.emit("joinRoom", { username, room, score: storedScore });

  // Resend any unsent messages
  while (messageBuffer.length > 0) {
    const msg = messageBuffer.shift();
    socket.emit("chatMessage", msg);
  }
});

// Message output naar DOM
function outputMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const metaP = document.createElement("p");
  metaP.classList.add("meta");
  metaP.textContent = `${message.username} `;
  const metaSpan = document.createElement("span");
  metaSpan.textContent = message.time;
  metaP.appendChild(metaSpan);

  const textP = document.createElement("p");
  textP.classList.add("text");
  textP.textContent = message.text;

  messageDiv.appendChild(metaP);
  messageDiv.appendChild(textP);

  document.querySelector(".chat-messages").appendChild(messageDiv);
}

// Voeg kamer naam toe aan de DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Voeg users toe aan de DOM

function outputUsers(users) {
  const fragment = document.createDocumentFragment();

  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.username} (${user.score})`; // Display the score
    if (user.username === username) {
      // 'username' is the username of the current user
      li.classList.add("highlight"); // 'highlight' is the class that you will use to style the current user
    }
    fragment.appendChild(li);
  });

  while (userList.firstChild) {
    userList.removeChild(userList.firstChild);
  }
  userList.appendChild(fragment);
}

function updateRoomUsers(room, users) {
  outputRoomName(room);
  outputUsers(users);
}
