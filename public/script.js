const socket = io();

const tablero = document.getElementById("tablero");

for(let i=0;i<25;i++){

const casilla=document.createElement("div");

casilla.className="casilla";

tablero.appendChild(casilla);

}