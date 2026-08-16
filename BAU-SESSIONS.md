# Bau-Sessions mit Leopold

Die Rahmenbedingungen, entschieden am 16.08.2026. Karte: [Issue #1](https://github.com/JimSeven/leo-papa/issues/1).

## Worum es geht

Leopold (8,5) soll erleben, was er mit KI selbst bauen kann, und dabei Spaß haben. Erfolg ist, wenn ihm das Weiterbauen am Ende mehr Spaß macht als das Spielen.

**Maßstab für jede Entscheidung im Zweifel:** Nicht "sieht er schnell etwas?", sondern **"hat er es selbst verursacht?"**. Schnell schlägt sauber.

ADHS ist Randbedingung, nicht Thema. Kein Therapiespiel — aber bewusst gegen alles entscheiden, was aufdreht: keine Wartezeiten, keine Textwände, ein Ding pro Session, harter Zeitrahmen.

## Wie eine Session läuft

**40 Minuten, ein fester Slot pro Wochenende.** Lieber aufhören, solange er noch will.

Papa richtet vorher ein: `npm start` im einen Terminal, `claude` im anderen,
Browser und Terminal nebeneinander. Dann tippt **Leopold** `/bauen` — das ist
der Startschuss, und ab da redet er mit der KI, nicht mit Papa.

1. **Kurze Runde:** Was soll heute anders sein?
2. **Eine Sache bauen.** Eine.
3. **Er spielt allein**, was gerade entstanden ist — sofort, im offenen Browser.
4. **Veröffentlichen** — `git push`, während er spielt. Kein Warten für ihn.
5. **Festlegen**, was nächstes Mal dran ist.

Gespielt wird am Session-Ende lokal, ohne Wartezeit. Der Push ist dafür da, dass
Leopold **zwischen** den Sessions allein rankommt:
**https://jimseven.github.io/leo-papa/**

Committen ist nur für uns, pushen ist das Veröffentlichen — die neue Version steht
etwa eine Minute später unter der URL. *(revidierbar: wenn sich das als lästig
erweist, kann die Veröffentlichung auch bei jedem Commit automatisch laufen)*

## Wer macht was

- **Leopold diktiert** seine Ideen selbst an die KI, in seinen eigenen Worten. Papa tippt nicht für ihn.
- **Die KI setzt sofort um**, was in ~5 Minuten baubar ist. Rückfragen an Papa töten das Tempo.
- **Papa kommt dazu**, wenn etwas die Struktur umwirft oder länger dauert als eine halbe Session.

Wie sich die KI dabei zu verhalten hat — Ton, Ablauf, Zeitrahmen, Ideen-Bremse —
steht in [`.claude/commands/bauen.md`](./.claude/commands/bauen.md). Wenn eine
Session schief läuft, ist das die Datei, an der man dreht.

## Die Ideen-Bremse

Leopolds Ideen werden im Kopf schnell sehr groß. Die KI lehnt nichts ab — sie **parkt laut und sichtbar**:

> "Starke Idee. Die bauen wir, aber nicht heute — ich schreib sie auf die Liste. Heute machen wir erst X fertig."

Geparktes muss sichtbar bleiben, sonst erdet es nicht: **Leopold drückt `i` und
sieht seine Liste im Spiel.** Gebautes bleibt abgehakt stehen — die Häkchen sind
der Beweis, dass seine Ideen ankommen. *(revidierbar: wenn die Liste zu lang
wird, um sie zu überblicken, fliegt Erledigtes raus)*

Die Liste hat **kein Loch zwischen den Sessions**. Was ihm am Mittwoch einfällt
und bis Samstag nicht überlebt, ist weg — und das ist Absicht, nicht Nachlässigkeit:
der Filter gehört zur Bremse. Papa merkt sich, was ihm wichtig erscheint.

**Papas Name hebelt die Bremse nicht aus.** Ein Trockenlauf am 16.08.2026 hat
gezeigt, wie schnell „Papa hat gesagt, das ist okay" die Grenze verschiebt —
zweimal hintereinander, und die Regel „eine Sache" war weg. Die Grenze ist die
Uhr; Papas Okay zählt nur, wenn Papa es selbst sagt. Umgekehrt gilt: Hinter
„das ist langweilig" steckt kein Wunsch nach Grafik, sondern nach etwas zu tun —
die KI baut dann ein Ziel (etwas zum Einsammeln, einen Zähler), keine Deko.

## Das Gedächtnis

`SPIELSTAND.md` ist das, was zwischen zwei Sessions überlebt. **Eine** Datei, vier
Abschnitte:

| Abschnitt | Was drin steht | Wer liest es |
| --- | --- | --- |
| **So ist das Spiel** | Leopolds Entscheidungen, im Präsens („Flauschi ist grün") | die KI |
| **Wörter** | Fantasienamen und ihre Schreibweise | die KI |
| **Ideenliste** | geparkte Ideen, in seinen Worten | **Leopold**, Taste `i` |
| **Nächstes Mal** | was beim nächsten Mal dran ist | **Leopold**, Taste `i` |

Zwei Regeln, an denen alles hängt:

- **Zustand, kein Protokoll.** Ändert sich etwas, wird die alte Zeile *ersetzt*,
  nicht ergänzt — und die KI sagt es laut („Flauschi war grün, jetzt ist er rot").
  Er soll hören, dass sein Wort etwas verändert hat. Die Historie hat git.
- **Sofort, nicht am Session-Ende.** Ideen in dem Moment, in dem er sie sagt;
  Entscheidungen, sobald sie gebaut sind. Die letzten drei Minuten der 40 sind
  die müdesten — dort darf nichts hängen.

Das Spiel liest dieselbe Datei, aus der die KI liest. Es gibt keine zweite Liste,
die veralten könnte. Die Regeln für die KI stehen in [CLAUDE.md](./CLAUDE.md).

## Technisches

- **HTML/Canvas**, eine flache Codebasis im Repo. Kein Editor, den jemand lernen muss.
  *(Godot verworfen: Editor-Bedienung. Scratch verworfen: für die KI nicht editierbar.)*
- **MacBook, ein Bildschirm**, Split zwischen Browser und Terminal. Terminal darf sichtbar sein.
- **Safari, sobald mit Controller gespielt wird.** Safari geht über Apples
  Game-Controller-Framework und erkennt den Switch-Pro-Controller sauber
  (`mapping: standard`). Chrome spricht die Geräte direkt über HID an und sieht
  ihn gar nicht — auch nicht auf fremden Gamepad-Testseiten, also ein bekannter
  Chromium-Bug und nichts, was sich hier reparieren ließe. Weder die
  macOS-Berechtigungen noch Chromes HID-Einstellung ändern etwas; letztere
  betrifft WebHID, eine andere Schnittstelle. Zum Entwickeln bleibt Chrome
  benutzbar, nur eben ohne Controller.
- **Der Browser gibt den Controller nur an das Fenster, das vorne ist.** Wer im
  Terminal tippt, steuert nichts — das sieht aus wie ein kaputter Controller und
  ist keiner. Taste `g` im Spiel zeigt, was der Browser tatsächlich meldet.
- **Keine Tests am Anfang.** Stattdessen: Commit nach jedem funktionierenden Stand, davor ein 10-Sekunden-Smoke-Check — startet es, kann er sich bewegen? Tests erst, wenn es stabile Regeln gibt.

## Was bewusst offen bleibt

Spielkonzept, Figuren, Story, Mechanik, Grafikstil, Name. Das kommt von Leopold, beim Bauen, aus dem Ausprobieren heraus. Nichts davon wird vorab entschieden.

## Leopolds Zugang (einmalig einrichten)

Damit er ohne Papa und ohne Browser-Bedienung rankommt: **https://jimseven.github.io/leo-papa/**
in Safari öffnen, dann *Ablage → Zum Dock hinzufügen*. Ergebnis ist ein Icon im
Dock, das er anklickt wie jedes andere Programm — kein Lesezeichen suchen, keine
Adresse tippen. Das gelbe Quadrat als Icon macht es wiedererkennbar.

Alternativ ein Lesezeichen in der Lesezeichenleiste, wenn ihm das lieber ist.

## Vor der ersten Session

Steht alles: [#2 Diktat getestet](https://github.com/JimSeven/leo-papa/issues/2) · [#3 Grundgerüst](https://github.com/JimSeven/leo-papa/issues/3) · [#4 Spielbare URL](https://github.com/JimSeven/leo-papa/issues/4) · [#5 Gedächtnis und Ideenliste](https://github.com/JimSeven/leo-papa/issues/5). Offen ist nur noch das, was auf der [Karte](https://github.com/JimSeven/leo-papa/issues/1) steht.
