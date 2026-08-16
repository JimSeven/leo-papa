// Der 10-Sekunden-Check vor jedem Commit: startet der Server, kommt das Spiel
// an, und meldet das Neu-Laden sich, wenn eine Datei sich ändert?
// Bewusst kein Test-Framework — vier Fragen, ein Befehl, fertig.

import { spawn } from "node:child_process";
import { utimes } from "node:fs/promises";
import { resolve } from "node:path";

const PORT = 4321;
const ADRESSE = `http://localhost:${PORT}`;

const server = spawn("node", ["dev-server.js"], {
  cwd: import.meta.dirname,
  stdio: "ignore",
});

let fehler = 0;

function pruefe(frage, bestanden) {
  console.log(`  ${bestanden ? "✓" : "✗"} ${frage}`);
  if (!bestanden) fehler++;
}

async function warteAufServer(versuche = 40) {
  for (let i = 0; i < versuche; i++) {
    try {
      await fetch(ADRESSE);
      return true;
    } catch {
      await new Promise((f) => setTimeout(f, 50));
    }
  }
  return false;
}

try {
  pruefe("Server startet", await warteAufServer());

  const seite = await fetch(ADRESSE);
  const html = await seite.text();
  pruefe("Spiel wird ausgeliefert", seite.status === 200 && html.includes("<canvas"));

  const skript = await fetch(`${ADRESSE}/spiel.js`);
  pruefe("Spielcode wird ausgeliefert", skript.status === 200);

  const verboten = await fetch(`${ADRESSE}/../../etc/passwd`);
  pruefe("Nichts außerhalb des Projekts", verboten.status === 404 || verboten.status === 403);

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
} finally {
  server.kill();
}

console.log(fehler === 0 ? "\n  Alles gut.\n" : `\n  ${fehler} Problem(e).\n`);
process.exit(fehler === 0 ? 0 : 1);
