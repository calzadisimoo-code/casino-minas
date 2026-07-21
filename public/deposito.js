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

    socket.emit("nuevoDeposito",{

        googleId:usuarioGoogle.sub,

        nombre:usuarioGoogle.name,

        monto:depositoActual.monto,

        metodo:depositoActual.metodo,

        referencia:depositoActual.referencia

    });

    cerrarPopup();

    alert("Tu depósito quedó pendiente de aprobación.");

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

    socket.emit("solicitarRetiro",{

        googleId: usuarioGoogle.sub,

        nombre: usuarioGoogle.name,

        monto,

        metodo: metodo.value

    });

}