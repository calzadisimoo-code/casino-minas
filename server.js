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

const TABLERO = 25;

let jugadoresOnline = 0;

// Cola de espera
const cola = [];

// Partidas activas
const partidas = {};

// Puntos de cada jugador
const puntos = {};

function obtenerPuntos(socket){

    if(puntos[socket.id] == null){

        puntos[socket.id] = 10000;

    }

    return puntos[socket.id];

}

function crearTablero(){

    const tablero = [];

    for(let i=0;i<25;i++){

        tablero.push({

            abierta:false,

            tipo:"diamante"

        });

    }

    let mina1 = Math.floor(Math.random()*25);
    let mina2;

    do{

        mina2 = Math.floor(Math.random()*25);

    }while(mina2 == mina1);

    tablero[mina1].tipo = "mina";
    tablero[mina2].tipo = "mina";

    return tablero;

}

function crearPartida(j1,j2,apuesta){

    const id = Date.now().toString() + Math.floor(Math.random()*999999);

    const tablero = crearTablero();

    partidas[id]={

        id,

        apuesta,

        tablero,

        turno:j1.socket.id,

        terminada:false,

        jugadores:[

            {

                socket:j1.socket,

                nombre:j1.nombre

            },

            {

                socket:j2.socket,

                nombre:j2.nombre

            }

        ]

    };

    j1.socket.join(id);
    j2.socket.join(id);

    io.to(id).emit("partidaEncontrada",{

        partida:id,

        apuesta,

        tablero,

        jugador1:j1.nombre,

        jugador2:j2.nombre,

        turno:j1.socket.id

    });

}

io.on("connection",(socket)=>{

    jugadoresOnline++;

    io.emit("online",jugadoresOnline);

    obtenerPuntos(socket);

    socket.emit("misPuntos",{

        puntos:obtenerPuntos(socket)

    });

    socket.on("buscarPartida",(datos)=>{

        const apuesta = Number(datos.apuesta);

        if(apuesta<=0){

            socket.emit("mensaje","Apuesta inválida");

            return;

        }

        if(obtenerPuntos(socket)<apuesta){

            socket.emit("mensaje","No tienes puntos suficientes");

            return;

        }

        const rival = cola.find(j=>j.apuesta==apuesta);

        if(rival){

            const indice = cola.indexOf(rival);

            if(indice!=-1){

                cola.splice(indice,1);

            }

            crearPartida(

                rival,

                {

                    socket,

                    nombre:datos.nombre

                },

                apuesta

            );

        }else{

            cola.push({

                socket,

                nombre:datos.nombre,

                apuesta

            });

            socket.emit("esperando");

        }

    });
	
	    // ==========================================
    // ABRIR CASILLA
    // ==========================================

    socket.on("abrirCasilla",(datos)=>{

        const partida = partidas[datos.partida];

        if(!partida) return;

        if(partida.terminada) return;

        if(partida.turno != socket.id) return;

        const casilla = partida.tablero[datos.casilla];

        if(casilla.abierta) return;

        casilla.abierta = true;

        // ==========================================
        // PISÓ LA MINA
        // ==========================================

        if(casilla.tipo=="mina"){

            partida.terminada = true;

            let ganador;
            let perdedor;

            if(partida.jugadores[0].socket.id == socket.id){

                perdedor = partida.jugadores[0];
                ganador = partida.jugadores[1];

            }else{

                perdedor = partida.jugadores[1];
                ganador = partida.jugadores[0];

            }

            puntos[ganador.socket.id] += partida.apuesta;
            puntos[ganador.socket.id] += partida.apuesta;

            puntos[perdedor.socket.id] -= partida.apuesta;

            ganador.socket.emit("misPuntos",{

                puntos:puntos[ganador.socket.id]

            });

            perdedor.socket.emit("misPuntos",{

                puntos:puntos[perdedor.socket.id]

            });

            io.to(partida.id).emit("finPartida",{

                tablero:partida.tablero,

                casilla:datos.casilla,

                ganador:ganador.nombre,

                perdedor:perdedor.nombre,

                ganadorID:ganador.socket.id,

                perdedorID:perdedor.socket.id

            });

            delete partidas[partida.id];

            return;

        }

        // ==========================================
        // CAMBIAR TURNO
        // ==========================================

        if(partida.jugadores[0].socket.id == socket.id){

            partida.turno = partida.jugadores[1].socket.id;

        }else{

            partida.turno = partida.jugadores[0].socket.id;

        }

io.to(partida.id).emit("actualizarTablero",{

    tablero:partida.tablero,

    turno:partida.turno,

    casilla:datos.casilla

});

});

    // ==========================================
    // DESCONECTAR
    // ==========================================

    socket.on("disconnect",()=>{

        jugadoresOnline--;

        io.emit("online",jugadoresOnline);

        for(let i=cola.length-1;i>=0;i--){

            if(cola[i].socket.id==socket.id){

                cola.splice(i,1);

            }

        }

        console.log("Jugador desconectado");

    });

});

server.listen(3000,()=>{

    console.log("Servidor iniciado en puerto 3000");

});