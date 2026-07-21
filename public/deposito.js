alert("deposito.js cargó");
const socket = io();

let usuarioGoogle = JSON.parse(
    localStorage.getItem("usuarioGoogle")
);

function ponerMonto(valor){

    document.getElementById("monto").value = valor;

}

let depositoActual = {};

function continuar(){

    const monto = Number(document.getElementById("monto").value);

    if(monto < 10000){

        alert("El depósito mínimo es de $10.000");

        return;

    }

    const metodo = document.querySelector('input[name="metodo"]:checked');

    if(!metodo){

        alert("Selecciona un método de pago");

        return;

    }

    const referencia =

        "RC-" +

        Math.floor(

            100000 + Math.random()*900000

        );

    depositoActual={

        monto,

        metodo:metodo.value,

        referencia

    };

    document.getElementById("valor").innerHTML=

        "$ " + monto.toLocaleString("es-CO");

    document.getElementById("metodoElegido").innerHTML=

        metodo.value;

    document.getElementById("referencia").innerHTML=

        referencia;

    document.getElementById("popup").style.display="flex";

}

function cerrarPopup(){

    document.getElementById("popup").style.display="none";

}

function confirmarPago(){


    const monto = Number(document.getElementById("monto").value);

    if(monto <= 0){

        alert("Ingresa un monto válido.");

        return;

    }

    const metodo = document.querySelector('input[name="metodo"]:checked');

    if(!metodo){

        alert("Selecciona un método.");

        return;

    }
	
	console.log("Conectado:", socket.connected);
    console.log(usuarioGoogle);

    socket.emit("solicitarRetiro",{

        googleId: usuarioGoogle.sub,

        nombre: usuarioGoogle.name,

        monto,

        metodo: metodo.value

    });

}

socket.on("mensaje",(texto)=>{

    alert(texto);

});