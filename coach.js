/* Eichhörnchen als Coach: Tagesziel, Serie, Nuss-Vorrat, Schwächen-Tipp. Dazu der Darstellungs-Schalter. */
(function(){
const fmt = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today = () => fmt(new Date());
const yest = () => { const d = new Date(); d.setDate(d.getDate()-1); return fmt(d); };
let daily = load("quiz_daily_v1", {date:"", n:0, goal:20, streak:0, last:"", done:false});
const keep = () => save("quiz_daily_v1", daily);
function roll(){ if(daily.date !== today()){ daily.date = today(); daily.n = 0; daily.done = false; keep(); } }
const nutsKey = () => fach + "_nuts_v1";
const nuts = () => +load(nutsKey(), 0) || 0;
const RANKS = [[0,"Nuss-Neuling"],[25,"Fleißiger Sammler"],[75,"Vorratskünstler"],[150,"Eichhörnchen-Profi"],[300,"Nuss-Meister"],[600,"Nuss-Legende"]];
function rank(n){ let i = 0; RANKS.forEach((r,k)=>{ if(n >= r[0]) i = k; }); return {name:RANKS[i][1], next:RANKS[i+1]||null}; }
const streakNow = () => (daily.last === today() || daily.last === yest()) ? daily.streak : 0;
const cleanTag = t => String(TAGS[t]||t).replace(/^(WG\d+\s*·\s*)?(\d+\s*·\s*)?/, "");

const Coach = window.Coach = {
  /* Eine Karte bearbeitet. add = Nüsse. Gibt true zurück, wenn dadurch das Tagesziel erreicht wurde. */
  card(add){
    roll(); daily.n++;
    if(add) save(nutsKey(), nuts() + add);
    let hit = false;
    if(!daily.done && daily.n >= daily.goal){
      daily.done = true; hit = true;
      daily.streak = daily.last === today() ? daily.streak : (daily.last === yest() ? daily.streak + 1 : 1);
      daily.last = today(); save(nutsKey(), nuts() + 5);
    }
    keep(); return hit;
  },
  goalHtml(){
    roll();
    const pct = Math.min(100, Math.round(daily.n/daily.goal*100)), n = nuts(), r = rank(n), st = streakNow();
    const opts = [10,20,30,50].map(g => '<option value="'+g+'"'+(g===daily.goal?" selected":"")+'>'+g+'</option>').join("");
    return '<div class="goal"><div class="gtop"><span>Tagesziel: '+Math.min(daily.n,daily.goal)+' von <select id="goalSel" aria-label="Tagesziel">'+opts+'</select> Karten</span><span>'+pct+' %</span></div>'+
      '<div class="bar"><i style="width:'+pct+'%"></i></div>'+
      '<div class="nutrow"><span>🌰 '+n+' Nüsse</span><span>'+r.name+(r.next?" · noch "+(r.next[0]-n)+" bis „"+r.next[1]+"“":"")+'</span><span>🔥 Serie: '+st+(st===1?" Tag":" Tage")+'</span></div></div>';
  },
  mountGoal(el, again){
    el.innerHTML = Coach.goalHtml();
    const sel = el.querySelector("#goalSel");
    if(sel) sel.onchange = () => { daily.goal = +sel.value; keep(); again(); };
  },
  goalDone(){ roll(); return daily.done; },
  left(){ roll(); return Math.max(0, daily.goal - daily.n); }
};

/* Schwächstes Thema im aktuellen Fach (mind. 4 beantwortete Fragen, unter 75 % richtig) */
function weakTag(){
  const by = {};
  allQ().forEach(p => { const s = stats.q[p.id]; if(!s) return; const o = by[p.tag] || (by[p.tag] = {r:0,w:0}); o.r += s.r; o.w += s.w; });
  let best = null;
  Object.keys(by).forEach(t => { const n = by[t].r + by[t].w; if(n < 4) return; const pc = by[t].r / n; if(pc < 0.75 && (!best || pc < best.pc)) best = {t, pc, n}; });
  return best;
}
const answeredTotal = () => Object.values(stats.q).reduce((a,s)=>a+s.r+s.w, 0);

/* Übersicht (Üben) um den Coach erweitern */
const _rp = renderPractice;
renderPractice = function(){
  _rp();
  const area = $("coachArea"); if(!area) return;
  const weak = weakTag(), total = answeredTotal();
  let msg, html;
  if(weak){
    const name = cleanTag(weak.t), pc = Math.round(weak.pc*100);
    msg = "Bei „"+name+"“ hakt es noch. Üben wir das?";
    html = '<div class="coach"><b>Tipp vom Eichhörnchen</b>„'+esc(name)+'“ sitzt erst zu '+pc+' % (nach '+weak.n+' Antworten). Zehn Fragen dazu?<div class="row"><button class="btn small" id="coachGo" type="button">'+esc(name)+' üben</button></div></div>';
  } else if(!total){
    msg = "Hallo! Such dir ein Thema aus, oder starte gleich mit der ersten Runde.";
    html = '<div class="coach"><b>Los geht’s</b>Zehn Fragen quer durchs Fach, dann sehe ich, wo wir ansetzen.<div class="row"><button class="btn small" id="coachGo" type="button">Erste Runde starten</button></div></div>';
  } else {
    msg = Coach.goalDone() ? "Tagesziel geschafft! Alles darüber ist Bonus. 🌰" : "Noch "+Coach.left()+" Karten bis zum Tagesziel.";
    html = '<div class="coach"><b>Alles im grünen Bereich</b>Keine Schwäche in Sicht. Mach mit neuen Fragen weiter.<div class="row"><button class="btn small" id="coachGo" type="button">10 neue Fragen</button></div></div>';
  }
  area.innerHTML = '<div id="goalMount"></div>' + html;
  Coach.mountGoal($("goalMount"), renderPractice);
  const go = $("coachGo");
  if(go) go.onclick = () => {
    const tags = weak ? new Set([weak.t]) : new Set(Object.keys(TAGS));
    startTest(pickQuestions(tags, 10), "learn", 0);
  };
  mascot("idle", msg);
};

/* Nüsse und Tagesziel bei Fragen vergeben */
const _choose = choose;
choose = function(i){
  const it = test && test.items[test.idx], was = it ? it.answer : null, learn = test && test.mode !== "exam";
  _choose(i);
  if(learn && it && was === null && it.answer !== null){
    const hit = Coach.card(isRight(it) ? 1 : 0);
    if(hit) mascot("cheer", "Tagesziel geschafft! +5 Nüsse 🌰", true);
  }
};
const _finish = finish;
finish = function(timeUp){
  const exam = test && test.mode === "exam", right = exam ? test.items.filter(isRight).length : 0;
  const answered = exam ? test.items.filter(x => x.answer !== null).length : 0;
  _finish(timeUp);
  if(exam && answered){
    let hit = false;
    for(let k = 0; k < answered; k++) hit = Coach.card(k < right ? 1 : 0) || hit;
    if(hit) mascot("cheer", "Tagesziel geschafft! +5 Nüsse 🌰", true);
  }
};

/* Darstellung: Hell, Dunkel, Auto */
const themeBar = $("themeBar");
function setTheme(t){
  document.documentElement.dataset.theme = t; save("quiz_theme", t);
  const m = document.querySelector('meta[name=theme-color]');
  if(m) m.content = (t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches)) ? "#251f24" : "#ffdcc8";
  renderThemeBar();
}
function renderThemeBar(){
  const cur = document.documentElement.dataset.theme || "light";
  themeBar.innerHTML = "";
  [["light","Hell"],["dark","Dunkel"],["auto","Auto"]].forEach(([k,n]) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = n; b.setAttribute("aria-pressed", cur === k);
    b.onclick = () => setTheme(k); themeBar.appendChild(b);
  });
}
renderThemeBar();
if(!$("practice").classList.contains("hidden")) renderPractice();
})();
