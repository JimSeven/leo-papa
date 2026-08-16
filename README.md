# Leopolds Spiel

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

## Wo was steht

| Datei | Was drin ist |
| --- | --- |
| `spiel.js` | Das ganze Spiel. Hier wird geändert. |
| `index.html` | Die Seite drumherum. Selten anzufassen. |
| `dev-server.js` | Liefert das Spiel aus und löst das Neu-Laden aus. |
| `smoke.js` | Der Check vor dem Commit. |

Die Regeln für die Bau-Sessions stehen in [BAU-SESSIONS.md](./BAU-SESSIONS.md).
