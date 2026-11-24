/* Nuss-Shop: Zubehör für das Eichhörnchen und Farbthemen, bezahlt mit gesammelten Nüssen */
(function(){
const VB = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 479">';
const uri = inner => "url('data:image/svg+xml," + encodeURIComponent(VB + inner + "</svg>") + "')";

const ART = {
  zylinder: '<g transform="rotate(-6 243 98)"><ellipse cx="243" cy="99" rx="66" ry="10" fill="#1d1d21"/><rect x="208" y="26" width="70" height="73" rx="5" fill="#2a2a2f"/><ellipse cx="243" cy="26" rx="35" ry="7" fill="#3b3b42"/><rect x="208" y="76" width="70" height="13" fill="#c0392b"/></g>',
  party: '<g transform="rotate(-8 243 98)"><polygon points="243,8 203,100 283,100" fill="#ff6fa5"/><polygon points="243,8 223,54 263,54" fill="#ffd23f"/><polygon points="215,76 271,76 283,100 203,100" fill="#5ec2f2"/><circle cx="243" cy="10" r="11" fill="#fff3a6" stroke="#e0b800" stroke-width="2"/></g>',
  muetze: '<g><path d="M196 100 C196 52 228 24 264 30 C292 35 310 58 320 92 L292 98 C290 78 278 62 262 62 L262 100 Z" fill="#d12f2f"/><rect x="188" y="88" width="118" height="22" rx="11" fill="#fff"/><circle cx="321" cy="96" r="12" fill="#fff"/></g>',
  krone: '<g transform="rotate(-5 243 100)"><path d="M198 102 L203 52 L224 78 L243 42 L262 78 L283 52 L288 102 Z" fill="#f4c430" stroke="#b8860b" stroke-width="3" stroke-linejoin="round"/><circle cx="243" cy="86" r="6" fill="#e63946"/><circle cx="217" cy="92" r="4" fill="#3a86ff"/><circle cx="269" cy="92" r="4" fill="#3a86ff"/></g>',
  nerd: '<g fill="rgba(210,235,255,.28)" stroke="#232323" stroke-width="5"><circle cx="229" cy="152" r="25"/><circle cx="299" cy="151" r="25"/><path d="M254 150 Q264 143 274 150" fill="none"/><path d="M204 150 L190 144" fill="none"/></g>',
  sonne: '<g><rect x="203" y="136" width="52" height="34" rx="13" fill="#141414"/><rect x="273" y="135" width="52" height="34" rx="13" fill="#141414"/><path d="M255 148 Q264 142 273 147" stroke="#141414" stroke-width="5" fill="none"/><path d="M213 144 L225 144 M283 143 L295 143" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></g>',
  fliege: '<g><polygon points="243,226 212,208 212,244" fill="#2b3a8c"/><polygon points="243,226 274,208 274,244" fill="#2b3a8c"/><rect x="236" y="217" width="14" height="18" rx="5" fill="#1b255f"/></g>',
  schal: '<g><rect x="186" y="208" width="122" height="28" rx="14" fill="#c0392b"/><path d="M204 210 L212 234 M232 209 L240 235 M260 209 L268 235 M288 210 L294 234" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/><rect x="268" y="226" width="26" height="48" rx="9" fill="#c0392b"/><path d="M272 246 H290 M272 258 H290" stroke="#fff" stroke-width="4" opacity=".85"/></g>'
};
const ITEMS = [
  {id:"party", slot:"hat", name:"Partyhut", price:30},
  {id:"muetze", slot:"hat", name:"Weihnachtsmütze", price:40},
  {id:"zylinder", slot:"hat", name:"Zylinder", price:50},
  {id:"krone", slot:"hat", name:"Krone", price:150},
  {id:"nerd", slot:"face", name:"Nerd-Brille", price:40},
  {id:"sonne", slot:"face", name:"Sonnenbrille", price:60},
  {id:"fliege", slot:"neck", name:"Fliege", price:30},
  {id:"schal", slot:"neck", name:"Schal", price:40},
  {id:"blau", slot:"theme", name:"Blau", price:75, c:["#2f6fdd", "#e3edff", "#8fb6ff", "#2b3550"]},
  {id:"tuerkis", slot:"theme", name:"Türkis", price:75, c:["#17898c", "#d9f3f2", "#6fd6d8", "#25403f"]},
  {id:"violett", slot:"theme", name:"Violett", price:75, c:["#7a4fd1", "#eee6ff", "#b9a0ff", "#3a3350"]},
  {id:"pink", slot:"theme", name:"Pink", price:75, c:["#d6407f", "#ffe3ee", "#ff8fbf", "#4d2c3c"]}
];
const SLOTS = [["hat", "Hüte"], ["face", "Brillen"], ["neck", "Hals"], ["theme", "Farben der App"]];
const byId = id => ITEMS.find(i => i.id === id);

const S = load("shop_v1", {owned: [], eq: {}, spent: 0});
if(!S.owned) S.owned = []; if(!S.eq) S.eq = {}; if(!S.spent) S.spent = 0;
const keep = () => save("shop_v1", S);
const earned = () => FACH_IDS.reduce((a, f) => a + (+load(f + "_nuts_v1", 0) || 0), 0);
const balance = () => Math.max(0, earned() - S.spent);

function varsFor(eq){
  const o = {};
  ["hat", "face", "neck"].forEach(s => { o["--acc-" + s] = eq[s] && ART[eq[s]] ? uri(ART[eq[s]]) : "none"; });
  return o;
}
function applyGlobal(){
  const v = varsFor(S.eq), r = document.documentElement.style;
  Object.keys(v).forEach(k => r.setProperty(k, v[k]));
  let st = document.getElementById("shopTheme");
  if(!st){ st = document.createElement("style"); st.id = "shopTheme"; document.head.appendChild(st); }
  const t = S.eq.theme && byId(S.eq.theme);
  st.textContent = t ? `:root{--accent:${t.c[0]};--accent-weak:${t.c[1]}}
:root[data-theme="dark"]{--accent:${t.c[2]};--accent-weak:${t.c[3]}}
@media (prefers-color-scheme:dark){:root[data-theme="auto"]{--accent:${t.c[2]};--accent-weak:${t.c[3]}}}` : "";
}

const css = `
#shop .card{margin-bottom:14px}
.shtop{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.shtop .mascot{width:170px;cursor:default}
.shbal{font-size:1.8rem;font-weight:800;color:var(--accent);margin:0}
.shgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px;margin-top:10px}
.shi{border:2px solid var(--line);border-radius:16px;padding:8px;background:var(--card);display:flex;flex-direction:column;gap:6px;align-items:stretch;text-align:center}
.shi.on{border-color:var(--accent);background:var(--accent-weak)}
.shi .pv{height:84px;border-radius:12px;overflow:hidden;position:relative;background:var(--accent-weak);cursor:pointer}
.shi .pv i{position:absolute;left:calc(50% - 87px);top:-6px;width:137px;height:172px;background-repeat:no-repeat;background-size:100% 100%}
.shi .sw{height:84px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.shi .sw b{width:46px;height:46px;border-radius:50%;display:block;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.shi b.n{font-size:.9rem}
.shi button.btn{padding:7px 8px;font-size:.82rem;border-radius:12px}
.shi button.btn:disabled{opacity:.5;cursor:default}
`;
const st0 = document.createElement("style"); st0.textContent = css; document.head.appendChild(st0);

const sec = document.createElement("section"); sec.id = "shop"; sec.className = "hidden"; document.querySelector(".wrap").appendChild(sec);
const nav = $("tabs"), btn = document.createElement("button");
btn.setAttribute("role", "tab"); btn.dataset.tab = "shop"; btn.setAttribute("aria-selected", "false"); btn.textContent = "Shop"; btn.onclick = () => setTab("shop");
nav.insertBefore(btn, nav.querySelector('[data-tab="more"]'));

let tryOn = {}, msg = "";
function renderShop(){
  const bal = balance();
  const eqv = Object.assign({}, S.eq, tryOn);
  const pvs = varsFor(eqv), style = Object.keys(pvs).map(k => k + ":" + pvs[k]).join(";");
  const itemHtml = it => {
    const owned = S.owned.includes(it.id), on = S.eq[it.slot] === it.id, trying = tryOn[it.slot] === it.id;
    const pv = it.slot === "theme"
      ? `<div class="sw" data-try="${it.id}" style="background:${it.c[1]}"><b style="background:${it.c[0]}"></b></div>`
      : `<div class="pv" data-try="${it.id}"><i style="background-image:${ART[it.id] ? uri(ART[it.id]) : "none"},url(sq-happy.webp)"></i></div>`;
    const lab = owned ? (on ? "Ablegen" : "Anlegen") : (bal >= it.price ? `Kaufen · ${it.price} 🌰` : `${it.price} 🌰 (noch ${it.price - bal})`);
    return `<div class="shi${on || trying ? " on" : ""}">${pv}<b class="n">${esc(it.name)}${on ? " ✓" : ""}</b><button class="btn${owned && !on ? " secondary" : ""}" type="button" data-act="${it.id}"${!owned && bal < it.price ? " disabled" : ""}>${lab}</button></div>`;
  };
  sec.innerHTML = `<div class="card"><div class="shtop">
      <div class="mascot" data-mood="cheer" style="${style}" role="img" aria-label="Dein Eichhörnchen">${MASCOT_SVG}</div>
      <div style="flex:1 1 240px"><p class="shbal">🌰 ${bal} Nüsse</p>
      <p class="hint">Nüsse bekommst du beim Lernen: 1 pro richtiger Antwort und 5 fürs Tagesziel. Tippe auf ein Bild, um es anzuprobieren.</p>
      ${msg ? `<p class="msg ok">${esc(msg)}</p>` : ""}
      <button class="btn secondary small" id="shClear" type="button">Alles ablegen</button></div></div></div>` +
    SLOTS.map(([s, n]) => `<div class="card"><h2 style="margin:0">${n}</h2><div class="shgrid">${ITEMS.filter(i => i.slot === s).map(itemHtml).join("")}</div></div>`).join("");
  msg = "";
  sec.querySelectorAll("[data-try]").forEach(e => e.onclick = () => { const it = byId(e.dataset.try); tryOn[it.slot] = tryOn[it.slot] === it.id ? undefined : it.id; if(it.slot === "theme"){ delete tryOn.theme; } renderShop(); });
  sec.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const it = byId(b.dataset.act); if(!it) return;
    if(!S.owned.includes(it.id)){
      if(balance() < it.price) return;
      S.spent += it.price; S.owned.push(it.id); S.eq[it.slot] = it.id; msg = it.name + " gekauft und angelegt!";
    }else if(S.eq[it.slot] === it.id) delete S.eq[it.slot];
    else S.eq[it.slot] = it.id;
    tryOn = {}; keep(); applyGlobal(); renderShop();
  });
  $("shClear").onclick = () => { S.eq = {}; tryOn = {}; keep(); applyGlobal(); renderShop(); };
}
window.TabHooks = Object.assign(window.TabHooks || {}, {shop: () => { tryOn = {}; renderShop(); }});
applyGlobal();
window.__shop = {S, balance, earned};
})();
