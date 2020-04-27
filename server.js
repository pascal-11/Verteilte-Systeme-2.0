// Aufsetzen des Servers und verschiedener Abhängigkeiten
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 3000);
app.use('/static', express.static(__dirname + '/static'));


app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));

});

// Server startet auf Port 3000
server.listen(3000, function () {
  console.log('server start auf port 3000');
});

// Festlegen aller Variablen
var nummer = 0;
var Spieler = {};
var ball = {};
var los = 0;
var xRichtung;
var yRichtung;
var runde = 0;
var punkteSP1 = 0;
var punkteSP2 = 0;

// Legt die Ballgeschwindigkeit fest
var ballGeschwX = 3;
var ballGeschwY = 3;

// Anstoßfunktion um den Ball wieder in die Mitte des Bildschirms zu setzen
function Anstoss() {
  ball.x = 300;
  ball.y = 250;
  los = 0;
}


io.on('connection', function (socket) {

  // Sorgt dafür, dass der Ball erst "anstößt" sobald zwei Spieler(in diesem Fall dann nummer == 1) verbunden sind
  if (nummer == 1) {
    ball = {
      x: 300,
      y: 250,
    }
  }

  // Server hört auf Events mit einem bestimmten Namen
  socket.on('bewegungBall', function (data) {

    //Beinhaltet die Logik für die Bewegung des Balls
    var player = Spieler[socket.id] || {};
    if (los == 0) {
      yRichtung = ballGeschwX;
      xRichtung = ballGeschwY;
    }

    // ändert die Variable "los" sobald der Ball die obere oder untere Decke der Spielfläche berührt
    if (ball.y < 0) {
      los = 1;
    }
    if (ball.y > 495) {
      los = 2
    }
    if (los == 1) {
      yRichtung = -ballGeschwX;
    }
    if (los == 2) {
      yRichtung = ballGeschwY;
    }

    // Logik für das Abprallen des Balles an den Schlägern der Spieler
    for (var paddles in Spieler) {
      var test = Spieler[paddles]
      if (ball.x > 595) {
        if (ball.y > test.y && ball.y < test.y + 60) {
          xRichtung = -xRichtung;

          // Lässt den Ball zurücksetzen und erhöht den Punktezähler des Torschützen sowie den Rundezähler um 1
        } 
        if (ball.x > 620) {
          Anstoss();
          runde++;
          punkteSP1++;
        }
      }


      if (ball.x < 5) {
        if (ball.y > test.y && ball.y < test.y + 60) {
          xRichtung = -xRichtung

        } 
        
        if (ball.x < -20) {
          Anstoss();
          runde++;
          punkteSP2++;
        }
      }

    }

    ball.x = ball.x - xRichtung
    ball.y = ball.y - yRichtung

  });


  // Socket - Funktion, um auf das Event "neuer Spieler" zu "hören"
  socket.on('neuer Spieler', function () {

    // Variable nummer sogrt dafür, dass sobald der linke Spieler belegt ist, der nächste Spieler der rechten Seite zugewisen wird
    if (nummer == 0) {

      Spieler[socket.id] = {
        x: 0,
        y: 250,
      };
    }

    if (nummer == 1) {
      Spieler[socket.id] = {
        x: 595,
        y: 250,
      }
    }
    nummer++;
  });

  // Socket - Funktion um die Tastendrücke aus der spiel.js in Bewegungen der Spieler, durch ändern der x und y Werte, verwenden zu können
  // socket.on wartet auf das Event "bewegungSPieler"
  socket.on('bewegungSpieler', function (data) {
    var player = Spieler[socket.id] || {};

    // Je nach erhaltenen Informationen durch die Tastendrücke in spiel.js, trifft eine der if-Abfragen zu und bewegt dabei den SPieler
    if (data.hoch) {
      if (player.y > 0) {
        player.y -= 5;
      } else {
        player.y = 0;
      }
    }

    if (data.runter) {
      if (player.y < 440) {
        player.y += 5;
      } else {
        player.y -= 0, 1; //Bug (Spielfigur verschwindet nach unter und taucht aus der Decke wieder auf) tritt auf wenn player.y = 0 gesetzt
      }
    }
  });

  // Disconnected ein Spieler aus dem Spiel, soll seine SPielfigur gelöscht werden
  socket.on('disconnect', function () {
    delete Spieler[socket.id];
    nummer = 0;
  });
});


// Sendet das Event mit dem Namen "satus" des Spielers, des Balls, der Runde und der Punkte in einem 60 FPS Intervall an den Client
setInterval(function () {
  io.sockets.emit('status', Spieler, ball, runde, punkteSP1, punkteSP2);
}, 1000 / 60);
