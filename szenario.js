/* Szenario-Kartei: Fall lesen, Antwort selbst schreiben, mit Musterantwort vergleichen.
   Daten: window.SZEN_DATA[fachId] = [ {t:Thema, h:Titel, f:Fall, a:Aufgabe, m:Musterantwort, p:[[Punkt,[Stichwörter]],…]}, … ] */
(function(){
const css = `
.kartei{display:flex;gap:8px;margin:12px 0 0}
.kartei button{flex:1;font:inherit;font-weight:700;font-size:.9rem;border:2px solid var(--line);background:var(--card);color:var(--muted);padding:8px 10px;border-radius:14px;cursor:pointer}
.kartei button[aria-pressed="true"]{background:var(--accent-weak);color:var(--accent);border-color:var(--accent)}
.hero .modi{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}
.hero .modi.hidden{display:none}
html body .hero .modi button{flex:1 1 40%;font:inherit;font-weight:700;font-size:.8rem;padding:8px 6px;white-space:nowrap;text-align:center;background:transparent;color:var(--muted);border:2px solid var(--line);border-radius:14px;box-shadow:none;cursor:pointer}
html body .hero .modi button.zuf{flex:1 1 100%}
html body .hero .modi button[aria-pressed="true"]{background:var(--card);color:var(--accent);border-color:var(--accent);box-shadow:none}
#szen .szh{margin:10px 0 6px;font-size:1.12rem}
#szen .szf{line-height:1.55;margin:0 0 10px;white-space:pre-line}
#szen .sza{background:var(--accent-weak);border-radius:12px;padding:10px 12px;margin:0 0 12px;line-height:1.5}
#szen textarea.szans{width:100%;min-height:150px;box-sizing:border-box;font:inherit;color:var(--text);background:var(--card);border:2px solid var(--line);border-radius:12px;padding:10px;resize:vertical}
#szen textarea.szans:focus{outline:none;border-color:var(--accent)}
#szen .szmuster{background:var(--ok-bg);border-radius:12px;padding:10px 12px;margin:12px 0;line-height:1.55;white-space:pre-line}
#szen .szpts{list-style:none;margin:8px 0;padding:0}
#szen .szpts li{margin:6px 0}
#szen .szpts label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;line-height:1.4;padding:6px 10px;border-radius:10px;background:var(--card);border:2px solid var(--line)}
#szen .szpts label.hit{border-color:var(--ok);background:var(--ok-bg)}
#szen .szpts input{margin-top:3px;accent-color:var(--ok)}
#szen .szrate{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
#szen .szrate button{flex:1;min-width:96px;font:inherit;font-weight:700;border:2px solid var(--line);background:var(--card);color:var(--text);padding:10px 8px;border-radius:14px;cursor:pointer}
#szen .szrate button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-weak)}
#szen .szmine{background:var(--card);border:2px dashed var(--line);border-radius:12px;padding:10px;white-space:pre-wrap;line-height:1.5}
#szen .szlist{margin:6px 0 0;padding-left:18px}
`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

let kartei = load("quiz_kartei", "mc");
let sz = null;            // laufende Runde
let prog = {ok:{}, tries:{}};
let selTopics = new Set();

const fids = () => zufall ? FACH_IDS.filter(f => mixSel.has(f)) : [fach];
const data = () => { const out = []; fids().forEach(f => ((window.SZEN_DATA || {})[f] || []).forEach(d => { if(zufall && f === "wirtschaft" && (d.t === "Kalkulation" || d.t === "Marketing")) return; out.push(Object.assign({id: hid(d.h), fid: f}, d)); })); return out; };
const KEY = f => (f || fach) + "_szen_v1";
const loadProg = () => { prog = {ok:{}, tries:{}}; fids().forEach(f => { const p = load(KEY(f), {ok:{}, tries:{}}); Object.assign(prog.ok, p.ok || {}); Object.assign(prog.tries, p.tries || {}); }); };
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[-_]/g, "");

/* ---------- Modus-Leiste unter dem Namen: MC | Szenario, dazu Zufall ---------- */
const bar = document.createElement("div"); bar.className = "modi"; bar.id = "karteiBar";
bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Modus wählen");
const sec = document.createElement("section"); sec.id = "szen"; sec.className = "hidden";
document.querySelector(".wrap").appendChild(sec);
document.querySelector(".hero h1").after(bar);

function resetView(){ sz = null; test = null; clearInterval(tick); }
function renderBar(){
  const anySz = FACH_IDS.some(f => ((window.SZEN_DATA || {})[f] || []).length);
  if(!anySz && kartei === "szen") kartei = "mc";
  bar.classList.toggle("hidden", !anySz && FACH_IDS.length < 2);
  bar.innerHTML = "";
  const hasSz = zufall ? data().length > 0 : ((window.SZEN_DATA || {})[fach] || []).length > 0;
  [["mc", "Multiple Choice"], ["szen", "Szenario"]].forEach(([k, name]) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = name;
    b.setAttribute("aria-pressed", kartei === k);
    b.onclick = () => { if(kartei === k) return; kartei = k; save("quiz_kartei", k); resetView(); renderBar(); setTab("practice"); };
    bar.appendChild(b);
  });
  if(FACH_IDS.length > 1){
    const z = document.createElement("button"); z.type = "button"; z.className = "zuf"; z.textContent = "🎲 Zufall (Fächer mischen)";
    z.setAttribute("aria-pressed", zufall);
    z.onclick = () => { zufall = !zufall; save("quiz_zufall", zufall); resetView(); renderFachBar(); renderBar(); setTab("practice"); };
    bar.appendChild(z);
  }
}
document.addEventListener("mixchange", () => { resetView(); });

/* setTab/setFach so erweitern, dass die Szenario-Kartei eingehängt wird */
const _setTab = setTab, _setFach = setFach;
setTab = function(t){
  if(t === "practice" && kartei === "szen" && (zufall ? data().length : ((window.SZEN_DATA || {})[fach] || []).length)){
    $("tabs").classList.add("hidden"); showSection("szen"); sec.classList.remove("hidden"); render(); return;
  }
  sec.classList.add("hidden"); _setTab(t);
};
setFach = function(id){ _setFach(id); sz = null; loadProg(); selTopics.clear(); data().forEach(d => selTopics.add(d.t)); renderBar(); };

/* ---------- Ansichten ---------- */
function hop(m){ if(!m) return; m.onclick = () => { m.classList.remove("jump"); void m.offsetWidth; m.classList.add("jump"); }; }
function render(){
  loadProg();
  if(!sz) return renderHome();
  if(sz.idx >= sz.items.length) return renderEnd();
  renderCard();
}

function renderHome(){
  const all = data(), topics = [...new Set(all.map(d => d.t))];
  if(!selTopics.size) topics.forEach(t => selTopics.add(t));
  const done = all.filter(d => prog.ok[d.id]).length;
  sec.innerHTML = `<div class="card"><div class="mrow"></div>
    <h2>${zufall ? "Szenario-Mix" : "Szenario-Kartei"}</h2>
    <p class="sub">Lies den Fall, schreib deine Antwort in eigenen Worten und vergleiche sie mit der Musterantwort.</p>
    <div id="szGoal"></div>
    <div class="stat"><div><b>${done}</b><span>von ${all.length} Fällen sicher gewusst</span></div></div>
    ${zufall ? "<p class=\"hint\">Mix aus: " + esc(fids().map(f => FACH_DATA[f].name).join(", ")) + ". Fächer wählst du links.</p>" : "<h3>Themen</h3><div class=\"tiles\" id=\"szTiles\"></div>"}
    <div class="row" style="margin-top:14px;align-items:flex-end">
      <label class="field"><span>Fälle pro Runde</span><select id="szSize"><option value="5">5</option><option value="10" selected>10</option><option value="999">alle</option></select></label>
      <button class="btn" id="szGo" type="button">Starten</button></div>
    <p class="msg bad hidden" id="szMsg"></p>
    <p style="margin-top:14px"><button class="link" id="szReset" type="button">Szenario-Fortschritt zurücksetzen</button></p></div>`;
  initMascot(); mascot("idle", done === all.length ? "Alle Fälle sicher gewusst. Stark!" : "Heute mal Szenarien? Schreib deine Antwort selbst, das bringt am meisten.");
  Coach.mountGoal($("szGoal"), render);
  const tiles = $("szTiles");
  if(tiles) topics.forEach(t => {
    const items = all.filter(d => d.t === t), ok = items.filter(d => prog.ok[d.id]).length;
    const b = document.createElement("button"); b.type = "button"; b.className = "tile"; b.setAttribute("aria-pressed", selTopics.has(t));
    b.innerHTML = '<span class="ti">🧩</span><span class="tt">' + esc(t) + '</span><span class="tn">' + ok + " von " + items.length + " gewusst</span>";
    b.onclick = () => { if(selTopics.has(t)) selTopics.delete(t); else selTopics.add(t); b.setAttribute("aria-pressed", selTopics.has(t)); };
    tiles.appendChild(b);
  });
  $("szGo").onclick = () => {
    const pool = zufall ? all : all.filter(d => selTopics.has(d.t));
    if(!pool.length){ $("szMsg").textContent = "Wähl mindestens ein Thema aus."; $("szMsg").classList.remove("hidden"); return; }
    const size = +$("szSize").value;
    const fresh = shuffle(pool.filter(d => !prog.ok[d.id])), known = shuffle(pool.filter(d => prog.ok[d.id]));
    sz = {items: fresh.concat(known).slice(0, size), idx: 0, res: []};
    render();
  };
  arm($("szReset"), "Wirklich zurücksetzen?", () => { fids().forEach(f => save(KEY(f), {ok:{}, tries:{}})); prog = {ok:{}, tries:{}}; render(); });
}

function renderCard(){
  const d = sz.items[sz.idx], pct = Math.round(sz.idx / sz.items.length * 100);
  const msgHtml = sz.msg ? '<p class="msg ok">' + esc(sz.msg) + "</p>" : ""; sz.msg = "";
  sec.innerHTML = `<div class="card">
    <div class="top"><span>Fall ${sz.idx + 1} / ${sz.items.length}</span><span class="badge">${zufall ? esc(FACH_DATA[d.fid].name) + " · " : ""}${esc(d.t)}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${msgHtml}
    <div class="srow"><div class="mascot" id="szM" data-mood="think" role="img" aria-label="Eichhörnchen">${MASCOT_SVG}</div>
      <div class="bubble long"><div><b style="display:block;margin-bottom:4px">${esc(d.h)}</b><span class="szf" style="margin:0">${esc(d.f)}</span></div></div></div>
    <p class="sza"><b>Aufgabe:</b> ${esc(d.a)}</p>
    <textarea class="szans" id="szAns" placeholder="Schreib deine Antwort in eigenen Worten. Ganze Sätze, so wie in der Prüfung." aria-label="Deine Antwort"></textarea>
    <p class="msg bad hidden" id="szMsg"></p>
    <div class="row" style="margin-top:10px"><button class="btn" id="szCheck" type="button">Antwort prüfen</button>
      <button class="btn secondary" id="szSkip" type="button">Überspringen</button></div>
    <div id="szRes" class="hidden"></div>
    <p style="margin-top:12px"><button class="link" id="szStop" type="button">Runde beenden</button></p></div>`;
  hop($("szM"));
  window.scrollTo(0, 0);
  $("szAns").oninput = () => $("szMsg").classList.add("hidden");
  $("szCheck").onclick = () => check(d);
  $("szSkip").onclick = () => { sz.res.push("skip"); sz.idx++; render(); };
  $("szStop").onclick = () => { sz = null; render(); };
}

function check(d){
  const ans = $("szAns").value.trim();
  if(ans.length < 3){ $("szMsg").textContent = "Schreib erst eine Antwort. Auch Stichwörter reichen."; $("szMsg").classList.remove("hidden"); return; }
  const n = norm(ans);
  const hits = d.p.map(p => p[1].some(k => n.includes(norm(k))));
  $("szAns").readOnly = true; $("szCheck").classList.add("hidden"); $("szSkip").classList.add("hidden");
  const res = $("szRes"); res.classList.remove("hidden");
  res.innerHTML = `<div class="srow szfb"><div class="mascot" id="szFbM" data-mood="idle" role="img" aria-label="Eichhörnchen">${MASCOT_SVG}</div>
      <div class="bubble long"><div id="szFbT"></div></div></div>
    <h3>Dein Abgleich mit der Checkliste</h3>
    <p class="hint">Die Haken sind ein Vorschlag anhand von Stichwörtern. Korrigiere sie, wenn du etwas anders formuliert hast.</p>
    <ul class="szpts" id="szPts"></ul>
    <div class="szmuster"><b>Musterantwort</b><br>${esc(d.m)}</div>
    <b>Wie gut war deine Antwort?</b>
    <div class="szrate" id="szRate"></div>`;
  const ul = $("szPts");
  d.p.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<label><input type="checkbox"' + (hits[i] ? " checked" : "") + '><span>' + esc(p[0]) + '</span></label>';
    li.querySelector("input").onchange = e => { li.firstChild.classList.toggle("hit", e.target.checked); suggest(); };
    li.firstChild.classList.toggle("hit", hits[i]);
    ul.appendChild(li);
  });
  const rate = $("szRate");
  [["ok", "Gewusst"], ["part", "Teilweise"], ["no", "Nicht gewusst"]].forEach(([k, name]) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.k = k; b.textContent = name; b.setAttribute("aria-pressed", "false");
    b.onclick = () => rateIt(d, k); rate.appendChild(b);
  });
  suggest();
  res.scrollIntoView({behavior: "smooth", block: "start"});
}

function suggest(){
  const d = sz.items[sz.idx], boxes = [...document.querySelectorAll("#szPts input")], n = boxes.filter(b => b.checked).length, r = n / boxes.length;
  const k = r >= 0.75 ? "ok" : r >= 0.4 ? "part" : "no";
  document.querySelectorAll("#szRate button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
  const miss = d.p.filter((p, i) => !boxes[i].checked).map(p => p[0]);
  let txt;
  if(k === "ok") txt = "Stark! Du hast " + n + " von " + boxes.length + " Punkten getroffen." + (miss.length ? " Noch gefehlt: " + miss.join("; ") + "." : " Nichts übersehen, das sitzt.");
  else if(k === "part") txt = "Fast! " + n + " von " + boxes.length + " Punkten. Es fehlen noch: " + miss.join("; ") + ".";
  else txt = n + " von " + boxes.length + " Punkten, das war noch dünn. Lies die Musterantwort in Ruhe und merk dir besonders: " + miss.slice(0, 3).join("; ") + ".";
  $("szFbT").textContent = txt;
  $("szFbM").dataset.mood = k === "ok" ? "happy" : k === "part" ? "wow" : "sad";
}

function rateIt(d, k){
  prog.tries[d.id] = (prog.tries[d.id] || 0) + 1;
  if(k === "ok") prog.ok[d.id] = 1; else delete prog.ok[d.id];
  const P = load(KEY(d.fid), {ok:{}, tries:{}}); if(!P.ok) P.ok = {}; if(!P.tries) P.tries = {};
  P.tries[d.id] = (P.tries[d.id] || 0) + 1; if(k === "ok") P.ok[d.id] = 1; else delete P.ok[d.id];
  save(KEY(d.fid), P);
  if(Coach.card(k === "ok" ? 3 : k === "part" ? 1 : 0)) sz.msg = "Tagesziel geschafft! +5 Nüsse 🌰";
  sz.res.push(k); sz.idx++; render();
}

function renderEnd(){
  const c = {ok: 0, part: 0, no: 0, skip: 0}; sz.res.forEach(r => c[r]++);
  const open = sz.items.filter((d, i) => sz.res[i] !== "ok");
  sec.innerHTML = `<div class="card"><div class="mrow"></div><h2>Runde geschafft</h2>
    <div class="score">${c.ok} von ${sz.items.length} gewusst</div>
    <p class="sub">Teilweise: ${c.part} · Nicht gewusst: ${c.no} · Übersprungen: ${c.skip}</p>
    ${open.length ? '<h3>Nochmal anschauen</h3><ul class="szlist">' + open.map(d => "<li>" + esc(d.h) + "</li>").join("") + "</ul>" : ""}
    <div class="row" style="margin-top:14px"><button class="btn" id="szAgain" type="button">Nächste Runde</button>
      <button class="btn secondary" id="szHome" type="button">Startseite</button></div></div>`;
  initMascot(); mascot(c.ok === sz.items.length ? "cheer" : "idle", c.ok === sz.items.length ? "Alles gewusst! Stark!" : "Die offenen Fälle kommen bald wieder.", c.ok === sz.items.length);
  window.scrollTo(0, 0);
  $("szAgain").onclick = () => { sz = null; render(); $("szGo").click(); };
  $("szHome").onclick = () => { sz = null; render(); };
}

/* ---------- Start ---------- */
loadProg(); data().forEach(d => selTopics.add(d.t));
renderBar();
if(kartei === "szen") setTab("practice");
})();
