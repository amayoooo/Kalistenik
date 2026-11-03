/* =========================================================
   KALISTENIK PRO — LOGIKA APLIKASI
   Semua data tersimpan di HP (localStorage), tanpa server.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Penyimpanan ---------------- */
  const KEY = "kalistenik-pro-v1";
  const DEFAULT = { onboarded: false, level: 1, mastered: {}, best: {}, last: {}, logs: [], pelvicName: "Core Dalam", theme: "system", sound: true };
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw));
    } catch (e) { /* penyimpanan tidak tersedia */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* abaikan */ } }

  /* ---------------- Ikon ---------------- */
  const I = {
    check: '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 5v14l12-7z"/></svg>',
    dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    pelvic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;flex:none;stroke:var(--accent)"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
  };

  /* ---------------- Helper ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const view = $("#view");
  const layer = $("#layer");
  const LV = (n) => LEVELS[n - 1];
  const lvColor = (n) => `var(--l${n})`;
  const catName = (k) => k === "pelvic" ? S.pelvicName : CATEGORIES.find(c => c.key === k).name;
  const exById = (id) => EXERCISES.find(e => e.id === id);
  const dk = (d) => { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const todayKey = () => dk(Date.now());
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const unitTxt = (e) => e.unit === "hold" ? " dtk" : "";
  const sideTxt = (e) => e.side ? "/sisi" : "";
  const rx = (e) => `${e.sets}×${e.min === e.max ? e.min : e.min + "–" + e.max}${unitTxt(e)}${sideTxt(e)}`;
  const tgt = (e) => `${e.tSets}×${e.tVal}${unitTxt(e)}${sideTxt(e)}`;
  function weekStart(d) { d = new Date(d); d.setHours(0, 0, 0, 0); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d; }

  /* ---------------- Animasi gerakan (anim.js) ---------------- */
  const hasAnim = (id) => !!(window.Anim && window.Anim.has(id));
  const mountAnim = (box, id) => { try { if (box && window.Anim) window.Anim.mount(box, id); } catch (e) { box && box.remove(); } };

  /* ---------------- Status progresi ---------------- */
  function chain(cat, lv) { return EXERCISES.filter(e => e.cat === cat && e.lv === lv); }
  function isDone(e) { return !!S.mastered[e.id]; }
  function isUnlocked(e) {
    if (e.lv < S.level) return true;
    if (e.lv > S.level) return false;
    const c = chain(e.cat, e.lv); const i = c.indexOf(e);
    return i === 0 || isDone(c[i - 1]);
  }
  function status(e) { return isDone(e) ? "done" : isUnlocked(e) ? "open" : "locked"; }
  function gates(lv) { return EXERCISES.filter(e => e.lv === lv && e.gate); }
  function readyToLevelUp() { return S.level < 4 && gates(S.level).every(isDone); }
  function nextInChain(e) { const c = chain(e.cat, e.lv); return c[c.indexOf(e) + 1] || null; }

  function sessionFor(day, level = S.level) {
    const d = SCHEDULE[level][day];
    if (!d) return null;
    let items = [];
    d.cats.forEach(cat => {
      const list = EXERCISES.filter(e => e.cat === cat && e.lv === level && (level !== S.level || isUnlocked(e)));
      items = items.concat(list.slice(0, 3));
    });
    return { name: d.name, items: items.slice(0, 7) };
  }
  function estMinutes(items) {
    const rest = LV(S.level).rest;
    return Math.max(10, Math.round(items.reduce((t, e) => t + e.sets * ((e.unit === "hold" ? e.max : e.max * 3) * (e.side ? 2 : 1) + rest), 0) / 60) + 5);
  }

  /* ---------------- Statistik ---------------- */
  function workoutLogs() { return S.logs.filter(l => l.type === "workout"); }
  function streak() {
    const days = new Set(S.logs.map(l => l.date));
    let d = new Date(); d.setHours(12);
    if (!days.has(dk(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(dk(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function sessionsThisWeek() { const ws = weekStart(Date.now()).getTime(); return workoutLogs().filter(l => l.ts >= ws).length; }
  function totalSets() { return S.logs.reduce((t, l) => t + (l.sets || 0), 0); }

  /* ---------------- Tema ---------------- */
  function applyTheme() {
    const r = document.documentElement;
    if (S.theme === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", S.theme);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", getComputedStyle(document.body).getPropertyValue("--bg").trim() || "#0F1215");
  }

  /* ---------------- Toast ---------------- */
  let toastT;
  function toast(msg) {
    let t = $(".toast"); if (t) t.remove();
    t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
  }

  /* ---------------- Suara, getar, layar tetap menyala ---------------- */
  let actx = null, wake = null;
  function ensureAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) { actx = null; } }
  function beep(freq = 880, dur = 0.12, times = 1) {
    if (!S.sound || !actx) return;
    try {
      for (let i = 0; i < times; i++) {
        const o = actx.createOscillator(), g = actx.createGain(); const t0 = actx.currentTime + i * (dur + 0.08);
        o.frequency.value = freq; o.type = "sine"; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      }
    } catch (e) { /* abaikan */ }
  }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* abaikan */ } }
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); }
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }

  /* =========================================================
     ROUTER
     ========================================================= */
  const ROUTES = { home: renderHome, program: renderProgram, map: renderMap, progress: renderProgress, profile: renderProfile };
  const UI = { programLv: null, mapCat: "push" };
  function route() {
    let r = (location.hash || "#home").slice(1);
    if (!ROUTES[r]) r = "home";
    document.querySelectorAll(".tabs a").forEach(a => { if (a.dataset.tab === r) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const chip = $("#lvchip"); chip.style.setProperty("--lvc", lvColor(S.level)); chip.querySelector("span").textContent = `LV${S.level} · ${LV(S.level).name}`;
    ROUTES[r]();
    window.scrollTo(0, 0);
  }
  function rerender() { const r = (location.hash || "#home").slice(1); (ROUTES[r] || renderHome)(); const chip = $("#lvchip"); chip.style.setProperty("--lvc", lvColor(S.level)); chip.querySelector("span").textContent = `LV${S.level} · ${LV(S.level).name}`; }

  /* =========================================================
     BERANDA
     ========================================================= */
  function renderHome() {
    const now = new Date(); const day = now.getDay();
    const ses = sessionFor(day);
    const doneToday = workoutLogs().some(l => l.date === todayKey());
    const pelvicToday = S.logs.some(l => l.type === "pelvic" && l.date === todayKey());
    const pList = PELVIC.filter(p => p.lv === S.level);
    const hr = now.getHours();
    const greet = hr < 11 ? "Selamat pagi" : hr < 15 ? "Selamat siang" : hr < 19 ? "Selamat sore" : "Selamat malam";

    let banner = "";
    if (readyToLevelUp()) {
      banner = `<div class="banner">${I.up}<p><b>Syarat ${LV(S.level).name} terpenuhi</b>Kamu siap naik ke ${LV(S.level + 1).name}.</p><button class="btn btn-primary" data-act="levelup" style="min-height:40px;padding:0 14px">Naik level</button></div>`;
    }

    let hero;
    if (ses) {
      hero = `<section class="hero" data-lv="0${S.level}">
        <div class="eyebrow">${greet} · ${DAY_NAMES[day]}</div>
        <h1>${ses.name}</h1>
        <div class="meta"><span><b>${ses.items.length}</b> gerakan</span><span><b>±${estMinutes(ses.items)}</b> menit</span><span>Istirahat <b>${LV(S.level).rest} dtk</b></span></div>
        <ul class="exlist">${ses.items.map((e, i) => `<li><span class="ix">${String(i + 1).padStart(2, "0")}</span><span class="nm">${e.name}<small>${catName(e.cat)}${isDone(e) ? " · lulus" : ""}</small></span><span class="rx">${rx(e)}</span></li>`).join("")}</ul>
        <div style="margin-top:16px">${doneToday
          ? `<button class="btn btn-ghost btn-block" data-act="start-today">${I.check.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2.6"')} Sesi hari ini selesai · ulangi</button>`
          : `<button class="btn btn-primary btn-block" data-act="start-today">${I.play} Mulai latihan</button>`}</div>
      </section>`;
    } else {
      hero = `<section class="hero" data-lv="0${S.level}">
        <div class="eyebrow">${greet} · ${DAY_NAMES[day]}</div>
        <h1>Hari pemulihan</h1>
        <p class="muted" style="margin:8px 0 0;max-width:36ch">Otot tumbuh saat istirahat. Lakukan latihan ${S.pelvicName} dan peregangan ringan hari ini.</p>
        <div class="row" style="margin-top:16px"><button class="btn btn-primary" data-act="start-pelvic">${I.play} ${S.pelvicName}</button><a class="btn btn-line" href="#program" style="text-decoration:none">Pilih sesi lain</a></div>
      </section>`;
    }

    const ws = weekStart(now); const wl = workoutLogs();
    const strip = [...Array(7)].map((_, i) => {
      const d = new Date(ws); d.setDate(ws.getDate() + i);
      const k = dk(d), wd = d.getDay();
      const done = wl.some(l => l.date === k), plan = !!SCHEDULE[S.level][wd], tod = k === todayKey();
      return `<div class="wd ${done ? "done" : plan ? "plan" : ""} ${tod ? "today" : ""}"><span>${DAY_SHORT[wd]}</span><span class="dot">${done ? '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ""}</span><span class="num" style="font-size:12px">${d.getDate()}</span></div>`;
    }).join("");

    view.innerHTML = `<div class="view">
      ${banner}
      ${hero}
      <button class="pcard" data-act="start-pelvic">
        <span class="ic">${I.pelvic}</span>
        <span class="tx"><b>${S.pelvicName} harian ${pelvicToday ? "· selesai" : ""}</b><span>${pList.length} latihan terpandu · 5–10 menit · bisa di mana saja</span></span>${I.chev}
      </button>
      <section>
        <div class="section-h" style="margin-bottom:10px"><h2>Minggu ini</h2><span class="eyebrow">${sessionsThisWeek()} / ${Object.keys(SCHEDULE[S.level]).length} sesi</span></div>
        <div class="week">${strip}</div>
      </section>
      <div class="stats">
        <div class="stat"><div class="v">${streak()}<small>hari</small></div><div class="k">Streak</div></div>
        <div class="stat"><div class="v">${workoutLogs().length}</div><div class="k">Total sesi</div></div>
        <div class="stat"><div class="v">${totalSets()}</div><div class="k">Total set</div></div>
      </div>
    </div>`;

    view.querySelector('[data-act="start-today"]')?.addEventListener("click", () => startWorkout(ses.items, ses.name));
    view.querySelectorAll('[data-act="start-pelvic"]').forEach(b => b.addEventListener("click", () => startPelvic(pList, `${S.pelvicName} harian`, true)));
    view.querySelector('[data-act="levelup"]')?.addEventListener("click", levelUp);
  }

  function levelUp() {
    if (S.level >= 4) return;
    S.level++; save(); toast(`Selamat! Kamu sekarang level ${LV(S.level).name}`); buzz([60, 40, 120]); rerender();
  }

  /* =========================================================
     PROGRAM
     ========================================================= */
  function renderProgram() {
    const lv = UI.programLv || S.level; const L = LV(lv); const today = new Date().getDay();
    const order = [1, 2, 3, 4, 5, 6, 0];
    const days = order.map(d => {
      const s = sessionFor(d, lv);
      if (!s) return `<div class="day rest ${d === today && lv === S.level ? "is-today" : ""}"><span class="dn">${DAY_NAMES[d].slice(0, 3)}</span><span class="dt"><b>Istirahat</b><span>${S.pelvicName} + mobilitas ringan</span></span><span></span></div>`;
      return `<button class="day ${d === today && lv === S.level ? "is-today" : ""}" data-day="${d}"><span class="dn">${DAY_NAMES[d].slice(0, 3)}</span><span class="dt"><b>${s.name}</b><span>${s.items.length ? s.items.map(e => e.name).slice(0, 3).join(" · ") + (s.items.length > 3 ? ` +${s.items.length - 3}` : "") : "Belum ada gerakan terbuka"}</span></span>${I.chev}</button>`;
    }).join("");
    const g = gates(lv);
    view.innerHTML = `<div class="view">
      <div class="seg" role="group" aria-label="Pilih level">${LEVELS.map(l => `<button aria-pressed="${l.n === lv}" data-lv="${l.n}">${l.n}. ${l.name}</button>`).join("")}</div>
      <section class="card" style="border-top:3px solid ${lvColor(lv)}">
        <div class="eyebrow" style="color:${lvColor(lv)}">Level ${lv}${lv === S.level ? " · level kamu" : lv < S.level ? " · sudah dilewati" : " · terkunci"}</div>
        <h2 style="font-size:34px;text-transform:uppercase;margin:4px 0 12px">${L.name}</h2>
        <dl class="lvinfo" style="margin:0">
          <div><dt>Target</dt><dd>${L.goal}</dd></div>
          <div><dt>Durasi</dt><dd>${L.dur}</dd></div>
          <div><dt>Frekuensi</dt><dd>${L.freq}</dd></div>
          <div><dt>Istirahat set</dt><dd>${L.rest} detik</dd></div>
        </dl>
      </section>
      <section><div class="section-h" style="margin-bottom:10px"><h2>Jadwal mingguan</h2></div><div class="days">${days}</div></section>
      ${g.length ? `<section><div class="section-h" style="margin-bottom:4px"><h2>Syarat naik level</h2><span class="eyebrow">${g.filter(isDone).length}/${g.length}</span></div>
        <div class="list" style="margin-top:8px">${g.map(e => `<button class="li" data-ex="${e.id}"><span class="tx"><b>${e.name}</b><span>Target ${tgt(e)}</span></span>${pill(e)}</button>`).join("")}</div></section>` : `<section class="card"><b>Level tertinggi.</b><p class="muted" style="margin:4px 0 0">Target akhir: one-arm push-up, one-arm pull-up, full front lever, straddle planche, freestanding HSPU, dan handstand 60 detik.</p></section>`}
      <p class="note">Aturan: kalau semua set mencapai batas atas repetisi, tambah repetisi atau naik ke gerakan berikutnya. Setiap 6–8 minggu lakukan 1 minggu ringan (volume 50%). Tes ulang setiap 4 minggu.</p>
    </div>`;
    view.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => { UI.programLv = +b.dataset.lv; renderProgram(); }));
    view.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => openSessionSheet(+b.dataset.day, lv)));
    view.querySelectorAll("[data-ex]").forEach(b => b.addEventListener("click", () => openExercise(exById(b.dataset.ex))));
  }
  function pill(e) {
    const s = status(e);
    return s === "done" ? `<span class="pill ok">Lulus</span>` : s === "open" ? `<span class="pill cur">Terbuka</span>` : `<span class="pill lock">Terkunci</span>`;
  }

  function openSessionSheet(day, lv) {
    const s = sessionFor(day, lv);
    const canStart = lv <= S.level && s.items.length;
    sheet(`<div class="eyebrow">${DAY_NAMES[day]} · Level ${lv}</div><h2>${s.name}</h2>
      <ul class="exlist">${s.items.map((e, i) => `<li><span class="ix">${String(i + 1).padStart(2, "0")}</span><span class="nm">${e.name}<small>${catName(e.cat)} · target ${tgt(e)}</small></span><span class="rx">${rx(e)}</span></li>`).join("")}</ul>
      ${lv > S.level ? `<p class="note" style="margin-top:12px">Contoh jadwal level ${LV(lv).name}. Terbuka setelah syarat level sebelumnya terpenuhi.</p>` : ""}
      <div style="margin-top:16px">${canStart ? `<button class="btn btn-primary btn-block" data-go>${I.play} Mulai sesi ini</button>` : `<button class="btn btn-ghost btn-block" data-close>Tutup</button>`}</div>`,
      (el) => { el.querySelector("[data-go]")?.addEventListener("click", () => { closeSheet(); startWorkout(s.items, s.name); }); });
  }

  /* =========================================================
     PETA SKILL
     ========================================================= */
  function renderMap() {
    const cat = UI.mapCat;
    let body = "", done = 0, total = 0;
    if (cat === "pelvic") {
      total = PELVIC.length; done = PELVIC.filter(p => p.lv <= S.level).length;
      body = LEVELS.map(L => {
        const list = PELVIC.filter(p => p.lv === L.n); const open = L.n <= S.level;
        return `<div class="tier"><div class="tier-h"><span class="tag ${open ? "" : "dim"}" style="--c:${lvColor(L.n)}">${L.name.toUpperCase()}</span><small>${open ? "terbuka" : "terkunci"}</small></div>
          ${list.map(p => `<button class="node ${open ? "open" : "locked"}" data-p="${p.id}"><span class="st">${open ? I.dot : I.lock}</span><span class="nm">${p.name}<small>${p.rx}</small></span><span class="tg">${open ? "Mulai" : ""}</span></button>`).join("")}</div>`;
      }).join("");
    } else {
      const all = EXERCISES.filter(e => e.cat === cat); total = all.length; done = all.filter(isDone).length;
      body = LEVELS.map(L => {
        const list = chain(cat, L.n); if (!list.length) return "";
        const tierDone = list.filter(isDone).length;
        return `<div class="tier"><div class="tier-h"><span class="tag ${L.n <= S.level ? "" : "dim"}" style="--c:${lvColor(L.n)}">${L.name.toUpperCase()}</span><small>${tierDone}/${list.length} lulus</small></div>
          ${list.map(e => { const s = status(e); return `<button class="node ${s}" data-ex="${e.id}"><span class="st">${s === "done" ? I.check : s === "open" ? I.dot : I.lock}</span><span class="nm">${e.name}<small>${s === "locked" ? (e.lv > S.level ? "Terbuka di level " + LV(e.lv).name : "Lulus gerakan sebelumnya untuk membuka") : "Latihan " + rx(e)}</small></span><span class="tg">${tgt(e)}</span></button>`; }).join("")}</div>`;
      }).join("");
    }
    const c = CATEGORIES.find(c => c.key === cat);
    view.innerHTML = `<div class="view">
      <div class="seg" role="group" aria-label="Kategori">${CATEGORIES.map(k => `<button aria-pressed="${k.key === cat}" data-cat="${k.key}">${catName(k.key)}</button>`).join("")}</div>
      <section>
        <div class="cat-head"><div><div class="eyebrow">${c.sub}</div><h2>${catName(cat)}</h2></div><span class="num" style="font-size:22px;font-weight:700">${done}<span class="muted">/${total}</span></span></div>
        <div class="bar" style="margin-top:10px"><i style="width:${total ? done / total * 100 : 0}%"></i></div>
        <p class="note" style="margin:8px 0 0">${cat === "pelvic" ? "Latihan terbuka sesuai level kamu. Lakukan setiap hari, 2–3 sesi pendek." : "Kolom kanan adalah target lulus. Capai target untuk membuka gerakan berikutnya."}</p>
      </section>
      <section>${body}</section>
    </div>`;
    view.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => { UI.mapCat = b.dataset.cat; renderMap(); }));
    view.querySelectorAll("[data-ex]").forEach(b => b.addEventListener("click", () => openExercise(exById(b.dataset.ex))));
    view.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => openPelvic(PELVIC.find(p => p.id === b.dataset.p))));
  }

  function openExercise(e) {
    const s = status(e); const best = S.best[e.id];
    sheet(`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill" style="color:${lvColor(e.lv)}">${LV(e.lv).name}</span><span class="pill">${catName(e.cat)}</span>${pill(e)}${e.gate ? '<span class="pill">Syarat naik level</span>' : ""}</div>
      ${hasAnim(e.id) ? '<div class="anim" id="exanim"></div>' : ""}
      <h2>${e.name}</h2>
      <div class="rxgrid">
        <div class="rxbox"><div class="eyebrow">Latihan</div><div class="v">${rx(e)}</div></div>
        <div class="rxbox tgt"><div class="eyebrow">Target lulus</div><div class="v">${tgt(e)}</div></div>
      </div>
      ${best ? `<p class="muted" style="margin:0 0 4px;font-size:13px">Rekor terbaik: <b style="color:var(--fg)">${best}${unitTxt(e)}</b> dalam 1 set</p>` : ""}
      <h3>Cara melakukan</h3><ol class="steps">${e.how.map(h => `<li>${h}</li>`).join("")}</ol>
      <h3>Kesalahan umum</h3><ul class="warnl">${e.mistakes.map(h => `<li>${h}</li>`).join("")}</ul>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:20px">
        ${s === "locked" ? `<button class="btn btn-ghost btn-block" disabled style="opacity:.6">${I.lock.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2"')} Terkunci</button>`
          : `<button class="btn btn-primary btn-block" data-go>${I.play} Latih gerakan ini</button>${s === "open" ? `<button class="btn btn-line btn-block" data-mark>Saya sudah mencapai target</button>` : ""}`}
      </div>`,
      (el) => {
        mountAnim(el.querySelector("#exanim"), e.id);
        el.querySelector("[data-go]")?.addEventListener("click", () => { closeSheet(); startWorkout([e], e.name); });
        el.querySelector("[data-mark]")?.addEventListener("click", () => { markMastered(e); closeSheet(); rerender(); });
      });
  }
  function markMastered(e) {
    S.mastered[e.id] = Date.now(); save();
    const n = nextInChain(e);
    toast(n ? `${e.name} lulus. ${n.name} terbuka` : `${e.name} lulus`);
    buzz([40, 30, 80]);
  }

  function openPelvic(p) {
    const open = p.lv <= S.level; const dur = Math.round(p.steps().reduce((t, s) => t + s.sec, 0) / 60);
    sheet(`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill" style="color:${lvColor(p.lv)}">${LV(p.lv).name}</span><span class="pill" style="color:var(--pelvic)">${S.pelvicName}</span></div>
      ${hasAnim(p.id) ? '<div class="anim" id="exanim"></div>' : ""}
      <h2>${p.name}</h2>
      <div class="rxgrid"><div class="rxbox"><div class="eyebrow">Latihan</div><div class="v" style="font-size:19px">${p.rx}</div></div><div class="rxbox tgt"><div class="eyebrow">Target</div><div class="v" style="font-size:19px">${p.target}</div></div></div>
      <p class="muted" style="margin:0;font-size:13px">Durasi pemandu ±${Math.max(1, dur)} menit</p>
      <h3>Cara melakukan</h3><ol class="steps">${p.how.map(h => `<li>${h}</li>`).join("")}</ol>
      <h3>Prinsip penting</h3><p style="margin:6px 0 0;font-size:14px">Waktu rileks sama atau lebih lama dari waktu kontraksi. Perut, bokong, dan paha tetap rileks. Jangan rutin berlatih sambil menghentikan pipis.</p>
      <div style="margin-top:20px">${open ? `<button class="btn btn-primary btn-block" data-go>${I.play} Mulai pemandu</button>` : `<button class="btn btn-ghost btn-block" disabled style="opacity:.6">Terbuka di level ${LV(p.lv).name}</button>`}</div>`,
      (el) => { mountAnim(el.querySelector("#exanim"), p.id); el.querySelector("[data-go]")?.addEventListener("click", () => { closeSheet(); startPelvic([p], p.name); }); });
  }

  /* =========================================================
     PROGRES
     ========================================================= */
  function renderProgress() {
    const wl = workoutLogs();
    const minutes = Math.round(S.logs.reduce((t, l) => t + (l.dur || 0), 0) / 60);
    const reps = S.logs.reduce((t, l) => t + (l.reps || 0), 0);
    const cats = CATEGORIES.filter(c => c.key !== "pelvic").map(c => { const all = EXERCISES.filter(e => e.cat === c.key); const d = all.filter(isDone).length; return `<div class="catrow"><span>${c.name}</span><div class="bar"><i style="width:${d / all.length * 100}%"></i></div><span class="num">${d}/${all.length}</span></div>`; }).join("");
    const hist = S.logs.slice().sort((a, b) => b.ts - a.ts).slice(0, 25).map(l => {
      const d = new Date(l.ts);
      return `<li><div class="d"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></div><div class="t"><b>${l.title}</b><span>${l.type === "pelvic" ? `${l.items.length} latihan terpandu` : `${l.items.length} gerakan · ${l.sets} set`} · ${fmtTime(l.dur)} menit</span></div><span class="pill" style="${l.type === "pelvic" ? "color:var(--pelvic)" : ""}">${l.type === "pelvic" ? S.pelvicName : "Latihan"}</span></li>`;
    }).join("");
    view.innerHTML = `<div class="view">
      <div class="section-h"><h2>Progres</h2><span class="eyebrow">Level ${S.level} · ${LV(S.level).name}</span></div>
      <div class="stats">
        <div class="stat"><div class="v">${wl.length}</div><div class="k">Sesi latihan</div></div>
        <div class="stat"><div class="v">${minutes}<small>mnt</small></div><div class="k">Waktu latih</div></div>
        <div class="stat"><div class="v">${streak()}<small>hari</small></div><div class="k">Streak</div></div>
      </div>
      <section class="card">
        <div class="section-h" style="margin-bottom:6px"><b>Sesi per minggu</b><span class="eyebrow">8 minggu terakhir</span></div>
        ${weeklyChart()}
      </section>
      <section class="card"><div class="section-h" style="margin-bottom:12px"><b>Gerakan lulus per kategori</b><span class="eyebrow">${EXERCISES.filter(isDone).length}/${EXERCISES.length}</span></div><div class="cats">${cats}</div></section>
      <section><div class="section-h" style="margin-bottom:4px"><h2>Riwayat</h2><span class="eyebrow">${reps} repetisi total</span></div>
        <div class="hist">${hist ? `<ul>${hist}</ul>` : `<div class="empty">Belum ada latihan tercatat.<br>Selesaikan sesi pertama dari Beranda.</div>`}</div></section>
    </div>`;
  }
  function weeklyChart() {
    const ws = weekStart(Date.now()); const weeks = [];
    for (let i = 7; i >= 0; i--) { const s = new Date(ws); s.setDate(s.getDate() - i * 7); const e = new Date(s); e.setDate(e.getDate() + 7); weeks.push({ s, n: workoutLogs().filter(l => l.ts >= s.getTime() && l.ts < e.getTime()).length, p: S.logs.filter(l => l.type === "pelvic" && l.ts >= s.getTime() && l.ts < e.getTime()).length }); }
    const plan = Object.keys(SCHEDULE[S.level]).length;
    const max = Math.max(plan, ...weeks.map(w => w.n), 1);
    const W = 320, H = 150, pl = 22, pb = 26, pt = 14, cw = (W - pl) / 8, bw = cw * 0.52;
    const y = (v) => pt + (H - pt - pb) * (1 - v / max);
    const ff = "font-family:var(--f-display)";
    let g = "";
    for (let v = 0; v <= max; v++) g += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" style="stroke:${v === plan ? "var(--muted)" : "var(--line)"};stroke-width:1" ${v === plan ? 'stroke-dasharray="3 3"' : ""}/><text x="${pl - 6}" y="${y(v) + 3.5}" text-anchor="end" style="font-size:10px;fill:var(--muted);${ff}">${v}</text>`;
    const bars = weeks.map((w, i) => {
      const x = pl + i * cw + (cw - bw) / 2; const h = (H - pt - pb) * (w.n / max); const cur = i === 7;
      return `<rect x="${x}" y="${y(w.n)}" width="${bw}" height="${Math.max(h, 0)}" rx="3" style="fill:${cur ? "var(--accent)" : "color-mix(in srgb,var(--accent) 45%,var(--surface-2))"}"/>${w.n ? `<text x="${x + bw / 2}" y="${y(w.n) - 4}" text-anchor="middle" style="font-size:11px;font-weight:700;fill:var(--fg);${ff}">${w.n}</text>` : ""}<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" style="font-size:10px;fill:${cur ? "var(--fg)" : "var(--muted)"};${ff}">${w.s.getDate()} ${MONTHS[w.s.getMonth()]}</text>`;
    }).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Jumlah sesi latihan per minggu">${g}${bars}</svg><p class="note" style="margin:4px 0 0">Garis putus-putus = target ${plan} sesi per minggu untuk level kamu.</p>`;
  }

  /* =========================================================
     PROFIL
     ========================================================= */
  function renderProfile() {
    const themeTxt = { system: "Ikuti sistem", dark: "Gelap", light: "Terang" }[S.theme];
    view.innerHTML = `<div class="view">
      <div class="section-h"><h2>Profil</h2></div>
      <div class="list">
        <button class="li" data-a="level"><span class="tx"><b>Level latihan</b><span>Ubah level secara manual</span></span><span class="val" style="color:${lvColor(S.level)}">${LV(S.level).name}</span>${I.chev}</button>
        <button class="li" data-a="retest"><span class="tx"><b>Tes ulang level</b><span>Disarankan setiap 4 minggu</span></span>${I.chev}</button>
      </div>
      <div class="list">
        <button class="li" data-a="pname"><span class="tx"><b>Nama menu dasar panggul</b><span>Nama netral menjaga privasi saat HP dilihat orang</span></span><span class="val">${S.pelvicName}</span>${I.chev}</button>
        <button class="li" data-a="theme"><span class="tx"><b>Tampilan</b><span>Gelap, terang, atau ikuti sistem</span></span><span class="val">${themeTxt}</span>${I.chev}</button>
        <button class="li" data-a="sound"><span class="tx"><b>Suara timer</b><span>Bunyi saat istirahat dan fase selesai</span></span><span class="val">${S.sound ? "Aktif" : "Mati"}</span>${I.chev}</button>
        <button class="li" data-a="install"><span class="tx"><b>Pasang di layar HP</b><span>Gunakan seperti aplikasi, bisa offline</span></span>${I.chev}</button>
      </div>
      <div class="list"><button class="li danger" data-a="reset"><span class="tx"><b>Hapus semua data</b><span>Riwayat, status lulus, dan pengaturan</span></span>${I.chev}</button></div>
      <p class="note">Angka program adalah panduan umum. Kalau terasa sakit, terutama di sendi, pergelangan tangan, atau siku, turunkan progresi dan istirahat. Untuk nyeri panggul atau gangguan buang air, konsultasikan ke dokter atau fisioterapis panggul.<br><br>Data tersimpan hanya di HP ini. Kalistenik Pro v1.0</p>
    </div>`;
    const on = (a, f) => view.querySelector(`[data-a="${a}"]`).addEventListener("click", f);
    on("level", () => levelPicker());
    on("retest", () => onboarding(true));
    on("pname", () => { S.pelvicName = S.pelvicName === "Core Dalam" ? "Pelvic Floor" : "Core Dalam"; save(); renderProfile(); toast(`Nama menu: ${S.pelvicName}`); });
    on("theme", () => { S.theme = { system: "dark", dark: "light", light: "system" }[S.theme]; save(); applyTheme(); renderProfile(); });
    on("sound", () => { S.sound = !S.sound; save(); renderProfile(); });
    on("install", installSheet);
    on("reset", () => sheet(`<h2>Hapus semua data?</h2><p class="muted">Riwayat latihan, status lulus, dan pengaturan akan hilang dari HP ini. Tindakan ini tidak bisa dibatalkan.</p><div class="row" style="margin-top:16px"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-yes style="background:var(--l4);color:#fff">Hapus data</button></div>`,
      (el) => el.querySelector("[data-yes]").addEventListener("click", () => { S = JSON.parse(JSON.stringify(DEFAULT)); save(); closeSheet(); applyTheme(); onboarding(); })));
  }
  function levelPicker() {
    sheet(`<h2>Pilih level</h2><p class="muted" style="margin:6px 0 14px">Gerakan di level sebelumnya tetap bisa dilatih.</p>
      <div class="lvpick">${LEVELS.map(l => `<button aria-pressed="${l.n === S.level}" data-lv="${l.n}" style="--c:${lvColor(l.n)}"><b>${l.name}</b><span>${l.dur}</span></button>`).join("")}</div>`,
      (el) => el.querySelectorAll("[data-lv]").forEach(b => b.addEventListener("click", () => { S.level = +b.dataset.lv; UI.programLv = null; save(); closeSheet(); rerender(); toast(`Level diubah ke ${LV(S.level).name}`); })));
  }
  function installSheet() {
    sheet(`<h2>Pasang di HP</h2>
      <h3>Android (Chrome)</h3><ol class="steps"><li>Buka alamat aplikasi di Chrome.</li><li>Ketuk menu titik tiga di kanan atas.</li><li>Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li></ol>
      <h3>iPhone (Safari)</h3><ol class="steps"><li>Buka alamat aplikasi di Safari.</li><li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas).</li><li>Pilih <b>Tambahkan ke Layar Utama</b>.</li></ol>
      <p class="note" style="margin-top:14px">Setelah terpasang, aplikasi terbuka layar penuh dan tetap berjalan tanpa internet.</p>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:12px">Mengerti</button>`);
  }

  /* =========================================================
     SHEET (panel bawah)
     ========================================================= */
  function sheet(html, bind) {
    closeSheet();
    const s = document.createElement("div"); s.className = "scrim"; s.id = "scrim";
    s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    s.addEventListener("click", (ev) => { if (ev.target === s || ev.target.closest("[data-close]")) closeSheet(); });
    document.body.appendChild(s);
    if (bind) bind(s);
  }
  function closeSheet() { $("#scrim")?.remove(); }

  /* =========================================================
     SESI LATIHAN
     ========================================================= */
  let W = null, tick = null;

  function startWorkout(items, title) {
    if (!items || !items.length) { toast("Belum ada gerakan terbuka untuk sesi ini"); return; }
    ensureAudio(); keepAwake(true);
    W = { title, items: items.map(e => ({ ex: e, vals: [] })), i: 0, set: 0, phase: "warmup", start: Date.now(), value: 0, holdStart: 0, restEnd: 0, restTotal: 0, confirm: false };
    document.body.style.overflow = "hidden";
    renderWO();
    clearInterval(tick); tick = setInterval(onTick, 250);
  }
  const curItem = () => W.items[W.i];
  function defaultValue(e, setIdx) {
    const last = S.last[e.id];
    if (last && last[setIdx] != null) return last[setIdx];
    return e.unit === "hold" ? 0 : e.max;
  }

  function renderWO() {
    let el = $("#wo");
    if (!el) { el = document.createElement("div"); el.className = "wo"; el.id = "wo"; layer.appendChild(el); }
    const totalSets = W.items.reduce((t, it) => t + it.ex.sets, 0);
    const doneSets = W.items.reduce((t, it) => t + it.vals.length, 0);
    const bar = W.items.map((it, i) => `<i class="${i < W.i || (i === W.i && W.phase === "done") ? "d" : i === W.i ? "c" : ""}"></i>`).join("");
    let body = "", foot = "";

    if (W.phase === "warmup") {
      body = `<div><div class="eyebrow">${W.title}</div><h2>Pemanasan</h2><p class="muted" style="margin:6px 0 0">5–10 menit. Penting sebelum latihan, terutama untuk pergelangan tangan dan bahu.</p></div>
        <ul class="exlist" style="margin:0">${WARMUP.map((w, i) => `<li><span class="ix">${String(i + 1).padStart(2, "0")}</span><span class="nm">${w.name}</span><span class="rx" style="font-size:15px">${w.rx}</span></li>`).join("")}</ul>`;
      foot = `<button class="btn btn-primary btn-block" data-a="begin">${I.play} Selesai pemanasan</button><button class="btn btn-line btn-block" data-a="begin">Lewati</button>`;
    }

    else if (W.phase === "work") {
      const it = curItem(), e = it.ex;
      const dots = [...Array(e.sets)].map((_, k) => `<i class="${k < it.vals.length ? "d" : k === W.set ? "c" : ""}"></i>`).join("");
      const isHold = e.unit === "hold";
      const running = isHold && W.holdStart;
      body = `<div><div class="eyebrow">Gerakan ${W.i + 1}/${W.items.length} · ${catName(e.cat)}</div><h2>${e.name}</h2>
          <div class="setdots">${dots}</div>
          ${hasAnim(e.id) ? '<div class="anim anim-wo" id="woanim" style="margin-top:12px"></div>' : ""}
          <p class="muted" style="margin:8px 0 0;font-size:14px">Set ${W.set + 1} dari ${e.sets} · latihan <b style="color:var(--fg)">${e.min === e.max ? e.min : e.min + "–" + e.max}${isHold ? " dtk" : " rep"}${sideTxt(e)}</b> · lulus <b style="color:var(--accent)">${tgt(e)}</b></p></div>
        <div class="big" id="bigval">${isHold ? (running ? 0 : W.value) : W.value}<small>${isHold ? "dtk" : "rep"}</small></div>
        ${isHold ? (running ? `<p class="hint">Tahan... ketuk <b>Stop</b> saat selesai</p>`
            : `<div class="stepper"><button data-a="dec" aria-label="Kurangi">${I.minus}</button><span class="hint" style="min-width:90px">${W.value ? "Atur jika perlu" : "Ketuk mulai"}</span><button data-a="inc" aria-label="Tambah">${I.plus}</button></div>`)
          : `<div class="stepper"><button data-a="dec" aria-label="Kurangi">${I.minus}</button><span class="hint" style="min-width:90px">${e.side ? "per sisi" : "repetisi"}</span><button data-a="inc" aria-label="Tambah">${I.plus}</button></div>`}
        <details style="font-size:14px"><summary class="muted" style="cursor:pointer">Cara melakukan</summary><ol class="steps">${e.how.map(h => `<li>${h}</li>`).join("")}</ol></details>`;
      if (isHold) {
        foot = running ? `<button class="btn btn-primary btn-block" data-a="holdstop">Stop</button>`
          : `<button class="btn ${W.value ? "btn-ghost" : "btn-primary"} btn-block" data-a="holdgo">${I.play} ${W.value ? "Ulangi tahan" : "Mulai tahan"}</button>${W.value ? `<button class="btn btn-primary btn-block" data-a="saveset">Simpan set · ${W.value} dtk</button>` : ""}`;
      } else {
        foot = `<button class="btn btn-primary btn-block" data-a="saveset">${I.check.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2.6"')} Selesai set</button>`;
      }
      foot += `<button class="btn btn-line btn-block" data-a="skipex" style="min-height:42px">Lewati gerakan</button>`;
    }

    else if (W.phase === "rest") {
      const nx = nextPosition(); const ne = nx ? W.items[nx.i].ex : null;
      const C = 2 * Math.PI * 130;
      body = `<div class="ring"><svg viewBox="0 0 280 280"><circle class="bg" cx="140" cy="140" r="130"/><circle class="fg" id="restring" cx="140" cy="140" r="130" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
          <div class="in"><div class="t" id="resttime">${fmtTime((W.restEnd - Date.now()) / 1000)}</div><div class="l">Istirahat</div><div class="s">Atur napas, minum air</div></div></div>
        <div class="row"><button class="btn btn-ghost" data-a="rest-15">−15 dtk</button><button class="btn btn-ghost" data-a="rest+15">+15 dtk</button></div>
        ${ne ? `<div class="nextup"><div class="tx"><div class="eyebrow">Berikutnya</div><b>${ne.name}</b><span>Set ${nx.set + 1} dari ${ne.sets} · ${ne.min === ne.max ? ne.min : ne.min + "–" + ne.max}${ne.unit === "hold" ? " dtk" : " rep"}${sideTxt(ne)}</span></div></div>` : ""}`;
      foot = `<button class="btn btn-primary btn-block" data-a="endrest">Lewati istirahat</button>`;
    }

    else if (W.phase === "done") {
      const r = W.result;
      body = `<div class="sum-h"><div class="badge"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div class="eyebrow">${W.title}</div><h2>Sesi selesai</h2></div>
        <div class="stats"><div class="stat"><div class="v">${fmtTime(r.dur)}</div><div class="k">Durasi</div></div><div class="stat"><div class="v">${r.sets}</div><div class="k">Set</div></div><div class="stat"><div class="v">${r.reps}</div><div class="k">Rep</div></div></div>
        ${r.newly.map(e => { const n = nextInChain(e); return `<div class="unlock">${I.unlock}<div><b>${e.name} lulus target</b><div class="muted" style="font-size:13px">${n ? n.name + " sekarang terbuka" : "Jalur level ini selesai"}</div></div></div>`; }).join("")}
        ${r.levelReady ? `<div class="banner">${I.up}<p><b>Syarat ${LV(S.level).name} terpenuhi</b>Naik level dari Beranda.</p></div>` : ""}
        ${!r.newly.length ? `<p class="hint">Konsisten adalah kuncinya. Capai target di semua set untuk membuka gerakan berikutnya.</p>` : ""}`;
      foot = `<button class="btn btn-primary btn-block" data-a="finish">Kembali ke beranda</button>`;
    }

    const confirmBox = W.confirm ? `<div class="scrim" style="position:fixed"><div class="sheet"><div class="grab"></div><h2>Akhiri sesi?</h2><p class="muted">${doneSets ? `${doneSets} set yang sudah dicatat akan disimpan.` : "Belum ada set yang dicatat."}</p><div class="row" style="margin-top:16px"><button class="btn btn-ghost" data-a="nocancel">Lanjut latihan</button><button class="btn btn-primary" data-a="quit">Akhiri</button></div></div></div>` : "";

    el.innerHTML = `<div class="wo-in">
      <div class="wo-top">${W.phase !== "done" ? `<button class="x" data-a="close" aria-label="Akhiri sesi">${I.x}</button>` : '<span style="width:40px"></span>'}<div class="prog">${bar}</div><span class="wo-timer" id="wotime">${fmtTime((Date.now() - W.start) / 1000)}</span></div>
      <div class="wo-body">${body}</div>
      <div class="wo-foot">${foot}</div>
    </div>${confirmBox}`;
    el.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => woAction(b.dataset.a)));
    if (W.phase === "work") mountAnim(el.querySelector("#woanim"), curItem().ex.id);
  }

  function nextPosition() {
    const it = curItem();
    if (W.set + 1 < it.ex.sets) return { i: W.i, set: W.set + 1 };
    if (W.i + 1 < W.items.length) return { i: W.i + 1, set: 0 };
    return null;
  }
  function goTo(pos) {
    W.i = pos.i; W.set = pos.set; W.phase = "work"; W.holdStart = 0;
    const e = curItem().ex; W.value = e.unit === "hold" ? 0 : defaultValue(e, W.set);
    renderWO();
  }

  function woAction(a) {
    const it = W.items[W.i]; const e = it && it.ex;
    switch (a) {
      case "begin": W.start = Date.now(); goTo({ i: 0, set: 0 }); break;
      case "inc": W.value = Math.min(999, W.value + 1); $("#bigval").firstChild.textContent = W.value; if (e.unit === "hold") renderWO(); break;
      case "dec": W.value = Math.max(0, W.value - 1); $("#bigval").firstChild.textContent = W.value; if (e.unit === "hold") renderWO(); break;
      case "holdgo": ensureAudio(); W.holdStart = Date.now(); W.holdBeeped = false; beep(660, .1); buzz(40); renderWO(); break;
      case "holdstop": W.value = Math.round((Date.now() - W.holdStart) / 1000); W.holdStart = 0; beep(520, .12); buzz(40); renderWO(); break;
      case "saveset": {
        it.vals.push(W.value);
        S.last[e.id] = S.last[e.id] || []; S.last[e.id][W.set] = W.value;
        if (!S.best[e.id] || W.value > S.best[e.id]) S.best[e.id] = W.value;
        save(); buzz(30);
        const nx = nextPosition();
        if (!nx) { finishWorkout(); break; }
        W.nextPos = nx; W.restTotal = LV(e.lv).rest; W.restEnd = Date.now() + W.restTotal * 1000; W.phase = "rest"; renderWO();
        break;
      }
      case "skipex": {
        if (W.i + 1 < W.items.length) goTo({ i: W.i + 1, set: 0 }); else finishWorkout();
        break;
      }
      case "rest-15": W.restEnd -= 15000; break;
      case "rest+15": W.restEnd += 15000; W.restTotal += 15; break;
      case "endrest": goTo(W.nextPos); break;
      case "close": W.confirm = true; renderWO(); break;
      case "nocancel": W.confirm = false; renderWO(); break;
      case "quit": W.confirm = false; if (W.items.some(i => i.vals.length)) finishWorkout(); else exitWO(); break;
      case "finish": exitWO(); break;
    }
  }

  function onTick() {
    if (!W) return;
    const t = $("#wotime"); if (t && W.phase !== "done") t.textContent = fmtTime((Date.now() - W.start) / 1000);
    if (W.phase === "work" && W.holdStart) {
      const s = Math.floor((Date.now() - W.holdStart) / 1000); const b = $("#bigval"); if (b) b.firstChild.textContent = s;
      const e = curItem().ex; if (!W.holdBeeped && s >= e.max) { W.holdBeeped = true; beep(988, .15, 2); buzz([60, 40, 60]); }
    }
    if (W.phase === "rest") {
      const left = (W.restEnd - Date.now()) / 1000;
      const rt = $("#resttime"); if (rt) rt.textContent = fmtTime(left);
      const ring = $("#restring"); if (ring) { const C = 2 * Math.PI * 130; ring.style.strokeDashoffset = C * (1 - Math.max(0, left) / W.restTotal); }
      if (left <= 3.2 && left > 0 && !W.cd) { W.cd = true; beep(700, .08, 3); }
      if (left <= 0) { W.cd = false; beep(1046, .25); buzz([120, 60, 120]); goTo(W.nextPos); }
    }
  }

  function finishWorkout() {
    const dur = Math.round((Date.now() - W.start) / 1000);
    const done = W.items.filter(it => it.vals.length);
    const sets = done.reduce((t, it) => t + it.vals.length, 0);
    const reps = done.reduce((t, it) => t + (it.ex.unit === "reps" ? it.vals.reduce((a, b) => a + b, 0) * (it.ex.side ? 2 : 1) : 0), 0);
    const newly = [];
    done.forEach(it => {
      const e = it.ex;
      const hit = it.vals.filter(v => v >= e.tVal).length;
      if (!isDone(e) && isUnlocked(e) && hit >= e.tSets) { S.mastered[e.id] = Date.now(); newly.push(e); }
    });
    S.logs.push({ type: "workout", ts: Date.now(), date: todayKey(), title: W.title, dur, sets, reps, items: done.map(it => ({ ex: it.ex.id, vals: it.vals })) });
    save();
    W.result = { dur, sets, reps, newly, levelReady: readyToLevelUp() };
    W.phase = "done"; keepAwake(false); beep(784, .12, 2); buzz([80, 50, 160]);
    renderWO();
  }
  function exitWO() { clearInterval(tick); W = null; keepAwake(false); $("#wo")?.remove(); document.body.style.overflow = ""; rerender(); }

  /* =========================================================
     PEMANDU KEGEL / PELVIC FLOOR
     ========================================================= */
  let G = null, gtick = null;
  function startPelvic(list, title, daily) {
    ensureAudio(); keepAwake(true);
    const steps = [];
    list.forEach((p, k) => {
      steps.push({ kind: "rest", label: "Bersiap", sub: p.name, sec: 5, ex: k, intro: true });
      p.steps(daily).forEach(s => steps.push(Object.assign({ ex: k }, s)));
    });
    G = { list, title, daily: !!daily, steps, idx: 0, left: steps[0].sec, paused: false, start: Date.now(), lastT: Date.now(), done: false };
    document.body.style.overflow = "hidden";
    renderG(); clearInterval(gtick); gtick = setInterval(gTick, 200);
  }
  function renderG() {
    let el = $("#wo");
    if (!el) { el = document.createElement("div"); el.className = "wo"; el.id = "wo"; layer.appendChild(el); }
    if (G.done) {
      el.innerHTML = `<div class="wo-in"><div class="wo-top"><span style="width:40px"></span><div class="prog"><i class="d"></i></div><span class="wo-timer">${fmtTime(G.dur)}</span></div>
        <div class="wo-body"><div class="sum-h"><div class="badge" style="background:var(--pelvic)"><svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div class="eyebrow">${G.title}</div><h2>Selesai</h2></div>
        <div class="stats"><div class="stat"><div class="v">${fmtTime(G.dur)}</div><div class="k">Durasi</div></div><div class="stat"><div class="v">${G.list.length}</div><div class="k">Latihan</div></div><div class="stat"><div class="v">${streak()}</div><div class="k">Streak</div></div></div>
        <p class="hint">Lakukan 2–3 sesi pendek setiap hari. Hasil mulai terasa setelah 6–12 minggu latihan rutin.</p></div>
        <div class="wo-foot"><button class="btn btn-primary btn-block" data-a="gexit">Kembali ke beranda</button></div></div>`;
      el.querySelector("[data-a]").addEventListener("click", exitG); return;
    }
    const s = G.steps[G.idx]; const p = G.list[s.ex];
    const bar = G.list.map((_, i) => `<i class="${i < s.ex ? "d" : i === s.ex ? "c" : ""}"></i>`).join("");
    el.innerHTML = `<div class="wo-in">
      <div class="wo-top"><button class="x" data-a="gclose" aria-label="Akhiri">${I.x}</button><div class="prog">${bar}</div><span class="wo-timer" id="gtime">${fmtTime((Date.now() - G.start) / 1000)}</span></div>
      <div class="wo-body">
        <div><div class="eyebrow">Latihan ${s.ex + 1}/${G.list.length} · ${S.pelvicName}</div><h2>${p.name}</h2><p class="muted" style="margin:6px 0 0;font-size:14px">${G.daily ? "Versi harian · 1 set" : p.rx}</p></div>
        <div class="orb-wrap"><div class="orb ${s.kind}" id="orb"><div class="t" id="gleft">${Math.ceil(G.left)}</div><div class="l" id="glabel">${s.label}</div><div class="s" id="gsub">${s.sub || ""}</div></div></div>
        <p class="hint">Napas tetap berjalan. Perut, bokong, dan paha rileks.</p>
      </div>
      <div class="wo-foot">
        <button class="btn btn-primary btn-block" data-a="gpause">${G.paused ? I.play + " Lanjutkan" : I.pause + " Jeda"}</button>
        <button class="btn btn-line btn-block" data-a="gskip" style="min-height:42px">Lewati latihan ini</button>
      </div></div>`;
    el.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => gAction(b.dataset.a)));
  }
  function gAction(a) {
    if (a === "gpause") { G.paused = !G.paused; G.lastT = Date.now(); renderG(); }
    if (a === "gskip") { const cur = G.steps[G.idx].ex; let j = G.idx; while (j < G.steps.length && G.steps[j].ex === cur) j++; if (j >= G.steps.length) finishG(); else setStep(j); }
    if (a === "gclose") { if (Date.now() - G.start > 60000) finishG(); else exitG(); }
  }
  function setStep(j) {
    G.idx = j; const s = G.steps[j]; G.left = s.sec;
    if (s.kind === "contract") { buzz(90); beep(740, .09); }
    else if (s.kind === "relax") { buzz([25, 50, 25]); beep(440, .09); }
    else if (s.kind === "breath") { buzz(20); }
    const prevEx = j > 0 ? G.steps[j - 1].ex : -1;
    if (s.ex !== prevEx) { renderG(); return; }
    const orb = $("#orb"); if (orb) orb.className = "orb " + s.kind;
    $("#glabel").textContent = s.label; $("#gsub").textContent = s.sub || ""; $("#gleft").textContent = Math.ceil(G.left);
  }
  function gTick() {
    if (!G || G.done) return;
    const now = Date.now(); const dt = (now - G.lastT) / 1000; G.lastT = now;
    const gt = $("#gtime"); if (gt) gt.textContent = fmtTime((now - G.start) / 1000);
    if (G.paused) return;
    G.left -= dt;
    if (G.left <= 0) { if (G.idx + 1 >= G.steps.length) { finishG(); return; } setStep(G.idx + 1); }
    else { const l = $("#gleft"); if (l) l.textContent = Math.ceil(G.left); }
  }
  function finishG() {
    G.dur = Math.round((Date.now() - G.start) / 1000);
    S.logs.push({ type: "pelvic", ts: Date.now(), date: todayKey(), title: G.title, dur: G.dur, sets: 0, reps: 0, items: G.list.map(p => ({ ex: p.id })) });
    save(); G.done = true; keepAwake(false); beep(784, .12, 2); buzz([80, 50, 160]); renderG();
  }
  function exitG() { clearInterval(gtick); G = null; keepAwake(false); $("#wo")?.remove(); document.body.style.overflow = ""; rerender(); }

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (W || G)) { wake = null; keepAwake(true); } });

  /* =========================================================
     ONBOARDING / TES LEVEL
     ========================================================= */
  function onboarding(retest) {
    const vals = { push: 10, pull: 0, squat: 20, plank: 30 };
    const fields = [
      { k: "push", b: "Push-up penuh", s: "Maksimal dalam 1 set, form bersih", step: 1 },
      { k: "pull", b: "Pull-up", s: "Maksimal dalam 1 set (0 jika belum bisa)", step: 1 },
      { k: "squat", b: "Bodyweight squat", s: "Maksimal dalam 1 set", step: 5 },
      { k: "plank", b: "Plank", s: "Lama menahan dalam detik", step: 10 }
    ];
    let picked = null;
    const el = document.createElement("div"); el.className = "ob"; el.id = "ob";
    function calc() {
      const { push: p, pull: u, squat: q, plank: k } = vals;
      if (p >= 35 && u >= 12) return 4;
      if (p >= 20 && u >= 8 && q >= 40) return 3;
      if ((p >= 10 && u >= 1) || (p >= 15 && q >= 30 && k >= 60)) return 2;
      return 1;
    }
    function draw() {
      const rec = calc();
      el.innerHTML = `<div class="ob-in">
        <div class="brand"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round"><path d="M4 5h16M8 5l2.5 6M16 5l-2.5 6M12 12.5V17M12 17l-2 3.5M12 17l2 3.5"/><circle cx="12" cy="9.6" r="1.6" fill="currentColor" stroke="none"/></svg></div><b style="font-family:var(--f-display);font-size:21px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">Kalistenik <span style="color:var(--accent)">Pro</span></b></div>
        <div><div class="eyebrow">${retest ? "Tes ulang" : "Tes awal · 2 menit"}</div><h1 style="margin-top:8px">Dari nol<br>sampai <span>planche.</span></h1>
        <p class="muted" style="margin:12px 0 0;max-width:40ch">Isi kemampuan kamu saat ini. Aplikasi akan menentukan level awal dan membuka gerakan yang sesuai.</p></div>
        <div style="display:flex;flex-direction:column;gap:8px">${fields.map(f => `<div class="field"><label for="f-${f.k}"><b>${f.b}</b><span>${f.s}</span></label>
          <div class="mini-step"><button data-k="${f.k}" data-d="-${f.step}" aria-label="Kurangi">−</button><input id="f-${f.k}" inputmode="numeric" type="number" min="0" max="999" value="${vals[f.k]}"><button data-k="${f.k}" data-d="${f.step}" aria-label="Tambah">+</button></div></div>`).join("")}</div>
        <section><div class="eyebrow" style="margin-bottom:8px">Rekomendasi level · bisa kamu ubah</div>
          <div class="lvpick">${LEVELS.map(l => `<button aria-pressed="${(picked || rec) === l.n}" data-lv="${l.n}" style="--c:${lvColor(l.n)}"><b>${l.name}</b><span>${l.n === rec ? "Direkomendasikan" : l.dur}</span></button>`).join("")}</div></section>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto;padding-top:8px">
          <button class="btn btn-primary btn-block" data-go>Mulai program ${LV(picked || rec).name}</button>
          ${retest ? `<button class="btn btn-line btn-block" data-cancel>Batal</button>` : ""}
          <p class="note" style="text-align:center;margin:0">Gerakan di level sebelumnya akan ditandai lulus.</p>
        </div></div>`;
      el.querySelectorAll("[data-d]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.k; vals[k] = Math.max(0, Math.min(999, vals[k] + +b.dataset.d)); picked = null; draw(); }));
      el.querySelectorAll("input").forEach(inp => inp.addEventListener("change", () => { vals[inp.id.slice(2)] = Math.max(0, Math.min(999, parseInt(inp.value, 10) || 0)); picked = null; draw(); }));
      el.querySelectorAll("[data-lv]").forEach(b => b.addEventListener("click", () => { picked = +b.dataset.lv; draw(); }));
      el.querySelector("[data-go]").addEventListener("click", () => {
        const lv = picked || calc();
        S.level = lv; S.onboarded = true;
        EXERCISES.forEach(e => { if (e.lv < lv && !S.mastered[e.id]) S.mastered[e.id] = Date.now(); });
        save(); el.remove(); UI.programLv = null; location.hash = "#home"; route(); toast(`Program ${LV(lv).name} siap`);
      });
      el.querySelector("[data-cancel]")?.addEventListener("click", () => el.remove());
    }
    document.body.appendChild(el); draw();
  }

  /* =========================================================
     MULAI
     ========================================================= */
  applyTheme();
  window.addEventListener("hashchange", route);
  route();
  if (!S.onboarded) onboarding();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => { try { navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) { /* tidak didukung */ } });
  }
})();
