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
  hutfarbe: "#8b5a2b",
  pistolenfarbe: "#c9ced8",
  stielfarbe: "#a9743d",
  tempo: 420, // Pixel pro Sekunde
};

const HINTERGRUND = "#10131a";

// ---------------------------------------------------------------------------
// So wird gesteuert
// ---------------------------------------------------------------------------

// Zwei Hände, zwei Aufgaben: die Pfeiltasten laufen, W A S D schießen.
// Schlüssel durchgehend klein — siehe `taste()` weiter unten.
const RICHTUNGEN = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
};

const SCHUSS_TASTEN = {
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

// Am Controller gilt dasselbe wie an der Tastatur: eine Hand läuft, die andere
// schießt. Der linke Stick läuft, der rechte zielt und schießt von allein,
// solange er ausgelenkt ist.

// Ein Stick liegt auf zwei Achsen nebeneinander. Steht er in der Mitte,
// kommt {x: 0, y: 0} zurück.
function stick(pad, links, hoch) {
  const x = pad.axes[links] ?? 0;
  const y = pad.axes[hoch] ?? 0;
  return {
    x: Math.abs(x) > TOTZONE ? x : 0,
    y: Math.abs(y) > TOTZONE ? y : 0,
  };
}

function controllerRichtung(pad) {
  const { x, y } = stick(pad, 0, 1);

  // Das Steuerkreuz liegt im Standard-Layout auf den Knöpfen 12 bis 15 und
  // läuft ebenfalls — manche Controller haben gar keinen linken Stick.
  return {
    x: x + (pad.buttons[14]?.pressed ? -1 : 0) + (pad.buttons[15]?.pressed ? 1 : 0),
    y: y + (pad.buttons[12]?.pressed ? -1 : 0) + (pad.buttons[13]?.pressed ? 1 : 0),
  };
}

// Der rechte Stick. Hat der Controller nur zwei Achsen, gibt es ihn nicht —
// dann bleibt der untere Knopf zum Schießen.
function controllerZielen(pad) {
  if (pad.axes.length < 4) return { x: 0, y: 0 };
  return stick(pad, 2, 3);
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
    const laufen = controllerRichtung(pad);
    const zielen = controllerZielen(pad);
    zeilen.push(
      `Laufen (linker Stick):  ${zahl(laufen.x)}  ${zahl(laufen.y)}`,
      `Schießen (rechter Stick): ${zahl(zielen.x)}  ${zahl(zielen.y)}`,
    );
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
// Das Labyrinth
// ---------------------------------------------------------------------------

// Das Labyrinth ist ein Gitter aus Zellen. Jede Zelle merkt sich nur zwei
// Wände — die oben und die links —, denn die rechte Wand einer Zelle ist ja
// schon die linke der Nachbarzelle. Außen kommt einmal rundherum eine Mauer.
//
// Gebaut wird es beim Start (und neu, wenn das Fenster seine Größe ändert):
// von einer Zelle aus wird immer zu einem noch unbesuchten Nachbarn
// durchgebrochen, bis alle dran waren. So bleibt jede Ecke erreichbar — man
// kann sich verlaufen, aber nie einsperren.

const ZELLE = 110; // wie breit ein Gang ist
const MAUER = 14; // wie dick eine Wand ist
const MAUERFARBE = "#3b4a63";
const PLATZ = 22; // so viel Platz braucht der Cowboy um sich herum

let labyrinth = null;

function labyrinthBauen() {
  // Rundherum bleibt etwas Luft, damit man den Cowboy beim Rausgehen noch
  // sieht und der Ausgang nicht am Fensterrand klebt.
  const RAND = 70;
  const spalten = Math.max(3, Math.floor((innerWidth - MAUER - RAND) / ZELLE));
  const zeilen = Math.max(3, Math.floor((innerHeight - MAUER - RAND) / ZELLE));

  // Mittig ins Fenster, damit rundherum gleich viel Rand bleibt.
  const x0 = (innerWidth - spalten * ZELLE) / 2;
  const y0 = (innerHeight - zeilen * ZELLE) / 2;

  const zellen = [];
  for (let i = 0; i < spalten * zeilen; i++) {
    zellen.push({ oben: true, links: true, besucht: false });
  }
  const zelle = (c, z) => zellen[z * spalten + c];

  // Durchbrechen, immer tiefer, und zurück, wenn es nicht weitergeht.
  const weg = [{ c: 0, z: 0 }];
  zelle(0, 0).besucht = true;

  while (weg.length > 0) {
    const { c, z } = weg[weg.length - 1];
    const nachbarn = [
      { c, z: z - 1, wand: "oben", hier: true },
      { c, z: z + 1, wand: "oben", hier: false },
      { c: c - 1, z, wand: "links", hier: true },
      { c: c + 1, z, wand: "links", hier: false },
    ].filter((n) => n.c >= 0 && n.c < spalten && n.z >= 0 && n.z < zeilen && !zelle(n.c, n.z).besucht);

    if (nachbarn.length === 0) {
      weg.pop();
      continue;
    }

    const gewaehlt = nachbarn[Math.floor(Math.random() * nachbarn.length)];
    // Die Wand gehört mal dieser Zelle, mal der Nachbarzelle — je nachdem, in
    // welche Richtung es geht.
    if (gewaehlt.hier) zelle(c, z)[gewaehlt.wand] = false;
    else zelle(gewaehlt.c, gewaehlt.z)[gewaehlt.wand] = false;

    zelle(gewaehlt.c, gewaehlt.z).besucht = true;
    weg.push({ c: gewaehlt.c, z: gewaehlt.z });
  }

  // Aus den Wänden werden Rechtecke — die kann man zeichnen und dagegenlaufen.
  const mauern = [];
  const halb = MAUER / 2;
  for (let z = 0; z < zeilen; z++) {
    for (let c = 0; c < spalten; c++) {
      const x = x0 + c * ZELLE;
      const y = y0 + z * ZELLE;
      if (zelle(c, z).oben) mauern.push({ x: x - halb, y: y - halb, b: ZELLE + MAUER, h: MAUER });
      if (zelle(c, z).links) mauern.push({ x: x - halb, y: y - halb, b: MAUER, h: ZELLE + MAUER });
    }
  }
  // Die beiden Außenwände, die keiner Zelle gehören: rechts und unten. Die
  // rechte wird Zeile für Zeile gesetzt — bei der untersten bleibt sie weg,
  // und genau dieses Loch ist der Ausgang.
  const breit = spalten * ZELLE;
  const hoch = zeilen * ZELLE;
  const ausgangZeile = zeilen - 1;
  for (let z = 0; z < zeilen; z++) {
    if (z === ausgangZeile) continue;
    mauern.push({ x: x0 + breit - halb, y: y0 + z * ZELLE - halb, b: MAUER, h: ZELLE + MAUER });
  }
  mauern.push({ x: x0 - halb, y: y0 + hoch - halb, b: breit + MAUER, h: MAUER });

  labyrinth = { spalten, zeilen, x0, y0, mauern, breit, hoch, ausgangZeile };
}

// Die Mitte einer Zelle — dort steht der Cowboy beim Start.
function zellenMitte(c, z) {
  return {
    x: labyrinth.x0 + c * ZELLE + ZELLE / 2,
    y: labyrinth.y0 + z * ZELLE + ZELLE / 2,
  };
}

function stecktInMauer(x, y, rand = PLATZ) {
  return labyrinth.mauern.some(
    (m) => x + rand > m.x && x - rand < m.x + m.b && y + rand > m.y && y - rand < m.y + m.h,
  );
}

// Hinter dem Loch in der rechten Mauer ist er draußen.
function istDraussen() {
  return figur.x > labyrinth.x0 + labyrinth.breit;
}

// Mitten im Loch — dorthin wird der grüne Schein gemalt.
function ausgangMitte() {
  return {
    x: labyrinth.x0 + labyrinth.breit,
    y: labyrinth.y0 + labyrinth.ausgangZeile * ZELLE + ZELLE / 2,
  };
}

// Erst nach links/rechts, dann nach oben/unten — getrennt. So bleibt wer auch
// immer sich bewegt an einer Wand nicht kleben, sondern rutscht an ihr entlang
// weiter.
function verschieben(wer, dx, dy) {
  if (!stecktInMauer(wer.x + dx, wer.y)) wer.x += dx;
  if (!stecktInMauer(wer.x, wer.y + dy)) wer.y += dy;
}

// ---------------------------------------------------------------------------
// Die Zombies
// ---------------------------------------------------------------------------

// Sie sind langsamer als der Cowboy — weglaufen geht also immer. Sie laufen
// stur auf ihn zu und bleiben dabei an Wänden hängen; das Labyrinth ist ihr
// Problem, nicht ihre Fähigkeit.

const ZOMBIE_TEMPO = 95; // Pixel pro Sekunde, deutlich langsamer als der Cowboy
const ZOMBIE_ANZAHL = 6;
const ZOMBIE_GROESSE = 54;
const ZOMBIE_PLATZ = 20;
const SICHERHEITSABSTAND = 260; // so weit weg vom Cowboy tauchen sie auf

const zombies = [];
let abgeballert = 0;

// Ein freier Platz irgendwo im Labyrinth, weit genug weg vom Cowboy.
function freierPlatz() {
  for (let versuch = 0; versuch < 200; versuch++) {
    const c = Math.floor(Math.random() * labyrinth.spalten);
    const z = Math.floor(Math.random() * labyrinth.zeilen);
    const mitte = zellenMitte(c, z);
    if (Math.hypot(mitte.x - figur.x, mitte.y - figur.y) < SICHERHEITSABSTAND) continue;
    return mitte;
  }
  // Sehr kleines Labyrinth: dann eben irgendwo.
  return zellenMitte(labyrinth.spalten - 1, labyrinth.zeilen - 1);
}

function zombieDazu() {
  const platz = freierPlatz();
  zombies.push({ x: platz.x, y: platz.y, wackeln: Math.random() * 10 });
}

function zombiesNeu() {
  zombies.length = 0;
  for (let i = 0; i < ZOMBIE_ANZAHL; i++) zombieDazu();
}

function zombiesBewegen(sekunden) {
  if (ideenOffen) return; // beim Lesen der Liste steht auch bei ihnen alles still

  for (const zombie of zombies) {
    zombie.wackeln += sekunden;

    const dx = figur.x - zombie.x;
    const dy = figur.y - zombie.y;
    const laenge = Math.hypot(dx, dy) || 1;
    const strecke = ZOMBIE_TEMPO * sekunden;
    verschieben(zombie, (dx / laenge) * strecke, (dy / laenge) * strecke);
  }
}

// Trifft eine Kugel einen Zombie, sind beide weg — und ein neuer Zombie taucht
// woanders auf, damit es nie leer wird.
function treffer() {
  for (let k = kugeln.length - 1; k >= 0; k--) {
    const kugel = kugeln[k];
    const getroffen = zombies.findIndex(
      (z) => Math.hypot(z.x - kugel.x, z.y - kugel.y) < ZOMBIE_PLATZ + KUGEL_GROESSE,
    );
    if (getroffen === -1) continue;

    zombies.splice(getroffen, 1);
    kugeln.splice(k, 1);
    abgeballert++;
    zombieDazu();
  }
}

// Wie der Cowboy, nur grün, ohne Hut und mit vorgestreckten Armen. Er schlurft,
// statt zu schwingen — daher das Wackeln um die eigene Achse.
function zombieZeichnen(zombie) {
  const hoch = ZOMBIE_GROESSE;
  const kippen = Math.sin(zombie.wackeln * 3) * 0.12;

  stift.save();
  stift.translate(zombie.x, zombie.y);
  stift.rotate(kippen);

  const oben = -hoch / 2;
  const kopf = hoch * 0.22;
  const schulter = oben + kopf * 2;
  const huefte = oben + hoch * 0.62;

  stift.fillStyle = "#9bd15b";
  stift.beginPath();
  stift.arc(0, oben + kopf, kopf, 0, Math.PI * 2);
  stift.fill();

  stift.strokeStyle = "#5d8f2f";
  stift.lineWidth = Math.max(3, hoch * 0.1);
  stift.lineCap = "round";

  stift.beginPath();
  stift.moveTo(0, oben + kopf * 2);
  stift.lineTo(0, huefte);

  // Beide Arme nach vorn — daran erkennt man einen Zombie.
  stift.moveTo(-hoch * 0.3, schulter - hoch * 0.06);
  stift.lineTo(0, schulter);
  stift.lineTo(hoch * 0.3, schulter - hoch * 0.06);

  stift.moveTo(-hoch * 0.16, hoch / 2);
  stift.lineTo(0, huefte);
  stift.lineTo(hoch * 0.16, hoch / 2);
  stift.stroke();

  stift.restore();
}

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

// Bei einer neuen Fenstergröße passt das alte Labyrinth nicht mehr — es wird
// neu gebaut, und der Cowboy fängt wieder oben links an.
addEventListener("resize", () => {
  flaecheAnpassen();
  labyrinthBauen();
  anDenAnfang();
  zombiesNeu();
});

function anDenAnfang() {
  const start = zellenMitte(0, 0);
  figur.x = start.x;
  figur.y = start.y;
}

// Wer den Ausgang findet, kriegt ein neues Labyrinth — und die Zahl oben links
// zählt eins hoch.
let geschafft = 0;
let geschafftMeldungBis = 0;

function naechstesLabyrinth() {
  geschafft++;
  geschafftMeldungBis = performance.now() + 2500;
  labyrinthBauen();
  anDenAnfang();
  zombiesNeu();
  kugeln.length = 0;
}

flaecheAnpassen();
labyrinthBauen();
anDenAnfang();
zombiesNeu();

// ---------------------------------------------------------------------------
// Was in jedem Bild passiert
// ---------------------------------------------------------------------------

// Solange er läuft, tickt `laufZeit` weiter — daraus entstehen die Schritte in
// `menschZeichnen`. Bleibt er stehen, wird sie nicht zurückgesetzt: beim
// nächsten Losgehen macht er dort weiter, statt zu zucken.
const SCHRITTE_PRO_SEKUNDE = 1.6;
let laufZeit = 0;
let laeuft = false;

// Wohin er guckt. Steht er still, bleibt die letzte Richtung stehen — dorthin
// geht auch der Schuss. Am Anfang guckt er nach rechts.
let blick = { x: 1, y: 0 };

// ---------------------------------------------------------------------------
// Schießen (Leertaste)
// ---------------------------------------------------------------------------

const KUGEL_TEMPO = 900; // Pixel pro Sekunde
const KUGEL_GROESSE = 5;
const NACHLADEN = 0.22; // so lange dauert es bis zum nächsten Schuss

const kugeln = [];
let nachladenBis = 0;

// Ohne Richtung schießt er dahin, wo er gerade hinguckt.
function schiessen(richtung = blick) {
  const jetzt = performance.now() / 1000;
  if (ideenOffen || jetzt < nachladenBis) return;
  nachladenBis = jetzt + NACHLADEN;

  const laenge = Math.hypot(richtung.x, richtung.y) || 1;
  const dx = richtung.x / laenge;
  const dy = richtung.y / laenge;
  blick = { x: dx, y: dy }; // er dreht sich dahin, wo er hinschießt

  // Die Kugel kommt aus der Pistole, nicht aus der Mitte des Cowboys.
  kugeln.push({
    x: figur.x + dx * figur.groesse * 0.45,
    y: figur.y + dy * figur.groesse * 0.45 - figur.groesse * 0.05,
    dx,
    dy,
  });
}

// Gedrückt halten schießt weiter — der Rhythmus kommt vom Nachladen.
function schussTastenPruefen() {
  let x = 0;
  let y = 0;
  for (const taste of gedrueckt) {
    const richtung = SCHUSS_TASTEN[taste];
    if (!richtung) continue;
    x += richtung[0];
    y += richtung[1];
  }

  const pad = controller();
  if (pad) {
    const gezielt = controllerZielen(pad);
    x += gezielt.x;
    y += gezielt.y;
    // Der untere Knopf (A bzw. X) schießt geradeaus — wie die Leertaste.
    if (pad.buttons[0]?.pressed && x === 0 && y === 0) schiessen();
  }

  if (x !== 0 || y !== 0) schiessen({ x, y });
}

function kugelnBewegen(sekunden) {
  for (let i = kugeln.length - 1; i >= 0; i--) {
    const kugel = kugeln[i];
    kugel.x += kugel.dx * KUGEL_TEMPO * sekunden;
    kugel.y += kugel.dy * KUGEL_TEMPO * sekunden;

    // An der Wand ist Schluss — und außerhalb des Fensters erst recht.
    const raus = kugel.x < 0 || kugel.y < 0 || kugel.x > innerWidth || kugel.y > innerHeight;
    if (raus || stecktInMauer(kugel.x, kugel.y, KUGEL_GROESSE)) kugeln.splice(i, 1);
  }
}

addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault(); // die Leertaste soll die Seite nicht scrollen
    schiessen();
  }
});

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
  blick = { x: xRichtung / laenge, y: yRichtung / laenge };

  const strecke = figur.tempo * sekunden;
  verschieben(figur, blick.x * strecke, blick.y * strecke);
}

// Der Mensch wird aus lauter kleinen Strichen und einem Kreis gebaut. Alle Maße
// hängen an `figur.groesse` — wird die größer, wächst er mit.
function menschZeichnen(x, y) {
  // Läuft er nach links, wird alles gespiegelt — sonst würde die Pistole in
  // die falsche Richtung zeigen.
  if (blick.x < 0) {
    stift.save();
    stift.translate(x * 2, 0);
    stift.scale(-1, 1);
    menschGespiegeltZeichnen(x, y);
    stift.restore();
    return;
  }
  menschGespiegeltZeichnen(x, y);
}

function menschGespiegeltZeichnen(x, y) {
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

  // Der Cowboy-Hut: eine breite Krempe und eine runde Kuppel darauf.
  const krempe = oben + kopf * 0.55; // auf dieser Höhe sitzt der Hut
  stift.fillStyle = figur.hutfarbe;
  stift.beginPath();
  stift.ellipse(x, krempe, kopf * 1.7, kopf * 0.35, 0, 0, Math.PI * 2);
  stift.fill();
  stift.beginPath();
  stift.ellipse(x, krempe, kopf * 0.85, kopf * 0.9, 0, Math.PI, Math.PI * 2);
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

  // Pistole rechts, Spitzhacke links — beide wandern mit, wenn die Arme beim
  // Laufen schwingen.
  pistoleZeichnen(x + hoch * 0.25 + ausschlag, schulter + hoch * 0.12, hoch);
  spitzhackeZeichnen(x - hoch * 0.25 - ausschlag, schulter + hoch * 0.12, hoch);
}

// Ein Stiel, der über die Schulter ragt, und oben quer der Hackenkopf.
function spitzhackeZeichnen(x, y, hoch) {
  const lang = hoch * 0.55;

  stift.strokeStyle = figur.stielfarbe;
  stift.lineWidth = Math.max(2, hoch * 0.055);
  stift.lineCap = "round";
  stift.beginPath();
  stift.moveTo(x + hoch * 0.06, y + hoch * 0.1); // unten in der Hand
  stift.lineTo(x - hoch * 0.12, y - lang + hoch * 0.1); // oben über der Schulter
  stift.stroke();

  // Der Kopf: zwei Spitzen, die nach unten zeigen.
  const kx = x - hoch * 0.12;
  const ky = y - lang + hoch * 0.1;
  stift.strokeStyle = figur.pistolenfarbe;
  stift.lineWidth = Math.max(2, hoch * 0.05);
  stift.beginPath();
  stift.moveTo(kx - hoch * 0.13, ky + hoch * 0.07);
  stift.quadraticCurveTo(kx, ky - hoch * 0.03, kx + hoch * 0.13, ky + hoch * 0.07);
  stift.stroke();
}

// Lauf nach vorn, Griff nach unten.
function pistoleZeichnen(x, y, hoch) {
  const lang = hoch * 0.26;
  const dick = hoch * 0.08;

  stift.fillStyle = figur.pistolenfarbe;
  stift.fillRect(x, y - dick / 2, lang, dick); // der Lauf
  stift.fillRect(x + dick * 0.2, y + dick / 2, dick * 0.8, dick * 1.4); // der Griff
}

function zeichnen() {
  stift.fillStyle = HINTERGRUND;
  stift.fillRect(0, 0, innerWidth, innerHeight);

  // Der Ausgang leuchtet und pulsiert, damit man ihn von weitem sieht.
  const tuer = ausgangMitte();
  const puls = 0.6 + Math.sin(performance.now() / 300) * 0.25;
  stift.save();
  stift.globalAlpha = puls;
  stift.fillStyle = "#4de08a";
  stift.fillRect(tuer.x - MAUER, tuer.y - ZELLE / 2 + MAUER, MAUER * 2, ZELLE - MAUER * 2);
  stift.restore();

  stift.fillStyle = MAUERFARBE;
  for (const m of labyrinth.mauern) stift.fillRect(m.x, m.y, m.b, m.h);

  for (const zombie of zombies) zombieZeichnen(zombie);

  menschZeichnen(figur.x, figur.y);

  stift.fillStyle = "#fff6c2";
  for (const kugel of kugeln) {
    stift.beginPath();
    stift.arc(kugel.x, kugel.y, KUGEL_GROESSE, 0, Math.PI * 2);
    stift.fill();
  }

  // Der Zähler: was er geschafft hat, steht immer oben links.
  stift.font = "bold 26px system-ui, sans-serif";
  stift.textAlign = "left";
  stift.textBaseline = "top";
  stift.fillStyle = "#9bd15b";
  stift.fillText(`Zombies abgeballert: ${abgeballert}`, 18, 14);
  stift.fillStyle = "#4de08a";
  stift.fillText(`Labyrinthe geschafft: ${geschafft}`, 18, 46);

  stift.font = "24px system-ui, sans-serif";
  stift.textAlign = "center";
  stift.textBaseline = "alphabetic";

  if (performance.now() < geschafftMeldungBis) {
    stift.fillStyle = "#4de08a";
    stift.fillText("Geschafft! Nächstes Labyrinth!", innerWidth / 2, innerHeight - 60);
  } else if (performance.now() < controllerMeldungBis) {
    stift.fillStyle = "#ffd23f";
    stift.fillText("Controller ist da!", innerWidth / 2, innerHeight - 60);
  } else if (!schonBewegt) {
    stift.fillStyle = "#7d8598";
    stift.fillText("Pfeiltasten laufen — W A S D schießen", innerWidth / 2, innerHeight - 60);
  }
}

let vorherigeZeit = performance.now();

function schleife(jetzt) {
  const sekunden = Math.min((jetzt - vorherigeZeit) / 1000, 0.1); // nach einem Tab-Wechsel nicht springen
  vorherigeZeit = jetzt;

  bewegen(sekunden);
  schussTastenPruefen();
  kugelnBewegen(sekunden);
  zombiesBewegen(sekunden);
  treffer();
  if (istDraussen()) naechstesLabyrinth();
  zeichnen();
  diagnoseZeichnen();

  requestAnimationFrame(schleife);
}

requestAnimationFrame(schleife);
