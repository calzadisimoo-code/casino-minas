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

function continuarRetiro(){

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
	
	const numeroCuenta = document.getElementById("numeroCuenta").value.trim();

if(numeroCuenta == ""){

    alert("Ingresa el número de la cuenta donde recibirás el dinero.");

    return;

}

socket.emit("solicitarRetiro",{

    googleId: usuarioGoogle.sub,

    nombre: usuarioGoogle.name,

    monto,

    metodo: metodo.value,

    numeroCuenta

});

}

socket.on("mensaje",(texto)=>{

    alert(texto);

});

document.querySelectorAll('input[name="metodo"]').forEach(r=>{

    r.onchange=()=>{

        const logo=document.getElementById("logoMetodo");

        if(r.value=="Nequi"){

            logo.innerHTML="<img src='https://seeklogo.com/images/N/nequi-logo-58A4F84B13-seeklogo.com.png' width='80'>";

        }

        if(r.value=="Daviplata"){

            logo.innerHTML="<img src='https://upload.wikimedia.org/wikipedia/commons/4/49/Daviplata_logo.png' width='120'>";

        }

        if(r.value=="Bancolombia"){

            logo.innerHTML="<img src='https://upload.wikimedia.org/wikipedia/commons/8/8f/Bancolombia_logo.svg' width='150'>";

        }

    }

});