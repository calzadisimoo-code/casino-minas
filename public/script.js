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
let viendoDemo = true;

let mesas = [];
let buscandoMesa = false;

const linkPago = "https://checkout.wompi.co/l/VPOS_hP5CXs";

document.getElementById("depositar").onclick = () => {

    window.open(linkPago,"_blank");

};

document.getElementById("btnDepositarModal").onclick = () => {

    window.open(linkPago,"_blank");

};

socket.on("connect",()=>{

    miSocket = socket.id;

    socket.emit("pedirMesas");

});


btnJugar.onclick = ()=>{
	
	if(!usuarioGoogle){

    document.getElementById("loginGoogle").scrollIntoView({

        behavior:"smooth",

        block:"center"

    });

    alert("Primero inicia sesión con Google.");

    return;

}

    if(!usuarioGoogle){

        alert("Primero inicia sesión con Google");

        return;

    }


    buscandoMesa = true;

    socket.emit("crearMesa",{

        googleId: usuarioGoogle.sub,

        nombre: usuarioGoogle.name,

        foto: usuarioGoogle.picture,

        apuesta: Number(apuesta.value || 0)

    });

    document.getElementById("pantallaBusqueda").style.display="flex";

};

socket.on("online",(cantidad)=>{

    activos.innerHTML = cantidad;

});

socket.on("misPuntos",(datos)=>{

    misPuntos.innerHTML = Number(datos.puntos).toLocaleString("es-CO");

});

socket.on("partidaDemo",(datos)=>{

    if(miPartida!="") return;

    viendoDemo = true;

    document.getElementById("nombreJugador1").innerHTML =
    datos.jugadores[0].nombre;

    document.getElementById("nombreJugador2").innerHTML =
    datos.jugadores[1].nombre;

    document.getElementById("saldoJugador1").innerHTML =
    "$"+Number(datos.apuesta).toLocaleString("es-CO");

    document.getElementById("saldoJugador2").innerHTML =
    "$"+Number(datos.apuesta).toLocaleString("es-CO");

    document.getElementById("premioPartida").innerHTML =
"$"+Number(datos.apuesta*1.5).toLocaleString("es-CO");
	
crearAvatar(

    "fotoJugador1",

    datos.jugadores[0].nombre

);

crearAvatar(

    "fotoJugador2",

    datos.jugadores[1].nombre

);

    dibujarTablero(datos.tablero);

});

socket.on("demoGanador",(datos)=>{

    if(miPartida!="") return;

    mostrarResultado(

        "🏆 "+datos.ganador+" GANÓ",

        "ganar"

    );

});

socket.on("mensaje",(texto)=>{

    alert(texto);

});

socket.on("esperando",()=>{

    document.getElementById("esperando").style.display="flex";

});

socket.on("partidaEncontrada",(datos)=>{
	
	buscandoMesa = false;
	
	document.getElementById("premioPartida").innerHTML =
"$"+Number(datos.apuesta*1.5).toLocaleString("es-CO");
	
	viendoDemo = false;
	document.getElementById("pantallaResultado").style.display="none";

    document.getElementById("esperando").style.display="none";

    document.getElementById("pantallaBusqueda").style.display="none";

if(datos.turno=="espectador"){

    viendoDemo = false;

    miPartida = "";

    miTurno = false;

    document.getElementById("panelJuego").style.display = "flex";

    document.getElementById("turno").innerHTML = "👀 Espectando";

}else{

    viendoDemo = false;

    miPartida = datos.partida;

    miTurno = datos.turno == miSocket;

    document.getElementById("panelJuego").style.display = "none";

    buscandoMesa = false;

    actualizarTurno();

}
	
	document.getElementById("nombreJugador1").innerHTML = datos.jugador1;

document.getElementById("nombreJugador2").innerHTML = datos.jugador2;

console.log(datos);

document.getElementById("fotoJugador1").src = datos.foto1;

document.getElementById("fotoJugador2").src = datos.foto2;

document.getElementById("saldoJugador1").innerHTML =
"$"+Number(datos.apuesta).toLocaleString("es-CO");

document.getElementById("saldoJugador2").innerHTML =
"$"+Number(datos.apuesta).toLocaleString("es-CO");

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
	
if(miPartida==""){

    mostrarResultado("🏆 " + datos.ganador + " GANÓ","ganar");

    setTimeout(()=>{

        viendoDemo = true;

        actualizarTurno();

    },3000);

    return;

}

   if(datos.ganadorID==miSocket){

    mostrarResultado(

        "🏆 GANASTE",

        "ganar"

    );

}else{

    mostrarResultado(

        "💥 PERDISTE",

        "perder"

    );

}

setTimeout(()=>{

    miPartida = "";

    miTurno = false;

    viendoDemo = true;

    apuesta.value = "";
	
	const ESPERA_BOT = 5000;

    document.getElementById("panelJuego").style.display = "flex";

    actualizarTurno();

},3000);

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

    if(viendoDemo) return;

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

function crearAvatar(id,nombre){

    const foto = document.getElementById(id);

    const inicial = nombre.trim().charAt(0).toUpperCase();

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100%" height="100%" fill="#2563eb"/>
        <text x="50%" y="54%"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="55"
            fill="white"
            font-family="Arial"
            font-weight="bold">
            ${inicial}
        </text>
    </svg>`;

    foto.src =
    "data:image/svg+xml;charset=UTF-8,"+
    encodeURIComponent(svg);

}

// ==========================================
// ACTUALIZAR TURNO
// ==========================================


// ==========================================
// ACTUALIZAR TURNO
// ==========================================

function actualizarTurno(){

    const turno = document.getElementById("turno");

    if(!turno) return;

if(miPartida==""){

    if(buscandoMesa){

        turno.innerHTML="";

    }else{

        turno.innerHTML="👀 Espectando";

    }

    return;

}

    if(miTurno){

        turno.innerHTML="🟢 Tu turno";

    }else{

        turno.innerHTML="🔴 Turno del rival";

    }

}
// ==========================================
// LOGIN GOOGLE
// ==========================================

window.onload = ()=>{

    const guardado = localStorage.getItem("usuarioGoogle");

    document.getElementById("juego").style.display = "block";

    if(guardado){

        usuarioGoogle = JSON.parse(guardado);

        document.getElementById("loginGoogle").style.display = "none";

        document.getElementById("nombreUsuario").innerHTML =
        usuarioGoogle.name;

        document.getElementById("foto").src =
        usuarioGoogle.picture;

        document.getElementById("foto").onclick =
        abrirPerfil;

        socket.emit("cargarUsuario",{

            googleId: usuarioGoogle.sub,

            nombre: usuarioGoogle.name,

            foto: usuarioGoogle.picture

        });

}else{

    document.getElementById("loginGoogle").style.display = "flex";

    document.getElementById("popupBono").style.display = "flex";

    setTimeout(()=>{

        socket.emit("pedirMesas");

    },300);

}

    google.accounts.id.initialize({

        client_id:"758592725329-b0d58g87fn5ihqpu3fp32b7ok6lo1ida.apps.googleusercontent.com",

        callback:loginGoogle

    });

    if(!usuarioGoogle){

        google.accounts.id.prompt();

        google.accounts.id.renderButton(

            document.getElementById("loginGoogle"),

            {

                theme:"filled_blue",

                size:"large",

                width:260

            }

        );

    }

    dibujarTablero(

        Array(25).fill({

            abierta:false,

            tipo:"diamante"

        })

    );
	
	viendoDemo = true;
miPartida = "";
miTurno = false;

actualizarTurno();

setTimeout(()=>{

    socket.emit("pedirMesas");

},500);

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

document.getElementById("btnRetirar").onclick=()=>{

    window.location.href="/retiro.html";

};

const popupMesa = document.getElementById("popupMesa");

const popupNombre = document.getElementById("popupNombre");

const popupTexto = document.getElementById("popupTexto");

const popupAceptar = document.getElementById("popupAceptar");

function actualizarListaMesas(lista){

    mesas = lista;

    if(!listaMesas) return;

    listaMesas.innerHTML = "";

    lista.forEach(mesa=>{

if(usuarioGoogle){

    if(mesa.googleId == usuarioGoogle.sub){

        return;

    }

}

        const div = document.createElement("div");

        div.className = "mesa";

        div.innerHTML = `

<div class="nombreMesa">

👤 ${mesa.nombre}

</div>

<div class="textoMesa">
Quiere apostar $${Number(mesa.apuesta).toLocaleString("es-CO")} ¿Aceptas?
</div>

<button
class="btnAceptar"
onclick="aceptarMesa(${mesa.id})">

🎰 ACEPTAR

</button>

`;

        listaMesas.appendChild(div);

    });

    // 👇 PEGA TODO ESTO AQUÍ

  const mesa = lista.find(m=>{

    return !usuarioGoogle || m.googleId != usuarioGoogle.sub;

});

if(mesa){

    popupNombre.innerHTML =
    "🎰 ¡DESAFÍO!";

popupTexto.innerHTML =
`${mesa.nombre} quiere apostar contigo $${Number(mesa.apuesta).toLocaleString("es-CO")} ¿Aceptas?`;

popupAceptar.onclick = ()=>{

    if(!usuarioGoogle){

        alert("🔐 Primero debes iniciar sesión con Google para aceptar el desafío.");

        document.getElementById("loginGoogle").scrollIntoView({

            behavior:"smooth",

            block:"center"

        });

        google.accounts.id.prompt();

        return;

    }

    if(miPartida!=""){

        alert("⚠️ Primero termina tu partida actual.");

        return;

    }

    popupMesa.style.display="none";

    aceptarMesa(mesa.id);

};

    popupMesa.style.display="block";

}else{

    popupMesa.style.display="none";

}

    // 👆 HASTA AQUÍ

}

socket.on("listaMesas",(lista)=>{

    console.log("📢 RECIBÍ LISTA DE MESAS:", lista);

    actualizarListaMesas(lista);

});

function aceptarMesa(id){

    if(miPartida!=""){

        alert("⚠️ Primero termina tu partida actual.");

        return;

    }

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

function mostrarResultado(texto,clase){

    const pantalla = document.getElementById("pantallaResultado");

    const titulo = document.getElementById("textoResultado");

    titulo.className = clase;

    titulo.innerHTML = texto;

    pantalla.style.display="flex";

    setTimeout(()=>{

        pantalla.style.display = "none";

    },3000);

}

const musica = document.getElementById("musicaCasino");

function iniciarMusica(){

    musica.volume = 0.2;

    musica.play().catch(()=>{});

    document.removeEventListener("pointerdown", iniciarMusica);
    document.removeEventListener("touchstart", iniciarMusica);
    document.removeEventListener("click", iniciarMusica);

}

document.addEventListener("pointerdown", iniciarMusica);
document.addEventListener("touchstart", iniciarMusica);
document.addEventListener("click", iniciarMusica);

document.getElementById("btnRecibirBono").onclick=()=>{

    document.getElementById("popupBono").style.display="none";

    document.getElementById("loginGoogle").scrollIntoView({

        behavior:"smooth",

        block:"center"

    });

    socket.emit("pedirMesas");

};