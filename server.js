const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let jugadoresOnline = 0;

// Jugadores esperando rival
let cola = [];

io.on("connection", (socket) => {

    jugadoresOnline++;

    console.log("Jugador conectado");

    io.emit("online", jugadoresOnline);

   socket.on("buscarPartida", (datos) => {

    console.log("LLEGÓ buscarPartida");
    console.log(datos);

    // Buscar alguien con la misma apuesta
    const rival = cola.find(j => j.apuesta == datos.apuesta);

        if (rival) {

            // quitar rival de la cola
            cola = cola.filter(j => j.socket.id !== rival.socket.id);

            // crear id de partida
            const partidaID = Date.now().toString();

            socket.join(partidaID);
            rival.socket.join(partidaID);

            io.to(partidaID).emit("partidaEncontrada", {

                id: partidaID,

                jugador1: rival.nombre,

                jugador2: datos.nombre,

                apuesta: datos.apuesta

            });

        } else {

            cola.push({

                socket,

                nombre: datos.nombre,

                apuesta: datos.apuesta

            });

            socket.emit("esperando");

        }

    });

    socket.on("disconnect", () => {

        jugadoresOnline--;

        io.emit("online", jugadoresOnline);

        cola = cola.filter(j => j.socket.id !== socket.id);

        console.log("Jugador desconectado");

    });

});

server.listen(3000, () => {

    console.log("Servidor iniciado");

});