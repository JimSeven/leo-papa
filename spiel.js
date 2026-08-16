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
  groesse: 60, // so hoch ist der Mensch von Kopf bis Fuß
  farbe: "#ffd23f", // dieselbe Farbe steckt auch in favicon.svg
  hautfarbe: "#f3c58c",
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
// Der Controller
// ---------------------------------------------------------------------------

// Ein Controller muss nicht angemeldet werden: Sobald einer verbunden ist,
// taucht er hier auf, und Tastatur und Controller gehen beide weiter.

const TOTZONE = 0.25; // ein Stick steht nie ganz genau auf null

// Die Liste hat feste Steckplätze und enthält Löcher (null). Ein Controller
// erscheint darin je nach Browser erst, nachdem das Spielfenster vorne war und
// ein Knopf gedrückt wurde — deshalb wird jedes Bild neu nachgesehen statt sich
// auf `gamepadconnected` zu verlassen. Fällt der aktive weg, greift von selbst
// der nächste.
function alleControllern() {
  return [...(navigator.getGamepads?.() ?? [])].filter(Boolean);
}

function controller() {
  return alleControllern().find((pad) => pad.connected) ?? null;
}

// Billige Controller legen den linken Stick mal auf die Achsen 0/1, mal auf
// 2/3. Beide Paare werden gelesen — dann läuft die Figur in jedem Fall, und bei
// einem normalen Controller tut eben der rechte Stick dasselbe.
function controllerRichtung(pad) {
  let x = 0;
  let y = 0;
  for (const [links, hoch] of [
    [0, 1],
    [2, 3],
  ]) {
    if (Math.abs(pad.axes[links] ?? 0) > TOTZONE) x += pad.axes[links];
    if (Math.abs(pad.axes[hoch] ?? 0) > TOTZONE) y += pad.axes[hoch];
  }

  // Das Steuerkreuz liegt im Standard-Layout auf den Knöpfen 12 bis 15.
  if (pad.buttons[12]?.pressed) y -= 1;
  if (pad.buttons[13]?.pressed) y += 1;
  if (pad.buttons[14]?.pressed) x -= 1;
  if (pad.buttons[15]?.pressed) x += 1;

  return { x, y };
}

// Sagt Bescheid, sobald ein Controller da ist. Das Ereignis dafür kommt erst,
// wenn das Spielfenster vorne ist und ein Knopf gedrückt wurde — deshalb wird
// stattdessen in jedem Bild nachgesehen, ob einer antwortet.
let controllerMeldungBis = 0;
let controllerWarDa = false;

// ---------------------------------------------------------------------------
// Controller-Diagnose (Taste g)
// ---------------------------------------------------------------------------

// Für Papa, wenn ein Controller nicht tut. Zeigt roh, was der Browser meldet —
// die drei häufigsten Ursachen (Fenster nicht vorne, noch kein Knopf gedrückt,
// abweichende Achsen) sind hier direkt ablesbar.

const diagnose = document.getElementById("diagnose");
let diagnoseOffen = new URL(location.href).searchParams.has("debug");

function zahl(wert) {
  return (wert < 0 ? "" : " ") + wert.toFixed(2);
}

function diagnoseText() {
  if (!navigator.getGamepads) return "Dieser Browser kann keine Controller.";

  const zeilen = [
    `Fenster vorne:  ${document.hasFocus() ? "ja" : "NEIN — hier reinklicken!"}`,
    `Steckplätze:    ${(navigator.getGamepads() ?? []).length}`,
    "",
  ];

  const pads = alleControllern();
  if (pads.length === 0) {
    zeilen.push(
      "Kein Controller zu sehen.",
      "",
      "Der Browser rückt ihn erst raus, wenn dieses Fenster vorne ist",
      "und danach ein Knopf am Controller gedrückt wurde. Also: hier",
      "reinklicken, dann am Controller drücken.",
    );
    return zeilen.join("\n");
  }

  for (const pad of pads) {
    const gedrueckte = pad.buttons
      .map((knopf, nr) => (knopf.pressed ? nr : null))
      .filter((nr) => nr !== null);
    zeilen.push(
      `[${pad.index}] ${pad.id}`,
      `     mapping: ${pad.mapping || "(leer)"}   verbunden: ${pad.connected ? "ja" : "nein"}`,
      `     Achsen (${pad.axes.length}):  ${[...pad.axes].map(zahl).join("  ")}`,
      `     Knöpfe (${pad.buttons.length}): ${gedrueckte.length ? gedrueckte.join(", ") : "keiner gedrückt"}`,
      "",
    );
  }

  const pad = controller();
  if (pad) {
    const richtung = controllerRichtung(pad);
    zeilen.push(`Daraus wird: links/rechts ${zahl(richtung.x)}   hoch/runter ${zahl(richtung.y)}`);
  }
  return zeilen.join("\n");
}

function diagnoseZeichnen() {
  diagnose.hidden = !diagnoseOffen;
  if (diagnoseOffen) diagnose.textContent = diagnoseText();
}

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
  else if (taste(e) === "g") diagnoseOffen = !diagnoseOffen; // Controller-Diagnose
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

// Solange er läuft, tickt `laufZeit` weiter — daraus entstehen die Schritte in
// `menschZeichnen`. Bleibt er stehen, wird sie nicht zurückgesetzt: beim
// nächsten Losgehen macht er dort weiter, statt zu zucken.
const SCHRITTE_PRO_SEKUNDE = 1.6;
let laufZeit = 0;
let laeuft = false;

function bewegen(sekunden) {
  laeuft = false;
  if (ideenOffen) return; // beim Lesen der Liste steht die Figur still

  let xRichtung = 0;
  let yRichtung = 0;

  for (const taste of gedrueckt) {
    const richtung = RICHTUNGEN[taste];
    if (!richtung) continue;
    xRichtung += richtung[0];
    yRichtung += richtung[1];
  }

  const pad = controller();
  if (pad) {
    if (!controllerWarDa) {
      controllerWarDa = true;
      controllerMeldungBis = performance.now() + 3000;
    }
    const vomStick = controllerRichtung(pad);
    xRichtung += vomStick.x;
    yRichtung += vomStick.y;
  }

  if (xRichtung === 0 && yRichtung === 0) return;
  schonBewegt = true;
  laeuft = true;
  laufZeit += sekunden;

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

// Der Mensch wird aus lauter kleinen Strichen und einem Kreis gebaut. Alle Maße
// hängen an `figur.groesse` — wird die größer, wächst er mit.
function menschZeichnen(x, y) {
  const hoch = figur.groesse;
  // Der Schritt: -1 heißt linkes Bein vorn, +1 rechtes. Steht er still, ist er
  // 0 und alles hängt gerade runter.
  const schritt = laeuft ? Math.sin(laufZeit * SCHRITTE_PRO_SEKUNDE * Math.PI * 2) : 0;
  const wippen = Math.abs(schritt) * hoch * 0.03; // beim Schritt sackt er kurz ab

  y += wippen;
  const oben = y - hoch / 2; // hier fängt der Kopf an
  const kopf = hoch * 0.22; // Größe vom Kopf
  const strich = Math.max(3, hoch * 0.1); // wie dick die Arme und Beine sind

  const schulter = oben + kopf * 2; // wo die Arme dranhängen
  const huefte = oben + hoch * 0.62; // wo die Beine anfangen

  const ausschlag = hoch * 0.16 * schritt; // so weit gehen Arme und Beine vor

  // Kopf
  stift.fillStyle = figur.hautfarbe;
  stift.beginPath();
  stift.arc(x, oben + kopf, kopf, 0, Math.PI * 2);
  stift.fill();

  // Körper, Arme und Beine
  stift.strokeStyle = figur.farbe;
  stift.lineWidth = strich;
  stift.lineCap = "round";

  stift.beginPath();
  stift.moveTo(x, oben + kopf * 2); // Hals
  stift.lineTo(x, huefte); // Bauch

  // Arme und Beine gehen gegengleich: rechter Arm vor, linkes Bein vor.
  stift.moveTo(x - hoch * 0.25 - ausschlag, schulter + hoch * 0.12); // linke Hand
  stift.lineTo(x, schulter);
  stift.lineTo(x + hoch * 0.25 + ausschlag, schulter + hoch * 0.12); // rechte Hand

  stift.moveTo(x - hoch * 0.18 + ausschlag, y + hoch / 2); // linker Fuß
  stift.lineTo(x, huefte);
  stift.lineTo(x + hoch * 0.18 - ausschlag, y + hoch / 2); // rechter Fuß
  stift.stroke();
}

function zeichnen() {
  stift.fillStyle = HINTERGRUND;
  stift.fillRect(0, 0, innerWidth, innerHeight);

  menschZeichnen(figur.x, figur.y);

  stift.font = "24px system-ui, sans-serif";
  stift.textAlign = "center";
  stift.textBaseline = "alphabetic";

  if (performance.now() < controllerMeldungBis) {
    stift.fillStyle = "#ffd23f";
    stift.fillText("Controller ist da!", innerWidth / 2, innerHeight - 60);
  } else if (!schonBewegt) {
    stift.fillStyle = "#7d8598";
    stift.fillText("Drück die Pfeiltasten", innerWidth / 2, innerHeight - 60);
  }
}

let vorherigeZeit = performance.now();

function schleife(jetzt) {
  const sekunden = Math.min((jetzt - vorherigeZeit) / 1000, 0.1); // nach einem Tab-Wechsel nicht springen
  vorherigeZeit = jetzt;

  bewegen(sekunden);
  zeichnen();
  diagnoseZeichnen();

  requestAnimationFrame(schleife);
}

requestAnimationFrame(schleife);
