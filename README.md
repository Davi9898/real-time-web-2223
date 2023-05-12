# Capital Guesser

![Screenshot 2023-05-12 194627](https://github.com/Davi9898/real-time-web-2223/assets/76910947/8d0d34ee-e8b4-47ab-b494-06e939cc9ca7)
# Table of contents


# Installatie

1. clone repository
2. npm install
3. node server.js to run

#MoScOw
**Must have:**

[x] Chatroom met data render van API
**Should have:**

[x] Meerdere rooms
[x] Puntenscore
[x] User list
**Could have:**

[] Inlog systeem zodat je op verschillende clients je punten kan behouden
[] States

# External data source
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

### API Data model

![ApiData](https://github.com/Davi9898/real-time-web-2223/assets/76910947/c0d0f87e-5f37-4187-ba30-408bf5141688)

# Data lifecycle 
1. Wanneer een gebruiker de app opent, maakt de client een verbinding met de server via socket.io.
2. De gebruiker kiest een gebruikersnaam en een kamer. Deze informatie wordt naar de server gestuurd, die de gebruiker aan de geselecteerde kamer toevoegt.
3. De server haalt gegevens op van een externe bron (Restcountries API) om een land en zijn hoofdstad te selecteren.
4. Deze informatie wordt naar alle clients in de kamer gestuurd en de game begint.
5. Gebruikers sturen berichten naar de server, die ze vervolgens naar alle clients in de kamer stuurt.
6. Als een gebruiker het juiste antwoord raadt, verhoogt de server zijn score en wordt er een nieuw land gefetched. De nieuwe score en het nieuwe land worden naar alle clients in de kamer gestuurd.
7. Wanneer een gebruiker de app sluit, verbreekt de client de verbinding met de server en verwijdert de server de gebruiker uit de kamer.

### Visualisatie

![datalifecycle](https://github.com/Davi9898/real-time-web-2223/assets/76910947/2b7b7dfe-6f7f-410a-9e94-ebee6bbf01f8)


<!-- Here are some hints for your projects Readme.md! -->

<!-- Start out with a title and a description -->

<!-- Add a nice image here at the end of the week, showing off your shiny frontend 📸 -->

<!-- Add a link to your live demo in Github Pages 🌐-->

<!-- replace the code in the /docs folder with your own, so you can showcase your work with GitHub Pages 🌍 -->

<!-- Maybe a table of contents here? 📚 -->

<!-- ☝️ replace this description with a description of your own work -->

<!-- How about a section that describes how to install this project? 🤓 -->

<!-- ...but how does one use this project? What are its features 🤔 -->

<!-- What external data source is featured in your project and what are its properties 🌠 -->

<!-- This would be a good place for your data life cycle ♻️-->

<!-- Maybe a checklist of done stuff and stuff still on your wishlist? ✅ -->

<!-- We all stand on the shoulders of giants, please link all the sources you used in to create this project. -->

<!-- How about a license here? When in doubt use MIT. 📜  -->
