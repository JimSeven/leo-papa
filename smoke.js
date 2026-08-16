// Der 10-Sekunden-Check vor jedem Commit: startet der Server, kommt das Spiel
// an, und meldet das Neu-Laden sich, wenn eine Datei sich ändert?
// Bewusst kein Test-Framework — ein paar Fragen, ein Befehl, fertig.
//
// Der Server startet auf einem freien Port (PORT=0) und sagt selbst, wo er
// hört. Sonst würde ein nebenher laufender Dev-Server die Antworten geben und
// der Check wäre grün, ohne den aktuellen Stand je gesehen zu haben.

import { spawn } from "node:child_process";
import { utimes } from "node:fs/promises";
import { resolve } from "node:path";

let fehler = 0;

function pruefe(frage, bestanden) {
  console.log(`  ${bestanden ? "✓" : "✗"} ${frage}`);
  if (!bestanden) fehler++;
}

const server = spawn("node", ["dev-server.js"], {
  cwd: import.meta.dirname,
  env: { ...process.env, PORT: "0", OEFFNEN: "nein" },
  stdio: ["ignore", "pipe", "pipe"],
});

let gesagtes = "";
server.stdout.on("data", (d) => (gesagtes += d));
server.stderr.on("data", (d) => (gesagtes += d));

// Auf die Adresse warten, die genau dieser Prozess meldet — oder auf seinen Tod.
function warteAufAdresse(frist = 5000) {
  return new Promise((fertig) => {
    const ende = setTimeout(() => fertig(null), frist);
    const schauen = () => {
      const treffer = gesagtes.match(/http:\/\/localhost:\d+/);
      if (treffer) {
        clearTimeout(ende);
        clearInterval(takt);
        fertig(treffer[0]);
      }
    };
    const takt = setInterval(schauen, 25);
    server.on("exit", () => {
      clearTimeout(ende);
      clearInterval(takt);
      fertig(null);
    });
  });
}

const ADRESSE = await warteAufAdresse();

try {
  if (!ADRESSE) {
    pruefe("Server startet", false);
    if (gesagtes.trim()) console.log(`\n${gesagtes.trim()}\n`);
  } else {
    pruefe("Server startet", true);

    const seite = await fetch(ADRESSE);
    const html = await seite.text();
    pruefe("Spiel wird ausgeliefert", seite.status === 200 && html.includes("<canvas"));

    const skript = await fetch(`${ADRESSE}/spiel.js`);
    pruefe("Spielcode wird ausgeliefert", skript.status === 200);

    // Das Overlay bricht still: fehlt die Datei, ist die Liste einfach leer und
    // niemand merkt es. Deshalb hier gefragt.
    const stand = await fetch(`${ADRESSE}/SPIELSTAND.md`);
    const spielstand = await stand.text();
    pruefe(
      "Ideenliste ist da",
      stand.status === 200 &&
        spielstand.includes("## Ideenliste") &&
        html.includes('id="ideen"'),
    );

    // Kodiert, damit der Client den Pfad nicht schon wegnormalisiert und der
    // Schutz im Server tatsächlich gefragt wird.
    const verboten = await fetch(`${ADRESSE}/%2e%2e%2f%2e%2e%2fetc%2fpasswd`);
    pruefe("Nichts außerhalb des Projekts", verboten.status === 403);

    // Datei anfassen und darauf warten, dass der Server das Neu-Laden meldet.
    const strom = await fetch(`${ADRESSE}/neu-laden`);
    const leser = strom.body.getReader();
    await leser.read(); // die Begrüßung des Servers abwarten

    const jetzt = new Date();
    await utimes(resolve(import.meta.dirname, "spiel.js"), jetzt, jetzt);

    const gemeldet = await Promise.race([
      leser.read().then(({ value }) => new TextDecoder().decode(value).includes("neu-laden")),
      new Promise((f) => setTimeout(() => f(false), 3000)),
    ]);
    pruefe("Änderung löst Neu-Laden aus", gemeldet);
  }
} catch (problem) {
  pruefe(`Unerwarteter Abbruch: ${problem.message}`, false);
} finally {
  server.kill();
}

console.log(fehler === 0 ? "\n  Alles gut.\n" : `\n  ${fehler} Problem(e).\n`);
process.exit(fehler === 0 ? 0 : 1);
