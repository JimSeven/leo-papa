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
// Die Ideenliste (Taste i)
// ---------------------------------------------------------------------------

// Was Leopold geparkt hat, steht in SPIELSTAND.md — derselben Datei, die die KI
// zwischen den Sessions liest. Hier wird sie nur angezeigt, nie geschrieben.

const ideenLayer = document.getElementById("ideen");
const ideenNaechstes = ideenLayer.querySelector(".naechstes");
const ideenListe = ideenLayer.querySelector("ul");
const ideenLeer = ideenLayer.querySelector(".leer");

let ideenOffen = false;
let letzterStand = "";

// Alles zwischen "## <name>" und der nächsten Überschrift. Der Parser darf so
// naiv sein, weil nur die KI in die Datei schreibt.
function abschnitt(text, name) {
  const teil = text.split(/^## +/m).find((t) => t.startsWith(name));
  return teil ? teil.slice(name.length).trim() : "";
}

// "- [x] Flauschi kann fliegen" → { fertig: true, text: "Flauschi kann fliegen" }
function punkte(roh) {
  return roh
    .split("\n")
    .map((zeile) => zeile.trim())
    .filter((zeile) => zeile.startsWith("- "))
    .map((zeile) => zeile.slice(2).trim())
    .map((zeile) => ({
      fertig: /^\[x\]/i.test(zeile),
      text: zeile.replace(/^\[[ x]\] */i, ""),
    }));
}

function ideenZeigen(text) {
  const naechstes = abschnitt(text, "Nächstes Mal")
    .split("\n")[0]
    .replace(/^- */, "")
    .trim();
  ideenNaechstes.textContent = `Nächstes Mal: ${naechstes}`;
  ideenNaechstes.hidden = !naechstes;

  // Offenes zuerst. Gebautes bleibt abgehakt stehen — es ist der sichtbare
  // Beweis, dass seine Ideen ankommen —, aber nicht im Weg.
  const alle = punkte(abschnitt(text, "Ideenliste"));
  const sortiert = [...alle.filter((p) => !p.fertig), ...alle.filter((p) => p.fertig)];

  ideenListe.replaceChildren(
    ...sortiert.map(({ fertig, text }) => {
      const zeile = document.createElement("li");
      zeile.textContent = text;
      if (fertig) zeile.className = "fertig";
      return zeile;
    }),
  );
  ideenLeer.hidden = sortiert.length > 0;
}

// Bei jedem Öffnen neu lesen: was gerade eben geparkt wurde, soll sofort
// dastehen. Der Zeitstempel umgeht denselben Pages-Cache wie in index.html.
async function ideenLaden() {
  try {
    const antwort = await fetch(`./SPIELSTAND.md?stand=${Date.now()}`);
    if (!antwort.ok) return;
    letzterStand = await antwort.text();
    if (ideenOffen) ideenZeigen(letzterStand);
  } catch {
    // Keine Verbindung, keine Datei — dann bleibt der letzte Stand stehen.
    // Am Lesen der Liste darf das Spiel nicht sterben.
  }
}

function ideenUmschalten(offen) {
  ideenOffen = offen;
  ideenLayer.hidden = !offen;
  gedrueckt.clear(); // in beide Richtungen: keine Taste soll das Lesen überdauern
  if (!offen) return;
  ideenZeigen(letzterStand);
  ideenLaden();
}

// Eigener Listener, damit die Steuerung oben unberührt bleibt. Zum Schließen
// tut es auch ein Klick — die naheliegendste Geste, wenn man weiterspielen will.
addEventListener("keydown", (e) => {
  if (taste(e) === "i") ideenUmschalten(!ideenOffen);
  else if (e.key === "Escape") ideenUmschalten(false);
});
ideenLayer.addEventListener("pointerdown", () => ideenUmschalten(false));

ideenUmschalten(false); // Startzustand aus dem Code, nicht bloß aus dem hidden im HTML
ideenLaden(); // die Liste steht bereit, bevor er das erste Mal i drückt

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
  if (ideenOffen) return; // beim Lesen der Liste steht die Figur still

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
