var socket = io();

var bewegung = {
  hoch: false,
  runter: false,
};


//Erstellt das Event "keydown", durch welches anhand des keyCodes der Tastatur, die Bewegung für auf oder ab auf true gesetzt wird.
// Je nachdem welcher case eintritt, wird das Ergebnis später an den Server gesendet, um den Boolean der Bewegungen in eigentlich Änderungen der x-Achse umzusetzen
document.addEventListener('keydown', function (event) {
  switch (event.keyCode) {

    case 87: // für Taste "W"
      bewegung.hoch = true;
      break;
    case 83: // für Taste "S"
      bewegung.runter = true;
      break;

  }
});

// Event welches erkennt, wenn Taste wieder losgelassen wird
document.addEventListener('keyup', function (event) {
  switch (event.keyCode) {

    case 87: // W
      bewegung.hoch = false;
      break;

    case 83: // S
      bewegung.runter = false;
      break;
  }
});

// Sendet die Events "neuer Spieler" und "startBall" an den Server
socket.emit('neuerSpieler');


// Schleife, welche die Ballbewegung und den oben in den keydown und keyup Events geänderten Boolean an den Server überträgt ()Übertragungsrate = 60 mal in der Sekunde)
setInterval(function () {
  socket.emit('bewegungSpieler', bewegung);
  socket.emit("bewegungBall");
}, 1000 / 60);



// greift auf ein HTML Element mit einer bestimmten ID zu (hier "Canvas")
var canvas = document.getElementById('canvas');

//Breite und Höheparameter der Variable canvas
canvas.width = 600;
canvas.height = 500;

// getContext('2d') ermöglicht das zweidimensionale zeichnen (Jede Zeichnung hat einen x-Achsen und einen y-Achsen Wert)
var ctx = canvas.getContext('2d');

// Wartet auf das Event "status", welches Informationen zum Spieler, dem Ball, der Rundenzahl und den Spielerpunkten enthält
socket.on('status', function (Spieler, ball, runde, punkteSP1, punkteSP2) {

  // Bevor die Objekte neu gezeichnet werden, wird erst die Spielfläche "geräumt"
  ctx.clearRect(0, 0, 600, 500);


  ctx.fillStyle = 'black';
  for (var id in Spieler) {
    var player = Spieler[id];

    ctx.beginPath();

    //zeichnet die Spieler, mit einem x- und y-Wert, sowie einer Höhe und Breite für die Spielfiguren
    ctx.rect(player.x, player.y, 5, 60)
    ctx.rect(ball.x, ball.y, 15, 15)


    //zeichnet die Umgebung und die Punktestände
    ctx.font = "30px Monaco";

    ctx.fillText("ROUND:", 220, 50)
    ctx.fillText(runde, 370, 50)


    ctx.fillText(":", 298, 100)

    ctx.fillText(punkteSP1, 262, 100)

    ctx.fillText(punkteSP2, 323, 100)

    ctx.fill();
  }

});

socket.on('gameOver', function (spielerName, punkte) {
  ctx.fillText('Game Over', 220, 400);
  ctx.fillText('Sieger ist ' + spielerName, 100, 450);
  ctx.fill();
});
