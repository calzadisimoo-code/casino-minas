const socket = io();

const tablero = document.getElementById("tablero");
const btnJugar = document.getElementById("jugar");
const nombre = document.getElementById("nombre");
const apuesta = document.getElementById("apuesta");

const estado = document.getElementById("estado");
const activos = document.getElementById("activos");
const misPuntos = document.getElementById("misPuntos");

let miSocket = "";
let miPartida = "";
let miTurno = false;

socket.on("connect",()=>{

    miSocket = socket.id;

});

btnJugar.onclick = ()=>{

    if(nombre.value==""){

        alert("Escribe tu nombre");

        return;

    }

    if(apuesta.value==""){

        alert("Escribe una apuesta");

        return;

    }

    socket.emit("buscarPartida",{

        nombre:nombre.value,

        apuesta:Number(apuesta.value)

    });

};

socket.on("online",(cantidad)=>{

    activos.innerHTML = cantidad;

});

socket.on("misPuntos",(datos)=>{

    misPuntos.innerHTML = datos.puntos;

});

socket.on("mensaje",(texto)=>{

    alert(texto);

});

socket.on("esperando",()=>{

    estado.innerHTML = "<h2>⏳ Esperando rival...</h2>";

});

socket.on("partidaEncontrada",(datos)=>{

    miPartida = datos.partida;

    miTurno = datos.turno == miSocket;

    estado.innerHTML = `
        <h2>${datos.jugador1}</h2>
        <h3>VS</h3>
        <h2>${datos.jugador2}</h2>
        <h3 id="turno"></h3>
    `;

    dibujarTablero(datos.tablero);

    actualizarTurno();

});

// ==========================================
// ACTUALIZAR TABLERO
// ==========================================

socket.on("actualizarTablero",(datos)=>{

    miTurno = datos.turno == miSocket;

    dibujarTablero(datos.tablero);

    actualizarTurno();

});

// ==========================================
// FIN DE PARTIDA
// ==========================================

socket.on("finPartida",(datos)=>{

    miTurno = false;

    dibujarTablero(datos.tablero);

    const mina = document.getElementById("c"+datos.casilla);

    if(mina){

        mina.innerHTML="💥";

        mina.style.background="#d90429";

    }

    if(datos.ganadorID==miSocket){

        estado.innerHTML=`

            <h2>🏆 GANASTE</h2>

            <h3>Ganaste la apuesta</h3>

        `;

    }else{

        estado.innerHTML=`

            <h2>💥 PERDISTE</h2>

            <h3>La mina explotó</h3>

        `;

    }

});

// ==========================================
// DIBUJAR TABLERO
// ==========================================

function dibujarTablero(tab){

    tablero.innerHTML="";

    tab.forEach((casilla,i)=>{

        const div=document.createElement("div");

        div.className="casilla";

        div.id="c"+i;

        if(casilla.abierta){

            div.style.background="#16a34a";

            div.innerHTML="✔";

        }

        div.onclick=()=>{

            if(!miTurno) return;

            socket.emit("abrirCasilla",{

                partida:miPartida,

                casilla:i

            });

        };

        tablero.appendChild(div);

    });

}

// ==========================================
// ACTUALIZAR TURNO
// ==========================================

function actualizarTurno(){

    const turno=document.getElementById("turno");

    if(!turno) return;

    if(miTurno){

        turno.innerHTML="🟢 Es tu turno";

    }else{

        turno.innerHTML="🔴 Turno del rival";

    }

}