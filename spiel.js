// Leopolds Spiel.
//
// Noch ist hier nichts als ein Quadrat, das sich bewegen lässt — alles
// Weitere entsteht in den Bau-Sessions. Die Abschnitte unten sind die
// Landmarken: wer etwas ändern will, sucht die passende Überschrift.

const bild = document.getElementById("bild");
const stift = bild.getContext("2d");

// ---------------------------------------------------------------------------
// So sieht die Figur aus
// ---------------------------------------------------------------------------

const figur = {
  x: 0, // wird beim Start in die Mitte gesetzt
  y: 0,
  groesse: 60,
  farbe: "#ffd23f", // dieselbe Farbe steckt auch in favicon.svg
  tempo: 420, // Pixel pro Sekunde
};

const HINTERGRUND = "#10131a";

// ---------------------------------------------------------------------------
// So wird gesteuert
// ---------------------------------------------------------------------------

// Schlüssel durchgehend klein — siehe `taste()` weiter unten.
const RICHTUNGEN = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  s: [0, 1],
};

const gedrueckt = new Set();
let schonBewegt = false;

// Immer kleingeschrieben merken: mit Shift oder CapsLock meldet die Tastatur
// beim Loslassen "A" statt "a", und die Figur liefe sonst ewig weiter.
const taste = (e) => e.key.toLowerCase();

addEventListener("keydown", (e) => {
  gedrueckt.add(taste(e));
  if (RICHTUNGEN[taste(e)]) e.preventDefault(); // Pfeiltasten sollen die Seite nicht scrollen
});
addEventListener("keyup", (e) => gedrueckt.delete(taste(e)));
addEventListener("blur", () => gedrueckt.clear()); // Fenster verlassen = alle Tasten los

// ---------------------------------------------------------------------------
// Die Zeichenfläche füllt immer das ganze Fenster
// ---------------------------------------------------------------------------

document.body.style.background = HINTERGRUND; // Farbe steht nur hier, nicht auch im CSS

function flaecheAnpassen() {
  const schaerfe = devicePixelRatio || 1;
  bild.width = innerWidth * schaerfe;
  bild.height = innerHeight * schaerfe;
  bild.style.width = `${innerWidth}px`;
  bild.style.height = `${innerHeight}px`;
  stift.setTransform(schaerfe, 0, 0, schaerfe, 0, 0);
}

addEventListener("resize", flaecheAnpassen);
flaecheAnpassen();

figur.x = innerWidth / 2;
figur.y = innerHeight / 2;

// ---------------------------------------------------------------------------
// Was in jedem Bild passiert
// ---------------------------------------------------------------------------

function bewegen(sekunden) {
  let xRichtung = 0;
  let yRichtung = 0;

  for (const taste of gedrueckt) {
    const richtung = RICHTUNGEN[taste];
    if (!richtung) continue;
    xRichtung += richtung[0];
    yRichtung += richtung[1];
  }

  if (xRichtung === 0 && yRichtung === 0) return;
  schonBewegt = true;

  // Schräg soll nicht schneller sein als gerade.
  const laenge = Math.hypot(xRichtung, yRichtung);
  const strecke = figur.tempo * sekunden;
  figur.x += (xRichtung / laenge) * strecke;
  figur.y += (yRichtung / laenge) * strecke;

  // Am Rand ist Schluss.
  const halb = figur.groesse / 2;
  figur.x = Math.min(Math.max(figur.x, halb), innerWidth - halb);
  figur.y = Math.min(Math.max(figur.y, halb), innerHeight - halb);
}

function zeichnen() {
  stift.fillStyle = HINTERGRUND;
  stift.fillRect(0, 0, innerWidth, innerHeight);

  const halb = figur.groesse / 2;
  stift.fillStyle = figur.farbe;
  stift.fillRect(figur.x - halb, figur.y - halb, figur.groesse, figur.groesse);

  if (!schonBewegt) {
    stift.fillStyle = "#7d8598";
    stift.font = "24px system-ui, sans-serif";
    stift.textAlign = "center";
    stift.fillText("Drück die Pfeiltasten", innerWidth / 2, innerHeight - 60);
  }
}

let vorherigeZeit = performance.now();

function schleife(jetzt) {
  const sekunden = Math.min((jetzt - vorherigeZeit) / 1000, 0.1); // nach einem Tab-Wechsel nicht springen
  vorherigeZeit = jetzt;

  bewegen(sekunden);
  zeichnen();

  requestAnimationFrame(schleife);
}

requestAnimationFrame(schleife);
