const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

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
const mesas = [];

// Partidas activas
const partidas = {};

// Puntos de cada jugador
const ARCHIVO = "./usuarios.json";
const ARCHIVO_DEPOSITOS = "./depositos.json";

let usuarios = {};
let depositos = [];

if(fs.existsSync(ARCHIVO)){

    usuarios = JSON.parse(fs.readFileSync(ARCHIVO));

}else{

    fs.writeFileSync(ARCHIVO,"{}");

}

if(fs.existsSync(ARCHIVO_DEPOSITOS)){

    depositos = JSON.parse(
        fs.readFileSync(ARCHIVO_DEPOSITOS)
    );

}else{

    fs.writeFileSync(
        ARCHIVO_DEPOSITOS,
        "[]"
    );

}

if(fs.existsSync(ARCHIVO)){

    usuarios = JSON.parse(fs.readFileSync(ARCHIVO));

}else{

    fs.writeFileSync(ARCHIVO,"{}");

}

function guardarUsuarios(){

    fs.writeFileSync(

        ARCHIVO,

        JSON.stringify(usuarios,null,4)

    );

}

function guardarDepositos(){

    fs.writeFileSync(

        ARCHIVO_DEPOSITOS,

        JSON.stringify(depositos,null,4)

    );

}

function obtenerJugador(googleId,nombre,foto){

    if(!usuarios[googleId]){

        usuarios[googleId]={

            googleId,

            nombre,

            foto,

            puntos:10000,

            victorias:0,

            derrotas:0

        };

        guardarUsuarios();

    }

    return usuarios[googleId];

}

function crearTablero(){

    const tablero = [];

    for(let i=0;i<25;i++){

        tablero.push({

            abierta:false,

            tipo:"diamante"

        });

    }

    const posiciones = new Set();

while(posiciones.size < 2){

    posiciones.add(Math.floor(Math.random()*25));

}

for(const pos of posiciones){

    tablero[pos].tipo = "mina";

}

    return tablero;

}

function enviarMesas(){

    io.emit("listaMesas",mesas);

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

        googleId:j1.googleId,

        nombre:j1.nombre

    },

    {

        socket:j2.socket,

        googleId:j2.googleId,

        nombre:j2.nombre

    }

]

    };

    j1.socket.join(id);
    j2.socket.join(id);
	
const jugador1 = usuarios[j1.googleId];
const jugador2 = usuarios[j2.googleId];

jugador1.puntos -= apuesta;
jugador2.puntos -= apuesta;

guardarUsuarios();

j1.socket.emit("misPuntos",{
    puntos: jugador1.puntos
});

j2.socket.emit("misPuntos",{
    puntos: jugador2.puntos
});

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
	
	socket.on("crearMesa",(datos)=>{

    const jugador = obtenerJugador(

        datos.googleId,

        datos.nombre,

        datos.foto

    );

    if(jugador.puntos < datos.apuesta){

        socket.emit(

            "mensaje",

            "No tienes puntos suficientes"

        );

        return;

    }

    const mesa={

        id:Date.now(),

        socket:socket.id,

        googleId:datos.googleId,

        nombre:datos.nombre,

        foto:datos.foto,

        apuesta:datos.apuesta

    };

    mesas.push(mesa);

    enviarMesas();

});

socket.on("cancelarMesa",()=>{

    const indice = mesas.findIndex(

        m=>m.socket==socket.id

    );

    if(indice!=-1){

        mesas.splice(indice,1);

    }

    enviarMesas();

});

socket.on("aceptarMesa",(datos)=>{

    const mesa = mesas.find(m=>m.id==datos.mesa);

    if(!mesa){

        socket.emit(
            "mensaje",
            "Esta mesa ya no está disponible."
        );

        return;

    }

    if(mesa.socket==socket.id){

        socket.emit(
            "mensaje",
            "No puedes aceptar tu propia mesa."
        );

        return;

    }

    const jugador2 = obtenerJugador(

        socket.googleId,

        usuarios[socket.googleId].nombre,

        usuarios[socket.googleId].foto

    );

    if(jugador2.puntos < mesa.apuesta){

        socket.emit(
            "mensaje",
            "No tienes puntos suficientes."
        );

        return;

    }

    const creador = io.sockets.sockets.get(mesa.socket);

    if(!creador){

        mesas.splice(
            mesas.indexOf(mesa),
            1
        );

        enviarMesas();

        socket.emit(
            "mensaje",
            "El creador ya se desconectó."
        );

        return;

    }

    mesas.splice(
        mesas.indexOf(mesa),
        1
    );

    enviarMesas();

    crearPartida(

        {

            socket:creador,

            googleId:mesa.googleId,

            nombre:mesa.nombre

        },

        {

            socket,

            googleId:socket.googleId,

            nombre:usuarios[socket.googleId].nombre

        },

        mesa.apuesta

    );

});
	
	socket.on("nuevoDeposito",(datos)=>{

    depositos.push({

        id:Date.now(),

        googleId:datos.googleId,

        nombre:datos.nombre,

        monto:datos.monto,

        metodo:datos.metodo,

        referencia:datos.referencia,

        estado:"Pendiente",

        fecha:new Date().toLocaleString("es-CO")

    });

    guardarDepositos();

    socket.emit(

        "mensaje",

        "Solicitud enviada correctamente."

    );

});

    jugadoresOnline++;

    io.emit("online",jugadoresOnline);
	
	socket.on("cargarUsuario",(datos)=>{

    const jugador = obtenerJugador(

        datos.googleId,

        datos.nombre,

        datos.foto

    );

    jugador.nombre = datos.nombre;
    jugador.foto = datos.foto;

    socket.googleId = datos.googleId;

    guardarUsuarios();

    socket.emit("misPuntos",{

        puntos: jugador.puntos

    });

});

    socket.on("buscarPartida",(datos)=>{
		
		const jugador = obtenerJugador(

    datos.googleId,

    datos.nombre,

    datos.foto

);

jugador.nombre = datos.nombre;

jugador.foto = datos.foto;

socket.googleId = datos.googleId;

socket.emit("misPuntos",{

    puntos: jugador.puntos

});

guardarUsuarios();

        const apuesta = Number(datos.apuesta);

        if(apuesta<=0){

            socket.emit("mensaje","Apuesta inválida");

            return;

        }

        if(jugador.puntos < apuesta){

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

        googleId:datos.googleId,

        nombre:datos.nombre,

        foto:datos.foto

    },

    apuesta

);

        }else{

            cola.push({

    socket,

    googleId:datos.googleId,

    nombre:datos.nombre,

    foto:datos.foto,

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

            const ganadorBD = usuarios[ganador.googleId];
const perdedorBD = usuarios[perdedor.googleId];

ganadorBD.puntos += partida.apuesta * 2;
ganadorBD.victorias++;

perdedorBD.derrotas++;

guardarUsuarios();

ganador.socket.emit("misPuntos",{
    puntos: ganadorBD.puntos
});

perdedor.socket.emit("misPuntos",{
    puntos: perdedorBD.puntos
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
		
enviarMesas();

        for(let i=cola.length-1;i>=0;i--){

            if(cola[i].socket.id==socket.id){

                cola.splice(i,1);

            }

        }
		
		const indiceMesa = mesas.findIndex(

    m=>m.socket==socket.id

);

if(indiceMesa!=-1){

    mesas.splice(indiceMesa,1);

    enviarMesas();

}

        console.log("Jugador desconectado");

    });

});

server.listen(3000,()=>{

    console.log("Servidor iniciado en puerto 3000");

});