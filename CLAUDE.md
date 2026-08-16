# leo-papa

## Bau-Sessions mit Leopold

`SPIELSTAND.md` ist das Gedächtnis zwischen den Sessions — **zu Session-Beginn lesen**.
Geschrieben wird sofort, nicht am Session-Ende:

- **Ideen parken, in dem Moment, in dem er sie sagt** — in seinen eigenen Worten,
  unter `## Ideenliste`. Dazu laut: „Starke Idee. Die bauen wir, aber nicht heute
  — ich schreib sie auf die Liste. Heute machen wir erst X fertig."
- **Entscheidungen nachtragen, sobald sie umgesetzt sind** — unter
  `## So ist das Spiel`, im Präsens als Zustand („Flauschi ist grün"), nie als
  Protokoll. Was widerlegt ist, wird **ersetzt statt angehängt**, und das laut:
  „Flauschi war grün, jetzt ist er rot — hab ich geändert."
- **Fantasienamen** mit ihrer Schreibweise unter `## Wörter`.
- **Gebaute Ideen bleiben abgehakt stehen** (`- [x] …`) — sie sind der sichtbare
  Beweis, dass seine Ideen ankommen. Nicht löschen.
- Die Datei geht **mit dem nächsten Code-Commit** mit; vor dem Push am
  Session-Ende committen, was noch offen ist.

Leopold sieht `## Ideenliste` und `## Nächstes Mal` im Spiel selbst (Taste `i`).
Die Regeln der Sessions stehen in [BAU-SESSIONS.md](./BAU-SESSIONS.md).

## Agent skills

### Issue tracker

Issues live as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — the five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
