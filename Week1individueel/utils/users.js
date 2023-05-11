const users = [];

// Join user to chat
function userJoin(id, username, room, score = 0) {
  let user = users.find((u) => u.room === room && u.username === username);

  if (user) {
    // User exists, update their socket.id and score
    user.id = id;
    user.score = score;
  } else {
    // User doesn't exist, create a new one
    user = new User(id, username, room, score);
    users.push(user);
  }

  return user;
}

// Get current user
function getCurrentUser(id) {
  console.log(users);
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users

function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

class User {
  constructor(id, username, room, score) {
    this.id = id;
    this.username = username;
    this.room = room;
    this.score = score;
    this.answeredCorrectly = false;
  }
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
