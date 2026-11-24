/* Extras: Sicherung (Export/Import), Frage melden, Prüfungstermin + Lernstand, Rechentrainer, Szenario-Prüfung */
(function(){
const css = `
#more .card,#calc .card{margin-bottom:14px}
.xrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.xbig{font-size:1.5rem;font-weight:800;color:var(--accent);margin:4px 0}
.xl{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:.9rem;padding:8px 0;border-top:1px solid var(--line)}
.xl:first-of-type{border-top:none}
.xl b{font-weight:700}.xl small{color:var(--muted)}
.xl .trk{grid-column:1/3;height:8px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:4px}
.xl .trk i{display:block;height:100%;background:var(--ok)}
.xl .trk i.mid{background:var(--warn)}.xl .trk i.low{background:var(--bad)}
.rep{font-size:.82rem;margin:8px 0 0}
#calc .cq{font-size:1.15rem;font-weight:700;line-height:1.5;margin:12px 0}
#calc .cans{font-size:1.1rem}
#calc .cfb{border-radius:14px;padding:10px 12px;margin-top:10px;line-height:1.5;white-space:pre-line}
#calc .cfb.ok{background:var(--ok-bg)}#calc .cfb.bad{background:var(--accent-weak)}
#szx .xt{position:sticky;top:0;z-index:5;background:var(--card);border-radius:14px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:700;box-shadow:var(--shadow)}
#szx .xt .t{font-variant-numeric:tabular-nums;color:var(--accent)}
#szx textarea.xa{min-height:180px;border:2px solid var(--line);border-radius:12px;padding:10px;font:inherit;width:100%;box-sizing:border-box}
#szx .xf{line-height:1.55;white-space:pre-line;margin:6px 0 10px}
#szx .xaufg{background:var(--accent-weak);border-radius:12px;padding:10px 12px;margin:0 0 12px;line-height:1.5}
#szx ul.xp{list-style:none;margin:8px 0;padding:0}
#szx ul.xp label{display:flex;gap:10px;align-items:flex-start;padding:6px 10px;border-radius:10px;border:2px solid var(--line);margin:6px 0;cursor:pointer;line-height:1.4}
#szx ul.xp label.hit{border-color:var(--ok);background:var(--ok-bg)}
#szx .xm{background:var(--ok-bg);border-radius:12px;padding:10px 12px;margin:10px 0;line-height:1.55;white-space:pre-line}
#szx .xmine{border:2px dashed var(--line);border-radius:12px;padding:10px;white-space:pre-wrap;line-height:1.5;margin:8px 0}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

const wrap = document.querySelector(".wrap");
const mk = (id) => { const s = document.createElement("section"); s.id = id; s.className = "hidden"; wrap.appendChild(s); return s; };
const moreS = mk("more"), calcS = mk("calc"), szxS = mk("szx");
const nav = $("tabs");
[["calc", "Rechnen"], ["more", "Mehr"]].forEach(([t, n]) => {
  const b = document.createElement("button"); b.setAttribute("role", "tab"); b.dataset.tab = t; b.setAttribute("aria-selected", "false"); b.textContent = n;
  b.onclick = () => setTab(t); nav.appendChild(b);
});
const fmtDate = ts => new Date(ts).toLocaleDateString("de-DE");

/* ================= MEHR ================= */
function allReports(){ return load("reports_v1", []); }
function renderMore(){
  const ed = load("exam_date", "");
  let days = null;
  if(ed){ const d = new Date(ed + "T08:00:00"); days = Math.ceil((d - new Date()) / 86400000); }
  const rows = [];
  let weakest = null, totalUnseen = 0;
  FACH_IDS.forEach(f => {
    try{ migrateGroup(f); }catch(e){}
    const d = FACH_DATA[f]; if(!d) return;
    const qs = d.raw.filter(r => !(f === "wirtschaft" && typeof VERT !== "undefined" && VERT.has(r[0])));
    const S = load(f + "_stats_v3", {q: {}}), sq = S.q || {};
    let seen = 0, r = 0, w = 0;
    qs.forEach(x => { const s = sq[hid(x[1])]; if(s && (s.r + s.w) > 0){ seen++; r += s.r; w += s.w; } });
    const n = r + w, pc = n ? Math.round(r / n * 100) : null, cov = Math.round(seen / qs.length * 100);
    totalUnseen += qs.length - seen;
    if(n >= 10 && (!weakest || pc < weakest.pc)) weakest = {name: d.name, pc};
    const szN = ((window.SZEN_DATA || {})[f] || []).length, szOk = Object.keys((load(f + "_szen_v1", {ok: {}}).ok) || {}).length;
    rows.push(`<div class="xl"><b>${esc(d.name)}</b><span>${pc === null ? "noch keine Daten" : pc + " % richtig"}</span>
      <small>${seen} von ${qs.length} Fragen gesehen (${cov} %)${szN ? " · Szenarien " + szOk + "/" + szN : ""}</small><span></span>
      <div class="trk"><i class="${pc === null ? "" : pc >= 75 ? "" : pc >= 50 ? "mid" : "low"}" style="width:${pc === null ? 0 : pc}%"></i></div></div>`);
  });
  const hist = load("szx_hist_v1", []);
  let tip = "";
  if(days !== null && days > 0) tip = `<p class="hint">Bei ${days} Tagen bleiben dir ${Math.max(1, Math.ceil(totalUnseen / days))} neue Fragen pro Tag, um alles einmal zu sehen.${weakest ? " Schwächstes Fach gerade: " + esc(weakest.name) + " (" + weakest.pc + " %)." : ""}</p>`;
  else if(days !== null && days <= 0) tip = `<p class="hint">Der Termin ist vorbei oder heute. Viel Erfolg!</p>`;
  else if(weakest) tip = `<p class="hint">Schwächstes Fach gerade: ${esc(weakest.name)} (${weakest.pc} %).</p>`;
  const reps = allReports();
  moreS.innerHTML = `
  <div class="card"><h2>Prüfungstermin</h2>
    <label class="field"><span>Datum deiner Prüfung</span><input type="date" id="xDate" value="${esc(ed)}"></label>
    ${days !== null && days > 0 ? `<div class="xbig">Noch ${days} Tage</div>` : ""}${tip}</div>
  <div class="card"><h2>Lernstand</h2>${rows.join("") || "<p class=\"hint\">Noch keine Daten.</p>"}
    <p class="hint">Gezählt werden die Prüfungs-relevanten Fragen. Vertiefungsthemen aus Wirtschaft sind nicht dabei.</p>
    ${hist.length ? "<h3>Letzte Szenario-Prüfungen</h3>" + hist.slice(0, 5).map(h => `<div class="item"><p>${esc(h.title)}<br><small>${fmtDate(h.ts)} · ${h.pct} % · Note ${h.note}</small></p></div>`).join("") : ""}</div>
  <div class="card"><h2>Sicherung</h2>
    <p class="hint">Dein Fortschritt liegt nur in diesem Browser. Mach hier eine Sicherungsdatei, bevor du die App löschst, das Handy wechselst oder die Adresse änderst.</p>
    <div class="xrow"><button class="btn" id="xExp" type="button">Sicherung speichern</button>
      <button class="btn secondary" id="xImpB" type="button">Sicherung einlesen</button><input type="file" id="xImp" accept=".json,application/json" hidden></div>
    <p class="msg hidden" id="xMsg"></p><div id="xImpBox"></div></div>
  <div class="card"><h2>Gemeldete Fragen</h2>
    ${reps.length ? `<p class="hint">${reps.length} Meldung(en). Schick mir die Liste, dann korrigiere ich die Fragen.</p>` + reps.map((r, i) => `<div class="item"><p>${esc(r.q)}<br><small>${esc(r.fach || "")} · ${fmtDate(r.ts)}</small></p><button class="btn small danger" data-del="${i}" type="button">Weg</button></div>`).join("") +
      `<div class="xrow"><button class="btn" id="xRepCopy" type="button">Liste kopieren</button><button class="btn secondary" id="xRepClear" type="button">Alle löschen</button></div>` : "<p class=\"hint\">Keine Meldungen. Im Test gibt es unter der Frage einen Knopf „Frage melden“.</p>"}</div>`;
  $("xDate").onchange = e => { save("exam_date", e.target.value); renderMore(); };
  $("xExp").onclick = exportBackup;
  $("xImpB").onclick = () => $("xImp").click();
  $("xImp").onchange = e => importBackup(e.target.files[0]);
  moreS.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const a = allReports(); a.splice(+b.dataset.del, 1); save("reports_v1", a); renderMore(); });
  const cp = $("xRepCopy");
  if(cp){
    cp.onclick = () => { const t = allReports().map((r, i) => (i + 1) + ". [" + (r.fach || "") + " " + (r.tag || "") + "] " + r.q + " | Antwort in der App: " + r.correct).join("\n");
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => cp.textContent = "Kopiert ✓").catch(() => { prompt("Liste kopieren:", t); }); };
    arm($("xRepClear"), "Wirklich alle löschen?", () => { save("reports_v1", []); renderMore(); });
  }
}
function xmsg(t, ok){ const m = $("xMsg"); if(!m) return; m.textContent = t; m.className = "msg " + (ok ? "ok" : "bad"); }
function exportBackup(){
  const o = {};
  try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); o[k] = localStorage.getItem(k); } }catch(e){ Object.keys(mem).forEach(k => o[k] = JSON.stringify(mem[k])); }
  const blob = new Blob([JSON.stringify({app: "syslearn", v: 1, ts: Date.now(), data: o})], {type: "application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "syslearn-sicherung-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  xmsg("Sicherung gespeichert. Bewahre die Datei gut auf.", true);
}
function importBackup(file){
  if(!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    let j; try{ j = JSON.parse(rd.result); }catch(e){ return xmsg("Die Datei ist keine gültige Sicherung.", false); }
    if(!j || j.app !== "syslearn" || !j.data || typeof j.data !== "object") return xmsg("Das ist keine SysLearn-Sicherung.", false);
    const n = Object.keys(j.data).length;
    $("xImpBox").innerHTML = `<p class="hint">Gefunden: ${n} Einträge vom ${fmtDate(j.ts || Date.now())}. Das ersetzt deinen aktuellen Stand auf diesem Gerät.</p><button class="btn danger" id="xGo" type="button">Jetzt einlesen</button>`;
    arm($("xGo"), "Sicher? Nochmal tippen", () => {
      try{ Object.keys(j.data).forEach(k => { if(typeof j.data[k] === "string") localStorage.setItem(k, j.data[k]); }); }catch(e){ return xmsg("Einlesen hat nicht geklappt.", false); }
      location.reload();
    });
  };
  rd.readAsText(file);
}

/* ================= FRAGE MELDEN ================= */
const rb = document.createElement("button"); rb.type = "button"; rb.className = "link"; rb.id = "reportQ"; rb.style.cssText = "margin-top:6px;font-size:.85rem";
$("kbHint").after(rb);
const curQ = () => (typeof test !== "undefined" && test && test.items && test.items[test.idx]) ? test.items[test.idx].p : null;
function repLabel(){ const p = curQ(); if(!p) return; rb.textContent = allReports().some(r => r.id === p.id) ? "⚑ Gemeldet ✓ (nochmal tippen = zurücknehmen)" : "⚑ Frage melden (falsch oder unklar)"; }
rb.onclick = () => {
  const p = curQ(); if(!p) return; const a = allReports(), i = a.findIndex(r => r.id === p.id);
  if(i >= 0) a.splice(i, 1);
  else a.unshift({id: p.id, fach: p.f ? (FACH_DATA[p.f] || {}).name : (FACH_DATA[fach] || {}).name, tag: p.tag, q: p.q, correct: p.correct, ts: Date.now()});
  save("reports_v1", a); repLabel();
};
new MutationObserver(repLabel).observe($("qText"), {childList: true, characterData: true, subtree: true});

/* ================= RECHNEN ================= */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
const ip2n = s => s.split(".").reduce((a, x) => a * 256 + +x, 0), n2ip = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join(".");
const maskN = c => c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0;
const randIp = () => pick([() => "192.168." + ri(0, 255) + "." + ri(1, 254), () => "10." + ri(0, 255) + "." + ri(0, 255) + "." + ri(1, 254), () => "172." + ri(16, 31) + "." + ri(0, 255) + "." + ri(1, 254)])();
const CATS = {
  sub: "Subnetting", conv: "Umrechnen", raid: "RAID & Speicher", net: "Übertragung", el: "Strom & Energie"
};
const GEN = {
  sub(){
    const t = pick(["net", "bc", "hosts", "mask", "cidr", "need", "first", "last"]), c = ri(20, 29), ip = randIp(), m = maskN(c), net = (ip2n(ip) & m) >>> 0, bc = (net | (~m >>> 0)) >>> 0;
    const nm = n2ip(m), h = 2 ** (32 - c) - 2;
    if(t === "net") return {q: `Welche Netzadresse hat ${ip}/${c}?`, a: n2ip(net), kind: "ip", w: `Maske /${c} = ${nm}. IP UND Maske ergibt ${n2ip(net)}.`};
    if(t === "bc") return {q: `Welche Broadcast-Adresse hat ${ip}/${c}?`, a: n2ip(bc), kind: "ip", w: `Netz ${n2ip(net)}, alle Hostbits auf 1 ergibt ${n2ip(bc)}.`};
    if(t === "first") return {q: `Wie lautet die erste nutzbare Hostadresse in ${ip}/${c}?`, a: n2ip(net + 1), kind: "ip", w: `Netz ${n2ip(net)} + 1 = ${n2ip(net + 1)}.`};
    if(t === "last") return {q: `Wie lautet die letzte nutzbare Hostadresse in ${ip}/${c}?`, a: n2ip(bc - 1), kind: "ip", w: `Broadcast ${n2ip(bc)} − 1 = ${n2ip(bc - 1)}.`};
    if(t === "hosts") return {q: `Wie viele nutzbare Hosts hat ein /${c}-Netz?`, a: h, kind: "num", w: `2^(32−${c}) − 2 = ${2 ** (32 - c)} − 2 = ${h}.`};
    if(t === "mask") return {q: `Wie lautet die Subnetzmaske zu /${c}?`, a: nm, kind: "ip", w: `${c} Einsen von links: ${nm}.`};
    if(t === "cidr") return {q: `Welche Präfixlänge (/n) gehört zur Maske ${nm}?`, a: c, kind: "cidr", w: `Einsen zählen in ${nm}: ${c}, also /${c}.`};
    const need = ri(10, 500), bits = Math.ceil(Math.log2(need + 2)), cc = 32 - bits;
    return {q: `Du brauchst ein Subnetz für ${need} Geräte. Welche Präfixlänge (/n) ist die kleinste, die reicht?`, a: cc, kind: "cidr", w: `${need} + 2 (Netz + Broadcast) = ${need + 2}. Nächste Zweierpotenz: 2^${bits} = ${2 ** bits}. Also ${bits} Hostbits und /${cc}.`};
  },
  conv(){
    const t = pick(["d2b", "b2d", "d2h", "h2d", "b2h"]), v = ri(5, 255), b = v.toString(2).padStart(8, "0"), hx = v.toString(16).toUpperCase().padStart(2, "0");
    if(t === "d2b") return {q: `Rechne ${v} (dezimal) ins Binärsystem um (8 Bit).`, a: b, kind: "bin", w: `${v} = ${b} (Zweierpotenzen 128, 64, 32, …).`};
    if(t === "b2d") return {q: `Rechne ${b} (binär) ins Dezimalsystem um.`, a: v, kind: "num", w: `Stellenwerte addieren ergibt ${v}.`};
    if(t === "d2h") return {q: `Rechne ${v} (dezimal) ins Hexadezimalsystem um.`, a: hx, kind: "hex", w: `${v} = ${Math.floor(v / 16)}·16 + ${v % 16} = ${hx}.`};
    if(t === "h2d") return {q: `Rechne 0x${hx} ins Dezimalsystem um.`, a: v, kind: "num", w: `${hx}: ${parseInt(hx[0], 16)}·16 + ${parseInt(hx[1], 16)} = ${v}.`};
    return {q: `Rechne ${b} (binär) ins Hexadezimalsystem um.`, a: hx, kind: "hex", w: `Je 4 Bit eine Hexziffer: ${b.slice(0, 4)} ${b.slice(4)} = ${hx}.`};
  },
  raid(){
    const t = pick(["0", "1", "5", "6", "10"]), s = pick([1, 2, 4, 8, 10, 12, 16]);
    const n = t === "1" ? 2 : t === "5" ? ri(3, 8) : t === "6" ? ri(4, 8) : t === "10" ? pick([4, 6, 8]) : ri(2, 8);
    const cap = t === "0" ? n * s : t === "1" ? s : t === "5" ? (n - 1) * s : t === "6" ? (n - 2) * s : n / 2 * s;
    const how = {"0": `Striping, alles nutzbar: ${n} · ${s}`, "1": `Spiegel, nur eine Platte zählt: ${s}`, "5": `eine Platte für Parität: (${n} − 1) · ${s}`, "6": `zwei Platten für Parität: (${n} − 2) · ${s}`, "10": `Hälfte für Spiegelung: ${n} / 2 · ${s}`}[t];
    return {q: `RAID ${t} mit ${n} Platten à ${s} TB. Wie viel nutzbarer Speicher in TB?`, a: cap, kind: "num", w: `${how} = ${cap} TB.`};
  },
  net(){
    const t = pick(["s", "mb"]);
    if(t === "s"){ const mb = pick([100, 200, 250, 400, 500, 800, 1000, 1500, 2000]), v = pick([10, 50, 100, 200, 250, 500, 1000]), sec = mb * 8 / v;
      return {q: `Eine Datei mit ${mb} MB wird mit ${v} Mbit/s übertragen. Wie viele Sekunden dauert das (ohne Overhead)? Auf 1 Nachkommastelle runden.`, a: Math.round(sec * 10) / 10, kind: "num", tol: 0.11, w: `${mb} MB · 8 = ${mb * 8} Mbit. ${mb * 8} / ${v} = ${sec} s.`}; }
    const v = pick([10, 50, 100, 200, 400, 1000]), sec = pick([2, 5, 10, 20, 30, 60]), mb = v * sec / 8;
    return {q: `Eine Leitung schafft ${v} Mbit/s. Wie viele MB werden in ${sec} Sekunden übertragen (ohne Overhead)?`, a: mb, kind: "num", tol: 0.06, w: `${v} · ${sec} = ${v * sec} Mbit. Geteilt durch 8 ergibt ${mb} MB.`};
  },
  el(){
    const t = pick(["u", "i", "r", "p", "kwh"]);
    if(t === "u"){ const i = pick([0.5, 1, 2, 3, 5]), r = pick([10, 20, 50, 100, 220]); return {q: `Ein Widerstand von ${r} Ω wird von ${i} A durchflossen. Welche Spannung in V liegt an?`, a: r * i, kind: "num", tol: 0.011, w: `U = R · I = ${r} · ${i} = ${r * i} V.`}; }
    if(t === "i"){ const u = pick([5, 12, 24, 48, 230]), r = pick([10, 20, 50, 100, 400]); const a = Math.round(u / r * 100) / 100; return {q: `An ${r} Ω liegen ${u} V an. Wie groß ist der Strom in A (auf 2 Nachkommastellen)?`, a, kind: "num", tol: 0.011, w: `I = U / R = ${u} / ${r} = ${a} A.`}; }
    if(t === "r"){ const u = pick([12, 24, 48, 230]), i = pick([0.5, 1, 2, 4, 5]); const a = Math.round(u / i * 100) / 100; return {q: `Bei ${u} V fließen ${i} A. Wie groß ist der Widerstand in Ω?`, a, kind: "num", tol: 0.011, w: `R = U / I = ${u} / ${i} = ${a} Ω.`}; }
    if(t === "p"){ const u = pick([5, 12, 19, 24, 48, 230]), i = pick([0.5, 1, 2, 3, 5]); return {q: `Ein Gerät liegt an ${u} V und zieht ${i} A. Welche Leistung in W?`, a: Math.round(u * i * 100) / 100, kind: "num", tol: 0.011, w: `P = U · I = ${u} · ${i} = ${Math.round(u * i * 100) / 100} W.`}; }
    const w = pick([50, 100, 150, 300, 500, 750]), h = pick([2, 4, 8, 12, 24]), ct = pick([25, 30, 35, 40]), kwh = w * h / 1000, cost = Math.round(kwh * ct) / 100;
    return {q: `Ein Server nimmt ${w} W auf und läuft ${h} Stunden am Tag. Strompreis ${ct} ct/kWh. Was kostet das pro Tag in Euro (auf 2 Nachkommastellen)?`, a: cost, kind: "num", tol: 0.011, w: `${w} W · ${h} h = ${kwh} kWh. Mal ${ct} ct = ${Math.round(kwh * ct * 100) / 100} ct, also ${cost} €.`};
  }
};
const cs = load("calc_stats_v1", {streak: 0, best: 0, c: {}});
let calcCat = "all", cur = null, answered = false;
function judge(p, raw){
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  if(!s) return null;
  if(p.kind === "ip") return s === p.a;
  if(p.kind === "num"){ const x = parseFloat(s.replace(",", ".")); return !isNaN(x) && Math.abs(x - p.a) <= (p.tol || 0.0001); }
  if(p.kind === "cidr") return s.replace("/", "") === String(p.a);
  if(p.kind === "bin") return /^[01_]+$/.test(s) && s.replace(/_/g, "").padStart(8, "0") === p.a;
  if(p.kind === "hex") return s.replace(/^0x/, "").padStart(2, "0") === p.a.toLowerCase();
  return false;
}
function nextCalc(){
  const k = calcCat === "all" ? pick(Object.keys(GEN)) : calcCat;
  cur = Object.assign({k}, GEN[k]()); answered = false; renderCalc();
}
function renderCalc(){
  const chip = (k, n) => `<button type="button" class="tile" data-k="${k}" aria-pressed="${calcCat === k}" style="min-height:0;padding:10px 12px"><span class="tt">${n}</span></button>`;
  const tot = Object.values(cs.c).reduce((a, x) => [a[0] + x[0], a[1] + x[1]], [0, 0]);
  calcS.innerHTML = `<div class="card"><h2>Rechentrainer</h2>
    <p class="sub">Zufallsaufgaben ohne Ende. Rechne auf Papier oder im Kopf, so wie in der Prüfung.</p>
    <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">${chip("all", "Alles gemischt")}${Object.keys(CATS).map(k => chip(k, CATS[k])).join("")}</div>
    <div class="stat" style="margin-top:12px"><div><b>${cs.streak}</b><span>Serie</span></div><div><b>${cs.best}</b><span>Beste Serie</span></div><div><b>${tot[0] + tot[1] ? Math.round(tot[0] / (tot[0] + tot[1]) * 100) + " %" : "–"}</b><span>Treffer gesamt</span></div></div></div>
    <div class="card"><div class="top"><span class="badge">${CATS[cur.k]}</span></div>
    <p class="cq">${esc(cur.q)}</p>
    <input type="text" class="cans" id="cIn" inputmode="text" autocomplete="off" autocapitalize="off" placeholder="Deine Antwort" ${answered ? "readonly" : ""}>
    <div class="xrow"><button class="btn" id="cOk" type="button">${answered ? "Weiter" : "Prüfen"}</button>${answered ? "" : '<button class="btn secondary" id="cSkip" type="button">Lösung zeigen</button>'}</div>
    <div id="cFb"></div></div>`;
  calcS.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { calcCat = b.dataset.k; nextCalc(); });
  const inp = $("cIn");
  if(answered){ inp.value = cur.given || ""; $("cFb").innerHTML = cur.fb; $("cOk").onclick = nextCalc; $("cOk").focus(); return; }
  const done = (ok, given) => {
    answered = true; cur.given = given;
    const c = cs.c[cur.k] || [0, 0]; c[ok ? 0 : 1]++; cs.c[cur.k] = c;
    cs.streak = ok ? cs.streak + 1 : 0; cs.best = Math.max(cs.best, cs.streak); save("calc_stats_v1", cs);
    cur.fb = `<div class="cfb ${ok ? "ok" : "bad"}"><b>${ok ? "Richtig!" : "Leider falsch."}</b> ${ok ? "" : "Richtig wäre: " + (cur.kind === "cidr" ? "/" : "") + cur.a + ".\n"}${esc(cur.w)}</div>`;
    renderCalc();
  };
  $("cOk").onclick = () => { const r = judge(cur, inp.value); if(r === null) return inp.focus(); done(r, inp.value); };
  $("cSkip").onclick = () => done(false, "");
  inp.onkeydown = e => { if(e.key === "Enter") $("cOk").click(); };
  inp.focus({preventScroll: true});
}
function openCalc(){ if(!cur) nextCalc(); else renderCalc(); }

/* ================= SZENARIO-PRÜFUNG ================= */
let sx = null, sxTick = null;
const SZ = f => (window.SZEN_DATA || {})[f] || [];
function pickCases(facher, n){
  const pool = []; facher.forEach(f => SZ(f).forEach(d => pool.push(Object.assign({fid: f}, d))));
  const g = {}; shuffle(pool).forEach(d => (g[d.fid] = g[d.fid] || []).push(d));
  const keys = shuffle(Object.keys(g)), out = [];
  while(out.length < n && keys.some(k => g[k].length)) keys.forEach(k => { if(out.length < n && g[k].length) out.push(g[k].pop()); });
  return out;
}
function startSz(title, facher, minutes){
  const items = pickCases(facher, 4); if(!items.length) return;
  sx = {title, items, end: Date.now() + minutes * 60000, minutes, done: false};
  $("tabs").classList.add("hidden"); showSection("szx"); szxS.classList.remove("hidden");
  szxS.innerHTML = `<div class="xt"><span>${esc(title)}</span><span class="t" id="sxT"></span></div>` +
    items.map((d, i) => `<div class="card"><div class="top"><span>Aufgabe ${i + 1} / ${items.length}</span><span class="badge">${esc(FACH_DATA[d.fid].name)} · ${esc(d.t)}</span></div>
      <b>${esc(d.h)}</b><p class="xf">${esc(d.f)}</p><p class="xaufg"><b>Aufgabe:</b> ${esc(d.a)}</p>
      <textarea class="xa" data-i="${i}" placeholder="Schreib deine Antwort in ganzen Sätzen." aria-label="Antwort ${i + 1}"></textarea></div>`).join("") +
    `<div class="card"><div class="xrow"><button class="btn" id="sxSub" type="button">Abgeben</button></div>
     <p style="margin-top:10px"><button class="link" id="sxAbort" type="button">Prüfung abbrechen</button></p></div>`;
  window.scrollTo(0, 0);
  const upd = () => { const s = Math.max(0, Math.round((sx.end - Date.now()) / 1000)); $("sxT").textContent = "⏱ " + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); if(s <= 0) finishSz(); };
  clearInterval(sxTick); sxTick = setInterval(() => { if(sx && !sx.done) upd(); }, 1000); upd();
  arm($("sxSub"), "Wirklich abgeben?", finishSz);
  $("sxAbort").onclick = () => { clearInterval(sxTick); sx = null; szxS.classList.add("hidden"); setTab("practice"); };
}
function finishSz(){
  if(!sx || sx.done) return; sx.done = true; clearInterval(sxTick);
  sx.answers = [...szxS.querySelectorAll("textarea.xa")].map(t => t.value.trim());
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[-_]/g, "");
  sx.checks = sx.items.map((d, i) => { const n = norm(sx.answers[i]); return d.p.map(p => !!n && p[1].some(k => n.includes(norm(k)))); });
  renderSzRes();
}
function szScore(){
  let sum = 0; sx.items.forEach((d, i) => sum += sx.checks[i].filter(Boolean).length / d.p.length);
  return Math.round(sum / sx.items.length * 100);
}
function renderSzRes(first){
  const pct = szScore(), g = grade(pct);
  szxS.innerHTML = `<div class="card"><h2>Ergebnis: ${esc(sx.title)}</h2><div class="score" id="sxScore">${pct} %</div><div class="grade" id="sxGrade">Note ${g[0]} – ${g[1]}</div>
    <p class="hint">Die Haken sind ein Vorschlag anhand von Stichwörtern. Korrigiere sie ehrlich, dann stimmt die Note. Die Bewertung ändert sich live.</p></div>` +
    sx.items.map((d, i) => `<div class="card"><div class="top"><span>Aufgabe ${i + 1}</span><span class="badge">${esc(FACH_DATA[d.fid].name)} · ${esc(d.t)}</span></div><b>${esc(d.h)}</b>
      <p class="hint" style="margin-bottom:2px">Deine Antwort</p><div class="xmine">${sx.answers[i] ? esc(sx.answers[i]) : "(nichts geschrieben)"}</div>
      <ul class="xp" data-i="${i}">${d.p.map((p, j) => `<li><label class="${sx.checks[i][j] ? "hit" : ""}"><input type="checkbox" data-j="${j}"${sx.checks[i][j] ? " checked" : ""}><span>${esc(p[0])}</span></label></li>`).join("")}</ul>
      <details><summary>Musterantwort</summary><div class="xm">${esc(d.m)}</div></details></div>`).join("") +
    `<div class="card"><div class="xrow"><button class="btn" id="sxAgain" type="button">Neue Prüfung</button><button class="btn secondary" id="sxHome" type="button">Startseite</button></div></div>`;
  szxS.querySelectorAll("ul.xp input").forEach(cb => cb.onchange = () => {
    const i = +cb.closest("ul").dataset.i, j = +cb.dataset.j; sx.checks[i][j] = cb.checked; cb.closest("label").classList.toggle("hit", cb.checked);
    const p = szScore(), gg = grade(p); $("sxScore").textContent = p + " %"; $("sxGrade").textContent = "Note " + gg[0] + " – " + gg[1]; saveHist();
  });
  $("sxHome").onclick = () => { sx = null; szxS.classList.add("hidden"); setTab("practice"); };
  $("sxAgain").onclick = () => { const t = sx.title, f = sx.facher, m = sx.minutes; sx = null; szxS.classList.add("hidden"); setTab("practice"); };
  window.scrollTo(0, 0); saveHist();
}
let histTs = 0;
function saveHist(){
  if(!sx) return; const pct = szScore(), g = grade(pct), h = load("szx_hist_v1", []);
  if(histTs && h[0] && h[0].ts === histTs) h.shift(); else histTs = Date.now();
  h.unshift({ts: histTs = histTs || Date.now(), title: sx.title, pct, note: g[0]}); save("szx_hist_v1", h.slice(0, 20));
}
EXAMS.push(
  {id:"SZ1", title:"FISI Teil 2 (Szenario): Konzeption und Administration", info:"4 offene Aufgaben · 90 Minuten · selbst bewertet · Hardware, Service, CPS", min:90, run(){ histTs = 0; startSz(this.title, ["hw", "ssq", "cps"], 90); }},
  {id:"SZ2", title:"FISI Teil 2 (Szenario): Netzwerke", info:"4 offene Aufgaben · 90 Minuten · selbst bewertet · Netzwerke", min:90, run(){ histTs = 0; startSz(this.title, ["nw"], 90); }}
);

{ const ci = EXAMS.findIndex(x => x.id === "C"); if(ci >= 0) EXAMS.push(EXAMS.splice(ci, 1)[0]); }
window.__dbg = {cur: () => cur, sx: () => sx};
window.TabHooks = {more: renderMore, calc: openCalc};
})();
