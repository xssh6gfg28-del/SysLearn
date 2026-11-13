# Lern-Quiz (mehrere Fächer)

Installierbare Lern-App (PWA), funktioniert offline. Fächer: **WG1** (378 Fragen) und **WG2** (392 Fragen).
Oben in der App wählst du das Fach; Fortschritt, Statistik und eigene Fragen werden pro Fach getrennt gespeichert.

## Dateien
- `index.html` – die App
- `sw.js` – Offline-Cache
- `faecher.js` – Liste der Fächer + `APP_VERSION`
- `data-wg1.js`, `data-wg2.js` – die Fragen je Fach
- `manifest.webmanifest`, `icons/` – Installation auf dem Handy

## Neues Fach hinzufügen
1. Neue Datei `data-<fach>.js` anlegen (Aufbau wie `data-wg2.js`: `FACH_DATA.<id> = {name,title,sub,tags,raw}`).
2. In `faecher.js` den Dateinamen in `FACH_FILES` ergänzen.
3. In `faecher.js` `APP_VERSION` um 1 erhöhen (sonst zeigt die App weiter den alten Cache).
4. Alles auf GitHub hochladen, App zweimal schließen und öffnen.

## Frage-Format
`[Kapitel, Frage, RICHTIGE Antwort, falsch1, falsch2, falsch3, Erklärung]` – die Antworten werden beim Üben gemischt.
