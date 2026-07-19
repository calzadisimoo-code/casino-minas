const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.static("public"));

let jugadoresOnline = 0;

// Jugadores esperando rival
let cola = [];

io.on("connection", (socket) => {

    console.log("==================================");
    console.log("Jugador conectado");
    console.log("Socket ID:", socket.id);
    console.log("==================================");

    jugadoresOnline++;

    io.emit("online", jugadoresOnline);

    socket.onAny((evento, datos) => {

        console.log("==================================");
        console.log("Evento recibido:", evento);
        console.log("Datos:", datos);
        console.log("==================================");

        if (evento !== "buscarPartida") return;

        console.log("LLEGÓ buscarPartida");

        // Buscar rival con la misma apuesta
        const rival = cola.find(j => j.apuesta === datos.apuesta);

        if (rival) {

            console.log("Rival encontrado:", rival.nombre);

            // Sacarlo de la cola
            cola = cola.filter(j => j.socket.id !== rival.socket.id);

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

            console.log("No hay rival. Esperando...");

            cola.push({
                socket,
                nombre: datos.nombre,
                apuesta: datos.apuesta
            });

            socket.emit("esperando");
        }

    });

    socket.on("disconnect", () => {

        console.log("Jugador desconectado");

        jugadoresOnline--;

        io.emit("online", jugadoresOnline);

        cola = cola.filter(j => j.socket.id !== socket.id);

    });

});

server.listen(3000, () => {
    console.log("Servidor iniciado");
});