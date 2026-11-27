// Liste der Fächer. Neues Fach = neue Datei data-<fach>.js anlegen und hier eintragen.
// APP_VERSION bei jeder Änderung an Fragen oder App erhöhen (sorgt für Update bei installierten Apps).
const APP_VERSION = 28;
const FACH_FILES = ["data-wg1.js", "data-wg2.js", "data-nw.js", "data-hw.js", "data-ssq.js", "data-cps.js","data-wiso.js", "data-szen-wirtschaft.js", "data-szen-nw.js", "data-szen-hw.js", "data-szen-ssq.js", "data-szen-cps.js"];
// Gruppen: mehrere Fächer werden in der App zu EINEM gemeinsamen Pool zusammengefasst.
// (Fächer, die hier nicht stehen, erscheinen einzeln als Auswahl oben.)
const FACH_GROUPS_LIST = [
  { id: "wirtschaft", name: "Wirtschaft", title: "Wirtschaft", sub: "WG1 + WG2 + IHK-Themen", members: ["wg1", "wg2", "wiso"] }
];
