const socket = io();

const tablero = document.getElementById("tablero");
const btnJugar = document.getElementById("jugar");
const nombre = document.getElementById("nombre");
const apuesta = document.getElementById("apuesta");
const estado = document.getElementById("estado");
const activos = document.getElementById("activos");

let miSocket = "";
let miPartida = "";
let miTurno = false;

socket.on("connect", () => {
    miSocket = socket.id;
});

btnJugar.onclick = () => {

    if (nombre.value == "") {
        alert("Escribe tu nombre");
        return;
    }

    if (apuesta.value == "") {
        alert("Escribe una apuesta");
        return;
    }

    socket.emit("buscarPartida", {
        nombre: nombre.value,
        apuesta: Number(apuesta.value)
    });

};

socket.on("online", (cantidad) => {

    activos.innerHTML = cantidad;

});

socket.on("esperando", () => {

    estado.innerHTML = "⏳ Esperando rival...";

});

socket.on("partidaEncontrada", (datos) => {

    miPartida = datos.partida;

    miTurno = datos.turno == miSocket;

    estado.innerHTML = `

        <h2>

        ${datos.jugador1}

        <br>

        VS

        <br>

        ${datos.jugador2}

        </h2>

        <h3>Apuesta ${datos.apuesta}</h3>

        <h3 id="turno"></h3>

    `;

    dibujar(datos.tablero);

    actualizarTurno();

});

socket.on("actualizar", (datos) => {

    miTurno = datos.turno == miSocket;

    dibujar(datos.tablero);

    actualizarTurno();

});

socket.on("mina", (datos) => {

    const casilla = document.getElementById("c" + datos.casilla);

    casilla.innerHTML = "💥";

    if (datos.perdedor == miSocket) {

        alert("Perdiste");

    } else {

        alert("Ganaste");

    }

});

function actualizarTurno() {

    const turno = document.getElementById("turno");

    if (!turno) return;

    turno.innerHTML = miTurno
        ? "🟢 Es tu turno"
        : "🔴 Turno del rival";

}

function dibujar(tab) {

    tablero.innerHTML = "";

    tab.forEach((casilla, i) => {

        const div = document.createElement("div");

        div.className = "casilla";

        div.id = "c" + i;

        if (casilla.abierta) {

            div.style.background = "#16a34a";

        }

        div.onclick = () => {

            if (!miTurno) return;

            socket.emit("abrirCasilla", {

                partida: miPartida,

                casilla: i

            });

        };

        tablero.appendChild(div);

    });

}