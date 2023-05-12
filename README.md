# Capital Guesser

![Screenshot 2023-05-12 194627](https://github.com/Davi9898/real-time-web-2223/assets/76910947/8d0d34ee-e8b4-47ab-b494-06e939cc9ca7)
# Table of contents
1. [Inleiding](#inleiding)
2. [Installation](#installation)
3. [Moscow](#moscow)
4. [External data source](#datasource)
5. [API data model](#datamodel)
6. [Data lifecycle](#lifecycle)
7. [Server](#server)
8. [Client](#client)
9. [Offline strategie](#offline)

# Inleiding <a name="inleiding"></a>
Hoe werkt mijn app? Bij het openen van de app wordt de gebruiker gevraagd om een gebruikersnaam en een kamer te kiezen. Zodra ze de kamer betreden, krijgen ze een land te zien en moeten ze de hoofdstad van dat land raden. Als een gebruiker het juiste antwoord raadt, krijgt hij een punt en wordt er een nieuw land getoond aan alle gebruikers in de kamer.
Gebruikers kunnen ook met elkaar chatten en de scores van andere gebruikers in de kamer bekijken.

# Installation <a name="installation"></a>

1. clone repository
2. npm install
3. node server.js to run

# MoScOw <a name="moscow"></a>
**Must have:**

[x] Chatroom met data render van API
**Should have:**

[x] Meerdere rooms

[x] Puntenscore

[x] User list
**Could have:**

[] Cleaner code

[] Inlog systeem zodat je op verschillende clients je punten kan behouden

[] States

# External data source <a name="datasource"></a>
Voor dit project heb ik de rest countries API gebruikt. Rest countries is een API die je verschillende datasets aanbiedt met informatie over landen. Je kan verschillende querys aanroepen om zo bijvoorbeel een regio te krijgen. Voor mijn API heb ik gebruik gemaakt van drie verschillende regio's namelijk: Europe, America en Africa. Voor het randomizen van de data die terugkomt zodat je niet telkens begint met het zelfde land heb ik het volgende gedaan:

```js
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
```

Dus wanneer een gebruiker de kamer betreedt wordt deze functie aangeroepen. We zetten dit om naar een json en slaan het op in het roomData object en dit emitten we naar alle clients in de kamer. De client-side het country event op welke de name en capital bevatten en vervolgens injecteren we dit dan in de HTML. Belangrijk om te weten dat wanneer een gebruiker alleen in de kamer is de kamer kan refreshen en dan zal de instantie ook ververst worden. Maar met meerdere client zal dit niet gebeuren. Hierdoor lopen we niet tegen problemen aan.

### API Data model <a name="datamodel"></a>

![ApiData](https://github.com/Davi9898/real-time-web-2223/assets/76910947/c0d0f87e-5f37-4187-ba30-408bf5141688)

# Data lifecycle <a name="lifecycle"></a>
1. Wanneer een gebruiker de app opent, maakt de client een verbinding met de server via socket.io.
2. De gebruiker kiest een gebruikersnaam en een kamer. Deze informatie wordt naar de server gestuurd, die de gebruiker aan de geselecteerde kamer toevoegt.
3. De server haalt gegevens op van een externe bron (Restcountries API) om een land en zijn hoofdstad te selecteren.
4. Deze informatie wordt naar alle clients in de kamer gestuurd en de game begint.
5. Gebruikers sturen berichten naar de server, die ze vervolgens naar alle clients in de kamer stuurt.
6. Als een gebruiker het juiste antwoord raadt, verhoogt de server zijn score en wordt er een nieuw land gefetched. De nieuwe score en het nieuwe land worden naar alle clients in de kamer gestuurd.
7. Wanneer een gebruiker de app sluit, verbreekt de client de verbinding met de server en verwijdert de server de gebruiker uit de kamer.

### Visualisatie

![datalifecycle](https://github.com/Davi9898/real-time-web-2223/assets/76910947/2b7b7dfe-6f7f-410a-9e94-ebee6bbf01f8)

# Code
Structuur van m'n applicatie
* server.js
* Utils/messages.js
* Utils/users.js
* public/js/main.js
* public/css/style.css
* index.html
* chat.html

### Server.js <a name="server"></a>

Dit is de hoofdserver van mijn applicatie. Het gebruikt Node.js, Express en socketio om een webserver mee te maken. De server luistert naar verschillende events die worden verzonden naar de client

```js
io.on("connection", (socket) => {
```
Hier luistert de server naar nieuwe verbindingen

```js
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
```

De server luistert hier naar het joinRoom event dat wordt verzonden wanneer een gebruiker de kamer betreedt. Het voegt de gebruiker toe en vervolgens krijgt hij van de Guesserbot een welkomst bericht speciaal voor deze gebruiker.

```js
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
 ```
 
Dit is het chatMessage event en deze wordt verzonden wanneer een gebruiker een bericht typt. Het controleert of het bericht gelijk is aan het antwoord en stuurt dit naar andere gebruikers in de kamer. Ook is hier de skip bij ingebouwd

```js
socket.on("correct", () => {
    const user = getCurrentUser(socket.id);
  });
```

Dit is het correct event, wanneer de server deze ontvangt betekent het dat een gebruiker een correct antwoord heeft geraden. 

```js
socket.on("requestRoomUsers", () => {
    const user = getCurrentUser(socket.id);
    if (user) {
      const roomUsers = getRoomUsers(user.room);
      socket.emit("roomUsers", { room: user.room, users: roomUsers });
    }
  });
```

Dit is requestRoomUsers event. Wanneer de server dit ontvangt betekent het dat een gebruiker een verzoek heeft gedaan om de lijst van de gebruikers te zien. De server haalt eerst de gegevens van de huidige gebruiker op. Als de gebruiker bestaat haalt de server de lijst van gebruikers in de kamer van de persoon in kwestie. En vervolgens wordt er een lisjt teruggestuurd naar de client die het verzoek heeft gedaan. dit wordt gedaan met:

```js
socket.emit("roomUsers", { room: user.room, users: roomUsers });
```
Het roomUsers event wordt geëmit met als data het object. En dit object bevat de kamer en de lijst van gebruikers aanwezig in de kamer.

```js
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
```

Dit is de disconnect event waar de server naar luistert. Dit gebeurt wanneer een gebruiker de kamer verlaat en vervolgens wordt de verbinding verbroken. De server laat weten aan de andere gebruikers in de kamer dat de persoon de kamer is verlaten.

### Utils/messages
Moment is een dependency waarmee je makkelijk de huidige tijd mee kan ophalen

```js
const moment = require("moment");

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
}
 ```
 
Functie die de berichtformat object retourneert met de desbetreffende data. Ik gebruik dit om de berichten te formatteren voordat ze naar de client worden gestuurd.
 
### Utils/users.js
Dit bestand beheerst de gebruikers

```js
function userJoin(id, username, room, score = 0) {
  let user = users.find((u) => u.room === room && u.username === username);

  if (user) {
    
    user.id = id;
    user.score = score;
  } else {
    
    user = new User(id, username, room, score);
    users.push(user);
  }

  return user;
}
```
Deze functie voegt een nieuwe gebruiker aan de lijst van actieve gebruikers toe. Het neemt de socketID, username, kamer en score als parameters. als de gebruiker al bestaat wordt de socketid bijgewerkt en de score.

```js
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}


function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}
```
Deze functies spreken eigenlijk voorzich. Currentuser haalt currentuser op op basis van hun socketID en userleave wordt gebruikt om de gebruiker te verwijderne uit de lijst van actieve gebruikers.

### main.js <a name="client"></a>
Dit is het belangrijkste client-side JavaScript-bestand. Het maakt verbinding met de server via socket.io en luistert naar verschillende events. Het beheert ook de gebruikersinterface van de chat, inclusief het formulier om berichten te verzenden en het weergeven van berichten in de chat.

```js
socket.on("connect", function () {
  isConnected = true;

  // Resend any unsent messages
  while (messageBuffer.length > 0) {
    const msg = messageBuffer.shift();
    socket.emit("chatMessage", msg);
  }
});
```

Wanneer de client verbindig maakt met de server dan wordt deze event handler uitgevoerd. 

```js
socket.on("roomUsers", ({ room, users }) => {
  updateRoomUsers(room, users);
});
```

Deze event handler wordt uitgevoerd wanner de server de roomUsers emit. de functie updateRoomUsers wordt dan aangeroepen

```js
socket.on("message", (message) => {
  setTimeout(() => {
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
});
```
outPutMessage wordt aangeroepen en ontvangt message als argument. Ook zorgt dit ervoor dat de chatmessages niet wegscrollen omhoog maar dat ze zichtbaar blijven.

```js
socket.on("data", (newData) => {
  data = newData;
  const randomIndex = Math.floor(Math.random() * data.length);
  selectedCountry = data[randomIndex];
  const name = selectedCountry.name.common;
  selectedCapital = selectedCountry.capital[0];
  document.getElementById("country-name").textContent = name;
});
```
We genereren hier een willekeurige index om zo het een random stukje uit de dataset te laten zijn.

```js
socket.on("country", ({ name, capital }) => {
  document.getElementById("country-name").textContent = "Country: " + name;
  selectedCountry = name;
  selectedCapital = capital;
});
```

De ontvangen name en capital worden opgeslagen hiermee in de variabelen

```js
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
```
Voorkomt dat de pagina wordt ververst, het bericht wordt verstuurd naar de server.

```js
socket.on("updateScore", (score) => {
  storedScores[username] = score;
  localStorage.setItem("scores", JSON.stringify(storedScores));
  socket.emit("requestRoomUsers");
});
```
Deze eventhandler zorgt ervoor dat de score wordt opgeslagen en ook wordt de storedScores opgeslagen gelinked aan de username in localStorage. Zo kun je weer verder spelen met je username en behoudt je je score. De server vangt dit ook af waardoor andere je punten ook kunnen zien.

# Offline stategie <a name="offline"></a>

server.js 
```js
 if (socket.connected) {
      socket.volatile.emit('message', formatMessage(user.username, msg));
    }
```

Aan de serverzijde wordt de volatiele flag gebruikt om te voorkomen dat events worden gebufferd wanneer de client is losgekoppeld.

main.js
```js
socket.on('connect', function() {
  isConnected = true;

  while (messageBuffer.length > 0) {
    const msg = messageBuffer.shift();
    socket.emit('chatMessage', msg);
  }
});

socket.on('disconnect', function() {
  isConnected = false;
});

 if (isConnected) {
    socket.emit('chatMessage', msg);
  } else {
    messageBuffer.push(msg);
  }
```

Aan de clientzijde wordt een flag (isConnected) ingesteld om aan te geven of de client momenteel verbonden is. Bij het indienen van een bericht door de client wordt gecontroleerd of de client is verbonden. Indien dit het geval is, wordt het bericht onmiddellijk verzonden. Zo niet, dan wordt het bericht toegevoegd aan een buffer (messageBuffer).Bij het opnieuw verbinden van de client worden alle niet-verzonden berichten opnieuw verzonden vanuit de buffer.

Hiermee wordt alleen het bufferen van het chatMessage event voorkomen. Dit doe ik omdat dat het chatMessage event een van de meest belangrijke events is en het is de primaire interactie tussen de gebruiker en de server. Het is belangrijk dat deze berichten goed gehandeld worden wanneer de clients connectie status veranderd. Het toevoegen van een offline strategie voegt niet veel waarde doe voor andere events. Deze events maken niet gebruik van user inputs namelijk.

# Reconnect strategie
```js
socket.on('reconnect', () => {
  
  let storedScores = JSON.parse(localStorage.getItem("scores") || "{}");
  let storedScore = storedScores[username] || 0;
  socket.emit("joinRoom", { username, room, score: storedScore });

  while (messageBuffer.length > 0) {
    const msg = messageBuffer.shift();
    socket.emit("chatMessage", msg);
  }
});
```
Aan de serverzijde moet het disconnect event de gebruikers uit de kamer verwijderen maar niet uit m'n users datastructuur. Vervolgens wanneer de client opnieuw verbinding maakt en het joinRoom event aanroept moet er gecontroleerd worden of de gebruiker al bestaat in de users datastructuur. Als de gebruiker al bestaat dan updaten we het socketID en laten we de gebruiker opnieuw de kamer binnen. Als dit niet zo is maken we gewoon weer een nieuwe gebruiker aan. Hierdoor wordt de username en score behouden van de gebruiker

### Multi User support
De app ondersteunt vele gebruikers. Deze komen allemaal gewoon te staan in de user list welke vervolgens doorheen gescrolled kan worden. Natuurlijk is een chatroom wel een beetje hectisch met 400 man.

### Resources
* [SocketIO](https://socket.io/docs/v4/>SocketIO)
* [Youtube](https://www.youtube.com/watch?v=ZKEqqIO7n-k)
* [Youtube](https://www.youtube.com/watch?v=uyVz6LA3Eho)
* [Youtube](https://www.youtube.com/watch?v=jD7FnbI76Hg&t=1262s)





