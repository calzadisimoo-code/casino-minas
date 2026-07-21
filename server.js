const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();

app.use(express.json());

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

let partidaEspectada = null;
let partidaDemo = null;

const nombresDemo = [

"Camilo",
"Juan",
"Daniel",
"Sebastian",
"Nicolas",
"Santiago",
"Mateo",
"Sara",
"Laura",
"Sofia",
"Valentina",
"Alejandra"

];

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

            puntos:500,

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

function crearPartidaDemo(){

    const tablero = crearTablero();

    const jugadores=[

        {

            nombre:nombresDemo[
                Math.floor(Math.random()*nombresDemo.length)
            ]

        },

        {

            nombre:nombresDemo[
                Math.floor(Math.random()*nombresDemo.length)
            ]

        }

    ];

    const apuestas=[

        10000,
        20000,
        50000,
        100000,
        200000,
        500000,
        1000000

    ];

    partidaDemo={

        jugadores,

        apuesta:

        apuestas[
            Math.floor(Math.random()*apuestas.length)
        ],

        tablero,

        turno:0,

        terminada:false

    };

}

function moverDemo(){

    if(!partidaDemo) return;

    if(partidaDemo.terminada) return;

    const libres = partidaDemo.tablero.filter(c=>!c.abierta);

    if(libres.length==0){

        crearPartidaDemo();

        io.emit("partidaDemo",partidaDemo);

        return;

    }

    let indice;

    do{

        indice=Math.floor(Math.random()*25);

    }while(partidaDemo.tablero[indice].abierta);

    partidaDemo.tablero[indice].abierta=true;

    io.emit("partidaDemo",partidaDemo);

    if(partidaDemo.tablero[indice].tipo=="mina"){

        partidaDemo.terminada=true;

        io.emit("demoGanador",{

            ganador:

            partidaDemo.jugadores[

                Math.floor(Math.random()*2)

            ].nombre

        });

        setTimeout(()=>{

            crearPartidaDemo();

            io.emit("partidaDemo",partidaDemo);

        },3000);

    }

}

function enviarDemo(socket){

    if(!partidaDemo){

        crearPartidaDemo();

    }

    socket.emit(

        "partidaDemo",

        partidaDemo

    );

}

function enviarMesas(){

    console.log("===== ENVIANDO MESAS =====");
    console.log(mesas);

    io.emit("listaMesas", mesas);

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
    nombre:j1.nombre,
    foto:j1.foto || ""
},

{
    socket:j2.socket,
    googleId:j2.googleId,
    nombre:j2.nombre,
    foto:j2.foto || ""
}

]

    };

j1.socket.join(id);

if(j2.socket){

    j2.socket.join(id);

}

setTimeout(()=>{

    const jugador1 = usuarios[j1.googleId];

    jugador1.puntos -= apuesta;

    guardarUsuarios();

    j1.socket.emit("misPuntos",{

        puntos: jugador1.puntos

    });

    if(j2.socket){

        const jugador2 = usuarios[j2.googleId];

        jugador2.puntos -= apuesta;

        guardarUsuarios();

        j2.socket.emit("misPuntos",{

            puntos: jugador2.puntos

        });

    }
	
	console.log("✅ ENVIANDO PARTIDA", id);
	
	console.log(io.sockets.adapter.rooms.get(id));

    io.to(id).emit("partidaEncontrada",{

        partida:id,

        apuesta,

        tablero,

        jugador1:j1.nombre,
        foto1:j1.foto,

        jugador2:j2.nombre,
        foto2:j2.foto,

        turno:j1.socket.id

    });

    io.except(id).emit("partidaEncontrada",{

        partida:id,

        apuesta,

        tablero,

        jugador1:j1.nombre,
        foto1:j1.foto,

        jugador2:j2.nombre,
        foto2:j2.foto,

        turno:"espectador"

    });

    partidaEspectada = id;

},100);

partidaEspectada = id;

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

console.log("MESA AGREGADA");
console.log(mesas);

enviarMesas();
	
setTimeout(()=>{

    const sigue = mesas.find(m=>m.id===mesa.id);

    if(!sigue) return;

    crearPartida(

        {

            socket,

            googleId:mesa.googleId,

            nombre:mesa.nombre,

            foto:mesa.foto

        },

        {

            socket:null,

            googleId:"BOT",

            nombre:nombresDemo[
                Math.floor(Math.random()*nombresDemo.length)
            ],

            foto:""

        },

        mesa.apuesta

    );

    /* const indice = mesas.findIndex(m=>m.id==mesa.id);

    if(indice!=-1){

        mesas.splice(indice,1);

    }

    enviarMesas();*/

},ESPERA_BOT);
	
	console.log("Mesa creada:", mesa);
console.log("Todas las mesas:", mesas);

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
	
	console.log("ID recibido:", datos.mesa);
console.log("Mesas actuales:", mesas);

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

socket.on("solicitarRetiro",(datos)=>{
	
	console.log("LLEGÓ RETIRO:", datos);

    const jugador = usuarios[datos.googleId];

    if(!jugador){

        socket.emit("mensaje","Usuario no encontrado.");

        return;

    }

    if(jugador.puntos < datos.monto){

        socket.emit("mensaje","❌ No tienes saldo suficiente.");

        return;

    }

    jugador.puntos -= datos.monto;

    guardarUsuarios();

    socket.emit("misPuntos",{

        puntos: jugador.puntos

    });

    socket.emit("mensaje",
`✅ Solicitud enviada correctamente.

Tu retiro de $${datos.monto.toLocaleString("es-CO")} fue recibido.

Recibirás el dinero entre 1 y 24 horas.`);
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
	enviarDemo(socket);

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

    const jugador = {

        socket,
        googleId:datos.googleId,
        nombre:datos.nombre,
        foto:datos.foto,
        apuesta

    };

    cola.push(jugador);

    socket.emit("esperando");

setTimeout(()=>{

    const sigue = mesas.find(m=>m.id===mesa.id);

    if(!sigue){

        return;

    }

    // Si todavía nadie la aceptó,
    // recién aquí crea la partida con el bot.

    crearPartida(

        {
            socket,
            googleId:mesa.googleId,
            nombre:mesa.nombre,
            foto:mesa.foto
        },

        {
            socket:null,
            googleId:"BOT",
            nombre:nombresDemo[
                Math.floor(Math.random()*nombresDemo.length)
            ],
            foto:""
        },

        mesa.apuesta

    );

    const indice = mesas.findIndex(m=>m.id===mesa.id);

    if(indice!=-1){

        mesas.splice(indice,1);

    }

    enviarMesas();

},5000);

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
		const bot = partida.jugadores.find(j=>!j.socket);

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

if(ganador.googleId!="BOT"){

    const ganadorBD = usuarios[ganador.googleId];

    ganadorBD.puntos += partida.apuesta * 1.5;

    ganadorBD.victorias++;

    guardarUsuarios();

    ganador.socket.emit("misPuntos",{

        puntos: ganadorBD.puntos

    });

}

if(perdedor.googleId!="BOT"){

    const perdedorBD = usuarios[perdedor.googleId];

    perdedorBD.derrotas++;

    guardarUsuarios();

    perdedor.socket.emit("misPuntos",{

        puntos: perdedorBD.puntos

    });

}
io.to(partida.id).emit("finPartida",{

    tablero:partida.tablero,

    casilla:datos.casilla,

    ganador:ganador.nombre,

    perdedor:perdedor.nombre,

    ganadorID: ganador.socket ? ganador.socket.id : "BOT",

    perdedorID: perdedor.socket ? perdedor.socket.id : "BOT"

});

io.except(partida.id).emit("finPartida",{

    tablero:partida.tablero,

    casilla:datos.casilla,

    ganador:ganador.nombre,

    perdedor:perdedor.nombre,

    ganadorID: ganador.socket ? ganador.socket.id : "BOT",

    perdedorID: perdedor.socket ? perdedor.socket.id : "BOT"

});

io.emit("actualizarTablero",{

    tablero:partida.tablero,

    turno:partida.turno,

    casilla:datos.casilla

});

setTimeout(()=>{
	
	partidaEspectada = null;

    delete partidas[partida.id];

    if(Object.keys(partidas).length==0){

        crearPartidaDemo();

        io.emit("partidaDemo",partidaDemo);

    }

},5000);

return;

        }

        // ==========================================
        // CAMBIAR TURNO
        // ==========================================

if(bot){

    partida.turno = "BOT";

}else if(partida.jugadores[0].socket.id == socket.id){

    partida.turno = partida.jugadores[1].socket.id;

}else{

    partida.turno = partida.jugadores[0].socket.id;

}

io.emit("actualizarTablero",{

    tablero:partida.tablero,

    turno:partida.turno,

    casilla:datos.casilla

});

io.emit("actualizarEspectadores",{

    partida:partida.id,

    tablero:partida.tablero,

    turno:partida.turno,

    casilla:datos.casilla

});

io.emit("actualizarEspectadores",{

    partida:partida.id,

    tablero:partida.tablero,

    turno:partida.turno,

    casilla:datos.casilla

});

if(partida.turno=="BOT"){

    setTimeout(()=>{

        if(partida.terminada) return;

        const libres = [];

        for(let i=0;i<25;i++){

            if(!partida.tablero[i].abierta){

                libres.push(i);

            }

        }

        if(libres.length==0){

            return;

        }

        const indice = libres[
            Math.floor(Math.random()*libres.length)
        ];

        const casilla = partida.tablero[indice];

        casilla.abierta = true;

        if(casilla.tipo=="mina"){

            partida.terminada = true;

            const ganador = partida.jugadores[0];

            const ganadorBD = usuarios[ganador.googleId];

            ganadorBD.puntos += partida.apuesta * 1.5;

            ganadorBD.victorias++;

            guardarUsuarios();

            ganador.socket.emit("misPuntos",{

                puntos:ganadorBD.puntos

            });

            io.to(partida.id).emit("finPartida",{

                tablero:partida.tablero,

                casilla:indice,

                ganador:ganador.nombre,

                perdedor:"Bot",

                ganadorID:ganador.socket.id,

                perdedorID:"BOT"

            });

            delete partidas[partida.id];

            return;

        }

        partida.turno = partida.jugadores[0].socket.id;

        io.emit("actualizarTablero",{

            tablero:partida.tablero,

            turno:partida.turno,

            casilla:indice

        });

    },1000);

}

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

setInterval(()=>{

    if(Object.keys(partidas).length>0) return;

    moverDemo();

},2500);

app.post("/webhook/wompi",(req,res)=>{

    console.log("=== EVENTO WOMPI ===");
    console.log(req.body);

    res.sendStatus(200);

});

server.listen(3000,()=>{

    console.log("Servidor iniciado en puerto 3000");

});