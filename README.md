# SysLearn

**Lernplattform für Systemadministratoren.** Eine installierbare Lern-App (PWA) für die Umschulung zum Fachinformatiker für Systemintegration. Sie läuft im Browser und lässt sich aufs Handy oder den PC installieren, danach funktioniert sie auch offline. Der Lernfortschritt bleibt lokal im Browser gespeichert, es gibt keinen Server und kein Konto.

Live: https://xssh6gfg28-del.github.io/wg1-quiz/

## Was drin ist

**Fächer**

| Fach | Inhalt |
|---|---|
| Netzwerke | OSI, Ethernet und WLAN, IPv4/Subnetting, IPv6, Routing, VLAN, IT-Sicherheit, VoIP |
| Hardware | Architektur, PC-Arbeitsplatz, Zahlensysteme, Strom, USV, Green IT, Backup, RAID |
| Service & QM | Qualitätsmanagement, ISO-Normen, Prozesse, ITSM, Tickets und SLA |
| Cyberphysische Systeme | Sensoren und Aktoren, Embedded, Protokolle, Regelung, Echtzeit, Cloud/Edge/Fog, Big Data und ETL, Sicherheit (STRIDE, Normen, Risiko) |
| Wirtschaft | WG1 und WG2 plus IHK-Prüfungsthemen (WiSo) in einem Fach, die Vertiefungsthemen (Kostenrechnung, Kalkulation, Deckungsbeitrag, Marketing, Daten) nur zum gezielten Üben |

**Lernen**
- **Multiple Choice** mit Sofort-Feedback und Erklärung, Themenwahl, Neu-Pool (neue und falsch beantwortete Fragen zuerst).
- **Szenario-Kartei:** offene Fälle im Stil der IHK-Aufgaben. Du schreibst die Antwort selbst und vergleichst mit Musterantwort und Stichwort-Checkliste.
- **Zufall:** Fächer mischen, für Multiple Choice und Szenario.
- **Prüfungsmodus** wie die echte IHK-Abschlussprüfung, mit Timer, Note und Auswertung:
  - AP Teil 1 (Einrichten eines IT-gestützten Arbeitsplatzes)
  - FISI Teil A: Konzeption und Administration
  - FISI Teil B: Analyse und Entwicklung von Netzwerken
  - WiSo
  - FISI Teil 2 als offene Szenario-Prüfung (4 Aufgaben, 90 Minuten, Selbstbewertung)
- **Rechentrainer:** Subnetting, Umrechnen (Binär, Dezimal, Hex), RAID, Übertragungszeit, Strom und Energie, mit Rechenweg.

**Dranbleiben**
- **Lernplan:** Prüfungsdatum eintragen, die App zeigt Countdown, Tagespensum und das schwächste Fach.
- **Eichhörnchen-Coach:** Tagesziel, Serie, Nüsse, Rang, Tipps zu Schwächen.
- **Nuss-Shop:** Hüte, Brillen, Schals und Farbthemen für die gesammelten Nüsse.
- **Frage melden:** falsche oder unklare Fragen markieren, die Liste lässt sich kopieren.
- **Sicherung:** Export und Import des gesamten Fortschritts als Datei (Mehr, Sicherung).
- Darstellung Hell, Dunkel oder Auto.

## Update einspielen

1. ZIP entpacken.
2. Im GitHub-Repo „Add file, Upload files", alle Dateien hochladen.
3. „Commit changes".
4. App 1 bis 2 Mal neu öffnen, bis die neue Version geladen ist.

Vor größeren Änderungen (Umbenennen des Repos oder des Accounts, Handy-Wechsel) eine Sicherung speichern, denn der Fortschritt liegt nur im jeweiligen Browser.

## Für Entwickler

Reines HTML, CSS und JavaScript ohne Build-Schritt auf der App-Seite.

| Datei | Zweck |
|---|---|
| `index.html` | App, Übungs- und Testlogik, Prüfungsmodus, Zufalls-Mix |
| `faecher.js` | `APP_VERSION`, Liste der Daten-Dateien (`FACH_FILES`), Fach-Gruppen (Wirtschaft) |
| `coach.js` | Eichhörnchen-Coach, Tagesziel, Nüsse, Darstellung |
| `szenario.js` | Szenario-Kartei und Modus-Leiste |
| `extras.js` | Rechentrainer, Mehr (Termin, Lernstand, Sicherung, Meldungen), Szenario-Prüfung, Lernplan |
| `shop.js` | Nuss-Shop |
| `data-<id>.js` | Fragen pro Fach |
| `data-szen-<id>.js` | Szenario-Fälle pro Fach |
| `sw.js`, `manifest.webmanifest` | Offline-Betrieb und Installation |
| `sq-*.webp` | Posen des Eichhörnchens |

**Fragen:** `FACH_DATA.<id> = {name, title, sub, tags, raw: [[Tag, Frage, RICHTIG, falsch1, falsch2, falsch3, Erklärung], ...]}`. Die Antworten werden zur Laufzeit gemischt. Die Frage-ID wird aus dem Fragetext berechnet, wer den Text ändert, setzt den Fortschritt dieser Frage zurück.

**Szenarien:** `SZEN_DATA.<id> = [{t, h, f, a, m, p: [[Punkt, [Stichwörter]]]}]` mit Thema, Überschrift, Fall, Aufgabe, Musterantwort und Prüfpunkten. Die Stichwörter werden ohne Groß- und Kleinschreibung, Umlaute und Bindestriche verglichen. Für Wirtschaft ist die id `wirtschaft`.

**Neues Fach:** `data-<id>.js` anlegen, in `faecher.js` bei `FACH_FILES` eintragen, optional Szenarien in `data-szen-<id>.js` und Symbole für die Themen in `TAG_ICON` (index.html) ergänzen.

**Bei jeder Änderung `APP_VERSION` in `faecher.js` erhöhen.** Sonst bleibt die alte Version im Cache des Service Workers.
