const socket = io();

const tablero = document.getElementById("tablero");
const btnJugar = document.getElementById("jugar");
const apuesta = document.getElementById("apuesta");

const estado = document.getElementById("estado");
const activos = document.getElementById("activos");
const misPuntos = document.getElementById("misPuntos");
const btnDepositar = document.getElementById("depositar");

const listaMesas = document.getElementById("listaMesasBusqueda");
const btnCancelar = document.getElementById("cancelarBusqueda");

let miSocket = "";
let miPartida = "";
let miTurno = false;
let usuarioGoogle = null;

let mesas = [];
let buscandoMesa = false;

socket.on("connect",()=>{

    miSocket = socket.id;

});

   btnDepositar.onclick = ()=>{

    window.location.href = "/deposito.html";

};

btnJugar.onclick = ()=>{

    if(!usuarioGoogle){

        alert("Primero inicia sesión con Google");

        return;

    }

    if(apuesta.value==""){

        alert("Escribe una apuesta");

        return;

    }

    buscandoMesa = true;

    socket.emit("crearMesa",{

        googleId: usuarioGoogle.sub,

        nombre: usuarioGoogle.name,

        foto: usuarioGoogle.picture,

        apuesta:Number(apuesta.value)

    });

    document.getElementById("pantallaBusqueda").style.display="flex";

};

socket.on("online",(cantidad)=>{

    activos.innerHTML = cantidad;

});

socket.on("misPuntos",(datos)=>{

    misPuntos.innerHTML = Number(datos.puntos).toLocaleString("es-CO");

});

socket.on("mensaje",(texto)=>{

    alert(texto);

});

socket.on("esperando",()=>{

    document.getElementById("esperando").style.display="flex";

});

socket.on("partidaEncontrada",(datos)=>{

    document.getElementById("esperando").style.display="none";

    document.getElementById("pantallaBusqueda").style.display="none";

    miPartida = datos.partida;

    document.getElementById("panelJuego").style.display="none";

    miTurno = datos.turno == miSocket;

    estado.innerHTML=`
        <h2>${datos.jugador1}</h2>
        <h3>VS</h3>
        <h2>${datos.jugador2}</h2>
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
	
	document.getElementById("esperando").style.display="none";

    miTurno = false;

    dibujarTablero(datos.tablero);

    const mina = document.getElementById("c"+datos.casilla);

    if(mina){

        mina.innerHTML="💥";

        mina.style.background="#d90429";

    }

    if(datos.ganadorID==miSocket){

        estado.innerHTML=`

            <h2 class="ganaste">🏆 GANASTE</h2>

            <h3>Ganaste la apuesta</h3>

        `;

    }else{

        estado.innerHTML=`

            <h2>💥 PERDISTE</h2>

            <h3>La mina explotó</h3>

        `;

    }

    document.getElementById("panelJuego").style.display = "block";

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

    if(casilla.tipo=="diamante"){

        div.innerHTML="💎";
        div.style.background="#16a34a";

    }else{

        div.innerHTML="💣";
        div.style.background="#d90429";

    }

}

div.onclick=()=>{

    if(miPartida=="") return;

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

// ==========================================
// LOGIN GOOGLE
// ==========================================

window.onload = ()=>{
	
	const guardado = localStorage.getItem("usuarioGoogle");

if(guardado){

    usuarioGoogle = JSON.parse(guardado);

    document.getElementById("loginGoogle").style.display="none";

    document.getElementById("juego").style.display="block";

    document.getElementById("nombreUsuario").innerHTML = usuarioGoogle.name;

    document.getElementById("foto").src = usuarioGoogle.picture;
	document.getElementById("foto").onclick = abrirPerfil;

    socket.emit("cargarUsuario",{

        googleId: usuarioGoogle.sub,

        nombre: usuarioGoogle.name,

        foto: usuarioGoogle.picture

    });

}

    google.accounts.id.initialize({

        client_id:"758592725329-b0d58g87fn5ihqpu3fp32b7ok6lo1ida.apps.googleusercontent.com",

        callback:loginGoogle

    });
	
	google.accounts.id.prompt();

    google.accounts.id.renderButton(

        document.getElementById("loginGoogle"),

        {

            theme:"filled_blue",

            size:"large",

            width:260

        }

    );

    dibujarTablero(

        Array(25).fill({

            abierta:false,

            tipo:"diamante"

        })

    );

};

function loginGoogle(response){

    console.log("LOGIN EJECUTADO");

    const datos = JSON.parse(atob(response.credential.split(".")[1]));

    console.log(datos);

    usuarioGoogle = datos;
	
	localStorage.setItem(

    "usuarioGoogle",

    JSON.stringify(datos)

);
	
	socket.emit("cargarUsuario",{

    googleId: datos.sub,

    nombre: datos.name,

    foto: datos.picture

});

    document.getElementById("loginGoogle").style.display = "none";

    document.getElementById("juego").style.display = "block";

    document.getElementById("nombreUsuario").innerHTML = datos.name;

    document.getElementById("foto").src = datos.picture;
	document.getElementById("foto").onclick = abrirPerfil;

}

function abrirPerfil(){

    document.getElementById("fotoPerfilModal").src =
    usuarioGoogle.picture;

    document.getElementById("nombrePerfil").innerHTML =
    usuarioGoogle.name;

    document.getElementById("modalPerfil").style.display="flex";

}

function cerrarPerfil(){

    document.getElementById("modalPerfil").style.display="none";

}

document.getElementById("btnDepositarModal").onclick=()=>{

    window.location.href="/deposito.html";

};

document.getElementById("btnRetirar").onclick=()=>{

    window.location.href="/retiro.html";

};

function actualizarListaMesas(lista){

    mesas = lista;

    if(!listaMesas) return;

    listaMesas.innerHTML = "";

    lista.forEach(mesa=>{

    if(usuarioGoogle && mesa.googleId == usuarioGoogle.sub){

        return;

    }

    const div = document.createElement("div");

    div.className = "mesa";

    div.innerHTML = 

<div class="nombreMesa">

👤 ${mesa.nombre}

</div>

<div class="textoMesa"> Quiere apostar $${Number(mesa.apuesta).toLocaleString("es-CO")} ¿Aceptas?

</div>

<button
class="btnAceptar"
onclick="aceptarMesa(${mesa.id})">

🎰 ACEPTAR

</button>

`;

        listaMesas.appendChild(div);

    });

}

socket.on("listaMesas",(lista)=>{

    actualizarListaMesas(lista);

});

function aceptarMesa(id){

    socket.emit("aceptarMesa",{

        mesa:id

    });

}

function cancelarBusqueda(){

    buscandoMesa=false;

    socket.emit("cancelarMesa");

    document.getElementById("pantallaBusqueda").style.display="none";

}

btnCancelar.onclick=()=>{

    cancelarBusqueda();

};