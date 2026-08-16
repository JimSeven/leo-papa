// Dev-Server: liefert das Spiel aus und lädt den Browser neu, sobald sich
// eine Datei ändert. Absichtlich ohne Abhängigkeiten — nichts zu installieren,
// nichts, das am Samstagmorgen kaputt sein kann.

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

const WURZEL = resolve(import.meta.dirname);

// PORT=0 lässt das Betriebssystem einen freien Port wählen — der Smoke-Check
// nutzt das, damit er nie mit einem nebenher laufenden Dev-Server kollidiert.
const PORT = process.env.PORT === undefined ? 4321 : Number(process.env.PORT);

const TYPEN = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Offene Browser-Verbindungen, denen wir "neu laden" zurufen können.
const lauscher = new Set();

const server = createServer(async (req, res) => {
  const pfad = decodeURIComponent(new URL(req.url, "http://x").pathname);

  if (pfad === "/neu-laden") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": verbunden\n\n");
    lauscher.add(res);
    req.on("close", () => lauscher.delete(res));
    return;
  }

  const datei = resolve(join(WURZEL, pfad === "/" ? "/index.html" : pfad));

  // Nichts außerhalb des Projektordners ausliefern.
  if (datei !== WURZEL && !datei.startsWith(WURZEL + sep)) {
    res.writeHead(403).end("Verboten");
    return;
  }

  try {
    const inhalt = await readFile(datei);
    res.writeHead(200, {
      "Content-Type": TYPEN[extname(datei)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(inhalt);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Nicht gefunden: ${pfad}`);
  }
});

// Nur was das Spiel ausmacht, löst ein Neu-Laden aus. Sonst wirft jede Notiz,
// die nebenbei geschrieben wird, Leopold aus dem laufenden Spiel.
const SPIELDATEIEN = /\.(html|js|css|png|jpg|gif|svg)$/i;

// fs.watch feuert pro Speichervorgang mehrfach — kurz sammeln, dann einmal senden.
let timer = null;
watch(WURZEL, { recursive: true }, (_ereignis, name) => {
  if (!name || !SPIELDATEIEN.test(name)) return;
  if (name.startsWith(".git") || name.startsWith("node_modules")) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const res of lauscher) res.write("data: neu-laden\n\n");
    console.log(`  geändert: ${name} — Browser lädt neu`);
  }, 50);
});

server.listen(PORT, () => {
  const adresse = `http://localhost:${server.address().port}`;
  console.log(`\n  Leopolds Spiel läuft:  ${adresse}\n`);

  // Ein Befehl soll reichen — der Browser geht von selbst auf.
  // Wer das nicht will: OEFFNEN=nein npm start
  if (process.env.OEFFNEN !== "nein") spawn("open", [adresse], { stdio: "ignore" });
});
