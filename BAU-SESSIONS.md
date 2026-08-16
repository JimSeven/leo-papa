# Bau-Sessions mit Leopold

Die Rahmenbedingungen, entschieden am 16.08.2026. Karte: [Issue #1](https://github.com/JimSeven/leo-papa/issues/1).

## Worum es geht

Leopold (8,5) soll erleben, was er mit KI selbst bauen kann, und dabei Spaß haben. Erfolg ist, wenn ihm das Weiterbauen am Ende mehr Spaß macht als das Spielen.

**Maßstab für jede Entscheidung im Zweifel:** Nicht "sieht er schnell etwas?", sondern **"hat er es selbst verursacht?"**. Schnell schlägt sauber.

ADHS ist Randbedingung, nicht Thema. Kein Therapiespiel — aber bewusst gegen alles entscheiden, was aufdreht: keine Wartezeiten, keine Textwände, ein Ding pro Session, harter Zeitrahmen.

## Wie eine Session läuft

**40 Minuten, ein fester Slot pro Wochenende.** Lieber aufhören, solange er noch will.

1. **Kurze Runde:** Was soll heute anders sein?
2. **Eine Sache bauen.** Eine.
3. **Veröffentlichen** — `git push`. Danach steht die neue Version für Leopold bereit.
4. **Er spielt allein**, was gerade entstanden ist.
5. **Festlegen**, was nächstes Mal dran ist.

Am Ende jeder Session existiert eine Version, die er ohne Papa spielen kann:
**https://jimseven.github.io/leo-papa/**

Der Push ist der bewusste Abschluss — committen ist nur für uns, pushen ist das
Veröffentlichen. *(revidierbar: falls sich das Warten auf den Build zäh anfühlt,
kann die Veröffentlichung auch automatisch bei jedem Commit laufen)*

## Wer macht was

- **Leopold diktiert** seine Ideen selbst an die KI, in seinen eigenen Worten. Papa tippt nicht für ihn.
- **Die KI setzt sofort um**, was in ~5 Minuten baubar ist. Rückfragen an Papa töten das Tempo.
- **Papa kommt dazu**, wenn etwas die Struktur umwirft oder länger dauert als eine halbe Session.

## Die Ideen-Bremse

Leopolds Ideen werden im Kopf schnell sehr groß. Die KI lehnt nichts ab — sie **parkt laut und sichtbar**:

> "Starke Idee. Die bauen wir, aber nicht heute — ich schreib sie auf die Liste. Heute machen wir erst X fertig."

Geparktes muss sichtbar bleiben, sonst erdet es nicht. Wo die Liste lebt: [Issue #5](https://github.com/JimSeven/leo-papa/issues/5).

## Technisches

- **HTML/Canvas**, eine flache Codebasis im Repo. Kein Editor, den jemand lernen muss.
  *(Godot verworfen: Editor-Bedienung. Scratch verworfen: für die KI nicht editierbar.)*
- **MacBook, ein Bildschirm**, Split zwischen Browser und Terminal. Terminal darf sichtbar sein.
- **Keine Tests am Anfang.** Stattdessen: Commit nach jedem funktionierenden Stand, davor ein 10-Sekunden-Smoke-Check — startet es, kann er sich bewegen? Tests erst, wenn es stabile Regeln gibt.

## Was bewusst offen bleibt

Spielkonzept, Figuren, Story, Mechanik, Grafikstil, Name. Das kommt von Leopold, beim Bauen, aus dem Ausprobieren heraus. Nichts davon wird vorab entschieden.

## Vor der ersten Session

Offene Tickets auf der Karte: [#2 Diktat testen](https://github.com/JimSeven/leo-papa/issues/2) · [#3 Grundgerüst](https://github.com/JimSeven/leo-papa/issues/3) · [#4 Spielbare URL](https://github.com/JimSeven/leo-papa/issues/4) · [#5 Gedächtnis und Ideenliste](https://github.com/JimSeven/leo-papa/issues/5)
