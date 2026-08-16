# Leopolds Spiel

**Leopolds Version zum Spielen: https://jimseven.github.io/leo-papa/**

## Loslegen

```
npm start
```

Der Browser geht von selbst auf. Nichts zu installieren — nur Node ≥ 20.11.

Jede Änderung an `spiel.js` oder `index.html` lädt die Seite sofort neu.

## Vor jedem Commit

```
npm run smoke
```

## Veröffentlichen

```
git push
```

Committen ist nur für uns, **pushen ist das Veröffentlichen** — was gepusht ist,
kann Leopold spielen. Der Push gehört ans Session-Ende, als sichtbarer Abschluss.
Die neue Version steht nach etwa einer Minute unter der URL oben.

## Wo was steht

| Datei | Was drin ist |
| --- | --- |
| `spiel.js` | Das ganze Spiel. Hier wird geändert. |
| `SPIELSTAND.md` | Was Leopold entschieden hat und was noch dran ist. Leopold sieht die Ideenliste im Spiel: Taste `i`. |
| `index.html` | Die Seite drumherum. Selten anzufassen. |
| `favicon.svg` | Das Icon im Tab und im Dock. |
| `dev-server.js` | Liefert das Spiel aus und löst das Neu-Laden aus. |
| `smoke.js` | Der Check vor dem Commit. |

Die Regeln für die Bau-Sessions stehen in [BAU-SESSIONS.md](./BAU-SESSIONS.md).
