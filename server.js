// Aufsetzen des Servers und deklarieren verschiedener Abhängigkeiten
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
  response.sendFile(path.join(__dirname, 'Website.html'));



});


// Server startet auf Port 3000
server.listen(3000, function () {
  console.log('server start auf port 3000');
});

// Festlegen aller Variablen
var Spieler = {};
var Verbindungen = [];
var ball = {};
var los = 0;
var xRichtung;
var yRichtung;
var runde = 0;
var punkteSP1 = 0;
var punkteSP2 = 0;
var spielLaeuft = false;
var spielerAnzahl = 0;

// Legt die Ballgeschwindigkeit fest
var ballGeschwX = 3;
var ballGeschwY = 3;

// Anstoßfunktion um den Ball wieder in die Mitte des Bildschirms zu setzen
function Anstoss() {
  ball.x = 300;
  ball.y = 250;
  los = 0;
  ballGeschwX = -ballGeschwX;
  ballGeschwY = -ballGeschwY;
}


io.on('connection', function (socket) {

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
          if (++punkteSP1 < 20) {
            // noch keine 20 Punkte erreicht, Spiel geht somit weiter
            Anstoss();
            runde++;
          } else {
            // Spieler 1 ist Sieger, Spiel beenden
            runde++;
            ball = {};
            spielLaeuft = false;
            io.sockets.emit('status', Spieler, ball, runde, punkteSP1, punkteSP2);
            io.sockets.emit('gameOver', 'Spieler1', punkteSP1);
          }
        }
      }


      if (ball.x < 5) {
        if (ball.y > test.y && ball.y < test.y + 60) {
          xRichtung = -xRichtung

        }

        if (ball.x < -20) {
          if (++punkteSP2 < 20) {
            // noch keine 20 Punkte erreicht, Spiel geht somit weiter
            Anstoss();
            runde++;
          } else {
            // Spieler 2 ist Sieger, Spiel beenden
            runde++;
            ball = {};
            spielLaeuft = false;
            io.sockets.emit('status', Spieler, ball, runde, punkteSP1, punkteSP2);
            io.sockets.emit('gameOver', 'Spieler2', punkteSP2);
          }
        }
      }

    }

    ball.x = ball.x - xRichtung
    ball.y = ball.y - yRichtung

  });

  socket.on('neuerSpieler', function () {
    var spielerNummer;
    var neueAnmeldung = false;

    if (Spieler[socket.id] == null) {
      // unbekannter Spieler, sortiere liste der Spieler nach nummer
      for (spielerNummer = 1; spielerNummer <= spielerAnzahl; spielerNummer++) {
        if (Verbindungen[spielerNummer] == null)
          break;
      }
    } else {
      // bekannter Spieler
      spielerNummer = Spieler[socket.id].nummer;
    }

    // Ein Spieler wird nun beim Eintritt einer Seite zugewiesen, dabei kommt der 1. Spieler immer nach links
    switch (spielerNummer) {
      case 1:
        Spieler[socket.id] = {
          x: 0,
          y: 250,
          nummer: spielerNummer
        };
        Verbindungen[spielerNummer] = Spieler[socket.id];
        console.log(spielerNummer + '. Spieler connected');
        socket.emit('status', Spieler, {}, 0, 0, 0);
        neueAnmeldung = true;
        spielerAnzahl++;
        break;
        
    // Ist der linke Platz belegt, wird der nächste sich verbindende Spieler, den rechten Platz erhalten
      case 2:
        Spieler[socket.id] = {
          x: 595,
          y: 250,
          nummer: 2
        };
        Verbindungen[spielerNummer] = Spieler[socket.id];
        console.log(spielerNummer + '. Spieler connected');
        socket.emit('status', Spieler, {}, 0, 0, 0);
        neueAnmeldung = true;
        spielerAnzahl++;
        break;
      default:
        return;
    }

    console.log(spielerAnzahl);
    console.log(Spieler[socket.id]);

    if ((spielerAnzahl == 2) && neueAnmeldung) {
      // sobald zwei Spieler angemeldet sind, startet das Spiel
      punkteSP1 = 0;
      punkteSP2 = 0;
      runde = 0;
      ball = {
        x: 300,
        y: 250
      };
      spielLaeuft = true;
    }
  });

  // Socket - Funktion um die Tastendrücke aus der spiel.js in Bewegungen der Spieler, durch ändern der x und y Werte, verwenden zu können
  // socket.on wartet auf das Event "bewegungSpieler"
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
        player.y -= 0, 1;
      }
    }
  });

  // Disconnected ein Spieler aus dem Spiel, soll seine Spielfigur gelöscht werden
  socket.on('disconnect', function () {
    if (Spieler[socket.id] != null) {
      console.log(Spieler[socket.id].nummer + '. Spieler disconnected');
      delete Verbindungen[Spieler[socket.id].nummer];
      delete Spieler[socket.id];
      spielerAnzahl--;
    }
  });
});


// Sendet das Event mit dem Namen "satus" des Spielers, des Balls, der Runde und der Punkte in einem 60 FPS Intervall an den Client
setInterval(function () {
  // Sobald das Spiel zu Ende ist, wird der Status nicht mehr übertragen
  if (spielLaeuft) {
    io.sockets.emit('status', Spieler, ball, runde, punkteSP1, punkteSP2);
  }
}, 1000 / 60);
