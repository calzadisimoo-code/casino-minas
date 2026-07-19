const socket = io();

const tablero = document.getElementById("tablero");

const btnJugar = document.getElementById("jugar");

const nombre = document.getElementById("nombre");

const apuesta = document.getElementById("apuesta");

const estado = document.getElementById("estado");

const activos = document.getElementById("activos");

for(let i=0;i<25;i++){

    const casilla=document.createElement("div");

    casilla.className="casilla";

    casilla.id="casilla"+i;

    tablero.appendChild(casilla);

}

btnJugar.onclick=()=>{

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

}

socket.on("online",(cantidad)=>{

    activos.innerHTML=cantidad;

});

socket.on("esperando",()=>{

    estado.innerHTML="⏳ Esperando rival...";

});

socket.on("partidaEncontrada",(datos)=>{

    estado.innerHTML=`

<h2>

${datos.jugador1}

<br>

VS

<br>

${datos.jugador2}

</h2>

<h3>

Apuesta:

${datos.apuesta}

</h3>

`;

});