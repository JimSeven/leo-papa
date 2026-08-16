// Dev-Server: liefert das Spiel aus und lädt den Browser neu, sobald sich
// eine Datei ändert. Absichtlich ohne Abhängigkeiten — nichts zu installieren,
// nichts, das am Samstagmorgen kaputt sein kann.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

const WURZEL = resolve(import.meta.dirname);
const PORT = 4321;

const TYPEN = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
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

// fs.watch feuert pro Speichervorgang mehrfach — kurz sammeln, dann einmal senden.
let timer = null;
watch(WURZEL, { recursive: true }, (_ereignis, name) => {
  if (!name || name.startsWith(".git") || name.startsWith("node_modules")) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const res of lauscher) res.write("data: neu-laden\n\n");
    console.log(`  geändert: ${name} — Browser lädt neu`);
  }, 50);
});

server.listen(PORT, () => {
  console.log(`\n  Leopolds Spiel läuft:  http://localhost:${PORT}\n`);
});
