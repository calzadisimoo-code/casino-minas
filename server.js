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

// Cola de espera
let cola = [];

// Todas las partidas activas
const partidas = {};

// ---------- FUNCIONES ----------

function crearTablero() {

    const tablero = [];

    for (let i = 0; i < 25; i++) {

        tablero.push({

            abierta: false,

            mina: false

        });

    }

    const mina = Math.floor(Math.random() * 25);

    tablero[mina].mina = true;

    return tablero;

}

function crearPartida(jugador1, jugador2, apuesta) {

    const id = Date.now().toString() + Math.floor(Math.random()*9999);

    const tablero = crearTablero();

    partidas[id] = {

        id,

        apuesta,

        tablero,

        turno: jugador1.socket.id,

        jugadores: [

            {

                socket: jugador1.socket,

                nombre: jugador1.nombre

            },

            {

                socket: jugador2.socket,

                nombre: jugador2.nombre

            }

        ]

    };

    jugador1.socket.join(id);

    jugador2.socket.join(id);

    io.to(id).emit("partidaEncontrada",{

        partida:id,

        apuesta,

        jugador1:jugador1.nombre,

        jugador2:jugador2.nombre,

        turno:jugador1.socket.id,

        tablero

    });

}

io.on("connection",(socket)=>{

    jugadoresOnline++;

    console.log("Jugador conectado");

    io.emit("online",jugadoresOnline);

    socket.on("buscarPartida",(datos)=>{

        console.log(datos);

        const rival=cola.find(j=>j.apuesta==datos.apuesta);

        if(rival){

            cola=cola.filter(j=>j.socket.id!=rival.socket.id);

            crearPartida(

                rival,

                {

                    socket,

                    nombre:datos.nombre

                },

                datos.apuesta

            );

        }else{

            cola.push({

                socket,

                nombre:datos.nombre,

                apuesta:datos.apuesta

            });

            socket.emit("esperando");

        }

    });

    socket.on("abrirCasilla",(datos)=>{

        const partida=partidas[datos.partida];

        if(!partida) return;

        if(partida.turno!=socket.id) return;

        if(partida.tablero[datos.casilla].abierta) return;

        partida.tablero[datos.casilla].abierta=true;

        if(partida.tablero[datos.casilla].mina){

            io.to(partida.id).emit("mina",{

                casilla:datos.casilla,

                perdedor:socket.id

            });

            delete partidas[partida.id];

            return;

        }

        const siguiente=partida.jugadores.find(j=>j.socket.id!=socket.id);

        partida.turno=siguiente.socket.id;

        io.to(partida.id).emit("actualizar",{

            tablero:partida.tablero,

            turno:partida.turno

        });

    });

    socket.on("disconnect",()=>{

        jugadoresOnline--;

        io.emit("online",jugadoresOnline);

        cola=cola.filter(j=>j.socket.id!=socket.id);

        console.log("Jugador desconectado");

    });

});

server.listen(3000,()=>{

    console.log("Servidor iniciado");

});