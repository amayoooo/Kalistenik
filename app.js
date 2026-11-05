/* =========================================================
   KALISTENIK PRO — LOGIKA APLIKASI
   Semua data tersimpan di HP (localStorage), tanpa server.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Penyimpanan ---------------- */
  const KEY = "kalistenik-pro-v1";
  const DEFAULT = { onboarded: false, level: 1, mastered: {}, best: {}, last: {}, logs: [], pelvicName: "Core Dalam", theme: "system", sound: true, kontrol: null };
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
  const ROUTES = { home: renderHome, program: renderProgram, map: renderMap, progress: renderProgress, profile: renderProfile, kontrol: () => renderKontrol() };
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
      ${(() => { const kw = kWeek(); const kp = kw ? kPhase(Math.min(kw, 12)) : null; return `<a class="pcard" href="#kontrol" style="text-decoration:none;color:inherit"><span class="ic" style="background:color-mix(in srgb,var(--accent) 16%,transparent)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" style="stroke:var(--accent)"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg></span><span class="tx"><b>Program Kontrol${kw ? (kw > 12 ? " · pemeliharaan" : ` · minggu ${kw}/12`) : ""}</b><span>${kw ? (kw > 12 ? "Pertahankan hasil 3–4× per minggu" : `Fase ${kp.name} · ${kTodayDone() ? "hari ini selesai" : "latihan hari ini belum"}`) : "12 minggu berbasis riset untuk kontrol ejakulasi"}</span></span>${I.chev}</a>`; })()}
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
    view.querySelectorAll('[data-act="start-pelvic"]').forEach(b => b.addEventListener("click", () => {
      const go = () => startPelvic(pList, `${S.pelvicName} harian`, true);
      if (!S.logs.some(l => l.type === "pelvic")) muscleGuide(go); else go();
    }));
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
      ${cat === "pelvic" ? `<button class="pcard" data-guide><span class="ic">${I.pelvic}</span><span class="tx"><b>Kenali otot yang dilatih</b><span>Letak otot, cara mengencangkan, dan cara mengecek</span></span>${I.chev}</button>` : ""}
      <section>${body}</section>
    </div>`;
    view.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => { UI.mapCat = b.dataset.cat; renderMap(); }));
    view.querySelectorAll("[data-ex]").forEach(b => b.addEventListener("click", () => openExercise(exById(b.dataset.ex))));
    view.querySelector("[data-guide]")?.addEventListener("click", () => muscleGuide());
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
      <h3>Otot yang dikencangkan</h3><p style="margin:6px 0 0;font-size:14px">Kerutkan anus seperti menahan buang angin dan kencangkan area kelamin seperti menahan pipis, lalu angkat keduanya ke dalam dan ke atas. Perut, bokong, dan paha tetap rileks. Waktu rileks sama atau lebih lama dari waktu kontraksi.</p>
      <button class="btn btn-line btn-block" data-guide style="margin-top:12px;min-height:44px">Lihat panduan otot lengkap</button>
      <div style="margin-top:20px">${open ? `<button class="btn btn-primary btn-block" data-go>${I.play} Mulai pemandu</button>` : `<button class="btn btn-ghost btn-block" disabled style="opacity:.6">Terbuka di level ${LV(p.lv).name}</button>`}</div>`,
      (el) => { mountAnim(el.querySelector("#exanim"), p.id); el.querySelector("[data-guide]").addEventListener("click", () => muscleGuide()); el.querySelector("[data-go]")?.addEventListener("click", () => { closeSheet(); startPelvic([p], p.name); }); });
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
        <button class="li" data-a="kontrol"><span class="tx"><b>Program Kontrol</b><span>Program 12 minggu untuk kontrol ejakulasi</span></span>${I.chev}</button>
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
    on("kontrol", () => { location.hash = "#kontrol"; });
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
        <p class="hint" id="gcue">${cueFor(s.kind)}</p>
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
    const cue = $("#gcue"); if (cue) cue.innerHTML = cueFor(s.kind);
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
     PANDUAN OTOT DASAR PANGGUL
     ========================================================= */
  function cueFor(kind) {
    if (kind === "contract" || kind === "hold") return "<b>Kerutkan anus + area kelamin</b>, angkat ke dalam dan ke atas. Perut, bokong, paha tetap rileks.";
    if (kind === "breath") return "<b>Biarkan dasar panggul turun</b> dan melebar saat menarik napas. Jangan mengejan.";
    if (kind === "relax") return "<b>Lepas penuh.</b> Rasakan otot turun kembali dan lunak.";
    return "Napas tetap berjalan. Perut, bokong, dan paha rileks.";
  }

  function pelvicDiagram() {
    return `<figure class="pfd" id="pfd">
      <svg viewBox="0 0 300 172" role="img" aria-label="Diagram dasar panggul tampak samping: otot seperti ayunan dari tulang kemaluan ke tulang ekor, terangkat saat dikencangkan">
        <text x="150" y="14" text-anchor="middle" class="pfd-cap" id="pfd-state">Kencangkan · naik dan masuk</text>
        <ellipse cx="46" cy="74" rx="14" ry="22" class="pfd-bone"/>
        <path d="M252 30 C268 46 270 70 254 88" class="pfd-bone-line"/>
        <text x="46" y="112" text-anchor="middle" class="pfd-lbl">Tulang</text><text x="46" y="123" text-anchor="middle" class="pfd-lbl">kemaluan</text>
        <text x="262" y="108" text-anchor="middle" class="pfd-lbl">Tulang</text><text x="262" y="119" text-anchor="middle" class="pfd-lbl">ekor</text>
        <text x="16" y="164" class="pfd-lbl">DEPAN</text><text x="284" y="164" text-anchor="end" class="pfd-lbl">BELAKANG</text>
        <path id="pfd-rest" d="M60 84 Q150 144 246 84" class="pfd-ghost"/>
        <path id="pfd-m" d="M60 84 Q150 144 246 84" class="pfd-muscle"/>
        <g id="pfd-o"></g>
        <path id="pfd-arrow" d="M150 156 V128 M142 137 L150 127 L158 137" class="pfd-arrow"/>
      </svg>
      <figcaption>
        <span><i class="pfd-k1"></i>Saluran kencing</span>
        <span><i class="pfd-k2"></i>Vagina / pangkal penis</span>
        <span><i class="pfd-k3"></i>Anus</span>
      </figcaption>
    </figure>`;
  }
  let pfdRaf = 0;
  function animateDiagram(root) {
    const fig = root.querySelector("#pfd"); if (!fig) return;
    const m = fig.querySelector("#pfd-m"), og = fig.querySelector("#pfd-o"), ar = fig.querySelector("#pfd-arrow"), st = fig.querySelector("#pfd-state");
    const ts = [0.22, 0.47, 0.76], cls = ["pfd-k1", "pfd-k2", "pfd-k3"];
    og.innerHTML = ts.map((_, i) => `<rect width="7" height="13" rx="3.5" class="${cls[i]}"/>`).join("");
    const rects = og.querySelectorAll("rect");
    const draw = (k) => {
      const cy = 144 - 50 * k;
      m.setAttribute("d", `M60 84 Q150 ${cy} 246 84`);
      ts.forEach((t, i) => { const x = (1 - t) * (1 - t) * 60 + 2 * (1 - t) * t * 150 + t * t * 246, y = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * cy + t * t * 84; rects[i].setAttribute("x", (x - 3.5).toFixed(1)); rects[i].setAttribute("y", (y - 6.5 - 2 * k).toFixed(1)); rects[i].setAttribute("height", (13 - 5 * k).toFixed(1)); });
      ar.style.opacity = k > 0.5 ? 1 : 0; ar.setAttribute("transform", `translate(0 ${(-16 * k).toFixed(1)})`);
    };
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { draw(1); return; }
    cancelAnimationFrame(pfdRaf); const t0 = performance.now();
    const loop = (now) => {
      if (!fig.isConnected) return;
      const t = ((now - t0) / 1000) % 6; // 1 dtk naik, 2 dtk tahan, 1 dtk turun, 2 dtk rileks
      let k = t < 1 ? t : t < 3 ? 1 : t < 4 ? 1 - (t - 3) : 0;
      k = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      draw(k);
      st.textContent = t < 3 ? "Kencangkan · naik dan masuk" : "Lepas · turun dan rileks";
      pfdRaf = requestAnimationFrame(loop);
    };
    pfdRaf = requestAnimationFrame(loop);
  }

  function muscleGuide(onStart) {
    sheet(`<div class="eyebrow" style="color:var(--pelvic)">${S.pelvicName} · panduan</div>
      <h2>Otot yang dilatih</h2>
      <p style="margin:8px 0 0;font-size:14px">Otot dasar panggul membentang seperti ayunan dari tulang kemaluan ke tulang ekor. Tiga lubang melewatinya. Kegel yang benar mengencangkan ketiganya sekaligus, lalu mengangkatnya ke dalam dan ke atas.</p>
      ${pelvicDiagram()}

      <h3>Tiga bagian yang dikencangkan</h3>
      <div class="zones">
        <div class="zone"><i class="pfd-k1"></i><div><b>Depan · saluran kencing</b><span>Seperti menahan pipis. Otot pubococcygeus (otot PC).</span></div></div>
        <div class="zone"><i class="pfd-k2"></i><div><b>Tengah · area kelamin</b><span><b>Pria:</b> pangkal penis tertarik ke dalam, testis sedikit naik. <b>Wanita:</b> bukaan vagina mengencang dan terangkat. Otot bulbospongiosus dan ischiocavernosus, yang berperan saat ereksi dan orgasme.</span></div></div>
        <div class="zone"><i class="pfd-k3"></i><div><b>Belakang · anus</b><span>Seperti menahan buang angin. Anus mengerut dan tertarik ke depan. Otot puborectalis.</span></div></div>
      </div>

      <h3>Langkah mengencangkan</h3>
      <ol class="steps">
        <li><b>Berbaring</b>, lutut ditekuk. Satu tangan di perut bawah, satu di bokong.</li>
        <li><b>Kerutkan anus</b> seperti menahan buang angin.</li>
        <li><b>Kencangkan bagian depan</b> seperti menahan pipis.</li>
        <li><b>Angkat keduanya</b> ke dalam dan ke atas seperti lift naik, dengan kekuatan 50–70%.</li>
        <li><b>Lepas penuh</b> sampai otot terasa turun dan lunak kembali.</li>
        <li><b>Napas tetap jalan.</b> Hembuskan napas saat mengencangkan.</li>
      </ol>

      <h3>Cek sudah benar</h3>
      <ul class="checks">
        <li><b>Perineum</b> (area antara kelamin dan anus): dengan dua jari, terasa naik ke dalam. Kalau terdorong keluar, itu mengejan.</li>
        <li><b>Pria:</b> di depan cermin, pangkal penis bergerak sedikit naik ke arah perut.</li>
        <li><b>Wanita:</b> satu jari bersih di dalam vagina terasa dijepit dan ditarik ke atas.</li>
      </ul>

      <h3>Jangan ikut bekerja</h3>
      <ul class="warnl">
        <li>Perut mengeras atau mengempis kuat</li>
        <li>Bokong mengencang atau pinggul terangkat</li>
        <li>Kedua lutut saling merapat</li>
        <li>Napas tertahan</li>
        <li>Mendorong ke bawah seperti mengejan</li>
      </ul>
      <p class="note" style="margin-top:12px">Menahan pipis cukup 1–2 kali untuk mengenali otot, bukan untuk latihan rutin. Kalau setelah 2–3 minggu otot masih sulit dirasakan, atau terasa nyeri, temui fisioterapis panggul.</p>
      <div style="margin-top:16px">${onStart ? `<button class="btn btn-primary btn-block" data-start>${I.play} Saya paham, mulai latihan</button>` : `<button class="btn btn-ghost btn-block" data-close>Tutup</button>`}</div>`,
      (el) => { animateDiagram(el); el.querySelector("[data-start]")?.addEventListener("click", () => { closeSheet(); onStart(); }); });
  }

  /* =========================================================
     PROGRAM KONTROL EJAKULASI · 12 minggu, berbasis riset
     Sumber: pedoman EAU & ISSM, Pastore dkk. 2014 & 2018,
     tinjauan Cochrane (terapi perilaku), tinjauan 54 studi (2023).
     ========================================================= */
  const WEEK_MS = 7 * 864e5;
  function KS() { if (!S.kontrol) S.kontrol = { start: null, checks: [], weekly: [] }; return S.kontrol; }
  function kWeek() { const k = KS(); return k.start ? Math.floor((Date.now() - k.start) / WEEK_MS) + 1 : 0; }
  const KPHASES = [
    { from: 1, to: 2, name: "Kenali", color: "var(--l1)", goal: "Menemukan otot dasar panggul yang tepat, belajar melepasnya, dan mengenali tingkat gairah.",
      tasks: ["Latihan terpandu setiap hari, ±8 menit", "Baca panduan otot dan skala gairah", "Aerobik 30 menit, 3–5× per minggu"] },
    { from: 3, to: 6, name: "Kekuatan", color: "var(--l2)", goal: "Membangun kekuatan dan daya tahan otot. Durasi tahan naik 1 detik setiap minggu, dari berbaring ke duduk lalu berdiri.",
      tasks: ["Latihan terpandu setiap hari, ±10 menit", "Lakukan sebagian set sambil duduk dan berdiri", "Aerobik 30 menit, 5× per minggu"] },
    { from: 7, to: 9, name: "Kontrol", color: "var(--l3)", goal: "Melatih kontrol halus (elevator dan kunci cepat) dan relaksasi, lalu mulai latihan stop-start sendiri 3× per minggu.",
      tasks: ["Latihan terpandu setiap hari, ±12 menit", "Stop-start sendiri, 3× per minggu", "Latihan napas saat bergairah"] },
    { from: 10, to: 12, name: "Integrasi", color: "var(--pelvic)", goal: "Menerapkan semua keterampilan bersama pasangan: stop-start, squeeze, napas, dan relaksasi panggul.",
      tasks: ["Latihan terpandu setiap hari, ±12 menit", "Stop-start atau squeeze bersama pasangan", "Isi jurnal mingguan untuk menilai kemajuan"] }
  ];
  const kPhase = (w) => KPHASES.find(p => w >= p.from && w <= p.to) || KPHASES[3];
  function kSession(w) {
    const it = (name, rx, fn) => ({ name, rx, steps: fn });
    if (w <= 2) return [
      it("Napas diafragma", "2 menit", () => P.breath(2)),
      it("Kegel dasar (berbaring)", "2×10 · tahan 3 dtk", () => P.hold(2, 10, 3, 3)),
      it("Quick flick", "1×10", () => P.flick(1, 10)),
      it("Reverse Kegel", "1×8 · 5 dtk", () => P.reverse(1, 8, 5))];
    if (w <= 6) { const h = Math.min(8, w + 2); return [
      it("Kegel tahan (duduk / berdiri)", `2×10 · tahan ${h} dtk`, () => P.hold(2, 10, h, h)),
      it("Quick flick", "2×15", () => P.flick(2, 15)),
      it("Reverse Kegel", "1×10 · 6 dtk", () => P.reverse(1, 10, 6))]; }
    if (w <= 9) return [
      it("Kegel tahan (berdiri)", "1×10 · tahan 10 dtk", () => P.hold(1, 10, 10, 10)),
      it("Elevator Kegel", "1×5 · 3 tingkat", () => P.elevator(1, 5, 3)),
      it("Kunci cepat", "2×8 · kontraksi kuat", () => P.move(2, 8, ["Kunci kuat", "Lepas & napas"])),
      it("Reverse Kegel", "1×10 · 8 dtk", () => P.reverse(1, 10, 8))];
    return [
      it("Kegel tahan (berbagai posisi)", "1×10 · tahan 10 dtk", () => P.hold(1, 10, 10, 10)),
      it("Elevator Kegel", "1×5 · 5 tingkat", () => P.elevator(1, 5, 5)),
      it("Reverse Kegel", "1×10 · 10 dtk", () => P.reverse(1, 10, 10)),
      it("Napas diafragma", "2 menit", () => P.breath(2))];
  }
  const kMinutes = (list) => Math.round(list.reduce((t, p) => t + p.steps().reduce((a, s) => a + s.sec, 0) + 5, 0) / 60);
  function kDaysThisWeek() {
    const k = KS(); if (!k.start) return 0; const w = kWeek(); const ws = k.start + (w - 1) * WEEK_MS;
    return new Set(S.logs.filter(l => l.type === "pelvic" && l.ts >= ws && (l.title || "").startsWith("Program Kontrol")).map(l => l.date)).size;
  }
  function kTodayDone() { return S.logs.some(l => l.type === "pelvic" && l.date === todayKey() && (l.title || "").startsWith("Program Kontrol")); }

  /* Cek mandiri (bukan alat diagnosis; ambang skor mengikuti pola PEDT) */
  const KQ = [
    { q: "Biasanya, berapa lama dari penetrasi sampai ejakulasi?", o: ["Lebih dari 5 menit", "3–5 menit", "2–3 menit", "1–2 menit", "Kurang dari 1 menit"] },
    { q: "Seberapa sulit menunda ejakulasi saat kamu ingin menundanya?", o: ["Tidak sulit", "Sedikit sulit", "Cukup sulit", "Sangat sulit", "Hampir mustahil"] },
    { q: "Seberapa sering ejakulasi terjadi sebelum kamu menginginkannya?", o: ["Hampir tidak pernah", "Jarang", "Kadang-kadang", "Sering", "Hampir selalu"] },
    { q: "Seberapa besar hal ini membuatmu tertekan atau frustrasi?", o: ["Tidak sama sekali", "Sedikit", "Sedang", "Cukup besar", "Sangat besar"] },
    { q: "Seberapa besar pengaruhnya pada hubungan dengan pasangan?", o: ["Tidak ada", "Sedikit", "Sedang", "Cukup besar", "Sangat besar"] }
  ];
  const KONSET = ["Sejak pengalaman seksual pertama", "Muncul belakangan, sebelumnya normal", "Tidak tentu, hanya pada situasi tertentu"];
  function kInterpret(c) {
    const score = c.ans.reduce((a, b) => a + b, 0);
    const band = score >= 11 ? { t: "Sesuai pola ejakulasi dini", c: "var(--l4)" } : score >= 9 ? { t: "Ada tanda kontrol berkurang", c: "var(--l3)" } : { t: "Kontrol dalam batas umum", c: "var(--l1)" };
    let type;
    if (c.onset === 0) type = c.ans[0] >= 3 ? "Polanya mirip <b>ejakulasi dini seumur hidup</b> (lifelong): sejak awal, umumnya sekitar 1 menit atau kurang. Faktor bawaan seperti jalur serotonin di otak berperan." : "Muncul sejak awal, tetapi waktunya tidak sesingkat kriteria seumur hidup (±1 menit).";
    else if (c.onset === 1) type = "Polanya mirip <b>ejakulasi dini didapat</b> (acquired): sebelumnya normal lalu memendek, sering menjadi 3 menit atau kurang. Pola ini sering punya penyebab yang bisa diobati.";
    else type = "Polanya <b>bervariasi atau situasional</b>. Ini umum dan sering terkait kecemasan, kelelahan, jarang berhubungan, atau pasangan baru.";
    const recs = ["Ikuti Program Kontrol 12 minggu. Latihan dasar panggul adalah terapi non-obat dengan data paling menjanjikan."];
    if (c.onset === 1) recs.push("Periksakan penyebab yang bisa diobati: sulit ereksi, peradangan prostat, atau tiroid yang terlalu aktif.");
    if (score >= 11 || c.onset === 1) recs.push("Konsultasikan ke dokter spesialis andrologi (Sp.And) atau urologi (Sp.U). Terapi obat terbukti efektif dan dapat digabung dengan program ini.");
    if (c.ans[3] >= 3 || c.ans[4] >= 3) recs.push("Tekanan emosional yang besar layak dibicarakan dengan pasangan, dan bila perlu dengan psikolog atau terapis seks.");
    return { score, band, type, recs };
  }

  /* Skala gairah (dipakai di beberapa panduan) */
  const arousalScale = () => `<div class="ascale" role="img" aria-label="Skala gairah 1 sampai 10">
      ${[...Array(10)].map((_, i) => `<i class="${i < 4 ? "z1" : i < 7 ? "z2" : i < 9 ? "z3" : "z4"}"><b>${i + 1}</b></i>`).join("")}
    </div>
    <div class="ascale-k"><span><i class="z1"></i>1–4 tenang</span><span><i class="z2"></i>5–7 zona latihan</span><span><i class="z3"></i>8–9 berhenti</span><span><i class="z4"></i>10 tidak bisa kembali</span></div>`;

  const KTECH = {
    skala: { name: "Skala gairah 1–10", sub: "Dasar semua teknik: kenali kapan harus berhenti", body: () => `
      <p style="margin:8px 0 0">Banyak pria baru sadar saat sudah terlambat. Langkah pertama adalah belajar membaca tingkat gairah sendiri dengan angka.</p>
      ${arousalScale()}
      <ol class="steps">
        <li><b>1–4 tenang:</b> rangsangan ringan, mudah dikendalikan.</li>
        <li><b>5–7 zona latihan:</b> rangsangan jelas tetapi masih terkendali. Usahakan tetap di sini.</li>
        <li><b>8–9 mendekati batas:</b> tanda awal muncul, misalnya napas memburu, otot panggul dan paha menegang. Berhenti di sini.</li>
        <li><b>10 titik tidak bisa kembali:</b> ejakulasi sudah tidak bisa ditahan.</li>
      </ol>
      <h3>Cara melatih</h3>
      <p style="margin:6px 0 0;font-size:14px">Saat latihan sendiri, berhenti sejenak setiap beberapa menit dan sebutkan angkanya dalam hati. Tujuannya mengenali tanda tubuh di tingkat 7–8, sebelum mencapai 10.</p>` },
    stopstart: { name: "Teknik stop-start", sub: "Semans · minggu 7–12", body: () => `
      <p style="margin:8px 0 0">Melatih otak dan tubuh untuk bertahan lebih lama di zona gairah tinggi tanpa melewati batas.</p>
      ${arousalScale()}
      <ol class="steps">
        <li><b>Mulai sendiri</b> (minggu 7–9), di tempat yang tenang dan tanpa terburu-buru.</li>
        <li><b>Rangsang sampai tingkat 7–8</b> pada skala gairah.</li>
        <li><b>Berhenti total</b> 30–60 detik. Napas perut perlahan dan lepaskan ketegangan panggul, perut, dan paha sampai gairah turun ke 4–5.</li>
        <li><b>Ulangi 3–4 siklus</b>, baru biarkan ejakulasi di siklus terakhir.</li>
        <li><b>3× per minggu.</b> Setelah lancar, lakukan bersama pasangan (minggu 10–12) dengan sinyal berhenti yang sudah disepakati.</li>
      </ol>
      <p class="note" style="margin-top:12px">Bukti: tinjauan Cochrane menemukan terapi perilaku membantu durasi dan kepuasan pasangan, tetapi buktinya lemah. Hasil terbaik didapat bila digabung dengan latihan dasar panggul atau terapi dokter.</p>` },
    squeeze: { name: "Teknik squeeze", sub: "Masters & Johnson · minggu 10–12", body: () => `
      <p style="margin:8px 0 0">Menekan refleks ejakulasi secara fisik saat sudah mendekati batas. Bisa dilakukan sendiri atau oleh pasangan.</p>
      <ol class="steps">
        <li><b>Saat mendekati tingkat 8</b>, hentikan rangsangan.</li>
        <li><b>Tekan bagian bawah kepala penis</b>, di batas kepala dan batang, dengan ibu jari di bawah serta telunjuk dan jari tengah di atas.</li>
        <li><b>Tahan sekitar 10–20 detik</b> sampai dorongan ejakulasi mereda. Ereksi boleh sedikit berkurang.</li>
        <li><b>Tunggu ±30 detik</b>, lalu lanjutkan.</li>
        <li><b>Ulangi 3–4 kali</b> per sesi.</li>
      </ol>
      <p class="note" style="margin-top:12px">Tekanan harus kuat tetapi tidak menyakitkan. Hentikan bila terasa nyeri.</p>` },
    napas: { name: "Napas & relaksasi panggul", sub: "Kunci yang sering dilupakan", body: () => `
      <p style="margin:8px 0 0">Napas pendek dan otot yang tegang (perut, bokong, paha, dasar panggul) mempercepat refleks ejakulasi. Rileks justru memperpanjang waktu.</p>
      <ol class="steps">
        <li><b>Napas perut lambat:</b> tarik 4 detik lewat hidung, hembuskan 6 detik.</li>
        <li><b>Lepaskan dasar panggul</b> seperti latihan Reverse Kegel, terutama saat gairah naik ke 7–8.</li>
        <li><b>Kendurkan perut, bokong, dan paha.</b> Periksa ketegangan ini setiap kali gairah naik.</li>
        <li><b>Kunci cepat bila perlu:</b> sebagian pria terbantu oleh satu kontraksi Kegel kuat 3–5 detik saat mendekati tingkat 8, lalu lepas. Coba mana yang cocok untukmu.</li>
        <li><b>Ubah ritme atau posisi</b> sebelum mencapai tingkat 8, jangan menunggu sampai terlambat.</li>
      </ol>` }
  };

  const KEVID = [
    { name: "Latihan otot dasar panggul", lvl: "Rendah–sedang", c: "var(--l2)",
      text: "Pastore dkk. (2014): 40 pria dengan ejakulasi dini seumur hidup menjalani 12 minggu latihan. 82,5% membaik, dan waktu rata-rata naik dari 31,7 menjadi 146,2 detik. Studi lanjutan (2018): 91% dari 122 pria mendapat kontrol dalam 12 minggu, dan 56% masih terkontrol setelah 36 bulan.",
      lim: "Tanpa kelompok pembanding. Program klinisnya juga memakai stimulasi listrik dan biofeedback, yang tidak ada di aplikasi ini.",
      links: [["Ringkasan EAU (2014)", "https://uroweb.org/news/lifelong-premature-ejaculation-can-be-treated-by-pelvic-floor-exercises"], ["Asian J Andrology (2018)", "https://doaj.org/article/5eafefc8ecd244c083101636872acb73"]] },
    { name: "Aktivitas fisik aerobik", lvl: "Rendah", c: "var(--l3)",
      text: "Tinjauan 54 studi dengan 3.485 peserta (2023): pada satu studi, lari 30 menit 5× per minggu memberi efek pada waktu ejakulasi yang mirip dengan obat dapoxetine.",
      lim: "Sebagian besar studi kecil. Peneliti menyatakan perlu studi yang lebih besar.",
      links: [["Anglia Ruskin University", "https://aru.ac.uk/news/exercise-could-help-with-common-sexual-complaint"], ["Uji klinis NCT02844998", "https://clinicaltrials.gov/study/NCT02844998"]] },
    { name: "Teknik perilaku (stop-start, squeeze)", lvl: "Rendah", c: "var(--l3)",
      text: "Tinjauan Cochrane (4 uji, 253 pasien): terapi perilaku memperbaiki durasi hubungan dan kepuasan pasangan dibanding tanpa terapi, dan menambah efek obat bila digabung.",
      lim: "Bukti dinilai lemah dan tidak konsisten. Lebih efektif bila dikombinasikan dengan terapi lain.",
      links: [["Cochrane Review", "https://www.cochrane.org/evidence/CD008195_psychosocial-interventions-premature-ejaculation"]] },
    { name: "Obat dengan resep dokter", lvl: "Tinggi", c: "var(--l1)",
      text: "Dapoxetine, obat golongan SSRI yang dibuat khusus untuk ejakulasi dini, menambah waktu sekitar 2,5–3 menit. Pilihan lain adalah SSRI harian atau semprotan anestesi lokal. Semuanya memerlukan pemeriksaan dan resep dokter.",
      lim: "Aplikasi ini tidak memberi dosis atau rekomendasi obat. Bicarakan dengan dokter.",
      links: [["Tinjauan klinis RACGP", "https://www.racgp.org.au/afp/2015/october/premature-ejaculation-a-clinical-review-for-the-general-physician/"], ["Pedoman EAU 2021", "https://pubmed.ncbi.nlm.nih.gov/34183196/"]] }
  ];

  function renderKontrol() {
    const k = KS(), w = kWeek(), started = !!k.start, done = w > 12;
    const ph = started ? kPhase(Math.min(w, 12)) : null;
    const lastCheck = k.checks[k.checks.length - 1];
    const firstCheck = k.checks[0];

    const timeline = `<div class="ktl" aria-label="Linimasa 12 minggu">
        ${[...Array(12)].map((_, i) => { const n = i + 1, p = kPhase(n); return `<i style="--c:${p.color}" class="${started && n < w ? "past" : started && n === w ? "now" : ""}" title="Minggu ${n}"></i>`; }).join("")}
        ${KPHASES.map(p => `<span style="grid-column:${p.from} / ${p.to + 1};color:${p.color}">${p.name}</span>`).join("")}
      </div>`;

    let hero;
    if (!started) {
      hero = `<section class="hero kh">
        <div class="eyebrow" style="color:var(--pelvic)">Program 12 minggu · berbasis riset</div>
        <h1 style="font-size:40px">Program Kontrol</h1>
        <p style="margin:8px 0 0;color:var(--muted);max-width:44ch">Latihan dasar panggul, olahraga aerobik, dan teknik perilaku untuk memperpanjang waktu dan meningkatkan kontrol ejakulasi. Disusun dari pedoman urologi dan studi klinis.</p>
        ${timeline}
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
          ${lastCheck ? "" : `<button class="btn btn-ghost btn-block" data-k="check">Cek mandiri dulu · 2 menit</button>`}
          <button class="btn btn-primary btn-block" data-k="startprog">${I.play} Mulai program</button>
        </div>
      </section>`;
    } else {
      const sess = kSession(Math.min(w, 12)); const days = kDaysThisWeek(); const today = kTodayDone();
      hero = `<section class="hero kh">
        <div class="eyebrow" style="color:${ph.color}">${done ? "Program selesai · pemeliharaan" : `Minggu ${w} dari 12 · fase ${ph.name}`}</div>
        <h1 style="font-size:40px">${done ? "Pemeliharaan" : ph.name}</h1>
        <p style="margin:8px 0 0;color:var(--muted);font-size:14px">${done ? "Pertahankan hasil dengan latihan fase Integrasi 3–4× per minggu. Studi menunjukkan sebagian pria kehilangan kontrol bila berhenti total." : ph.goal}</p>
        ${timeline}
        <div class="kweek"><span><b class="num">${days}</b>/7 hari latihan minggu ini</span><span>${today ? '<span class="pill ok">Hari ini selesai</span>' : '<span class="pill cur">Belum latihan hari ini</span>'}</span></div>
        <ul class="exlist" style="margin-top:6px">${sess.map((p, i) => `<li><span class="ix">${String(i + 1).padStart(2, "0")}</span><span class="nm">${p.name}</span><span class="rx" style="font-size:15px">${p.rx}</span></li>`).join("")}</ul>
        <button class="btn btn-primary btn-block" data-k="session" style="margin-top:14px">${I.play} ${today ? "Latihan lagi" : "Mulai latihan hari ini"} · ±${kMinutes(sess)} menit</button>
        ${done ? "" : `<h3 class="kh3">Tugas minggu ini</h3><ul class="checks" style="margin-top:4px">${ph.tasks.map(t => `<li>${t}</li>`).join("")}</ul>`}
      </section>`;
    }

    const checkCard = lastCheck ? (() => { const r = kInterpret(lastCheck); const d = new Date(lastCheck.ts);
      const delta = firstCheck && firstCheck !== lastCheck ? r.score - kInterpret(firstCheck).score : null;
      return `<button class="card kcheck" data-k="result">
        <div class="kscore num" style="color:${r.band.c}">${r.score}<small>/20</small></div>
        <div class="tx"><b>${r.band.t}</b><span>Cek ${d.getDate()} ${MONTHS[d.getMonth()]}${delta !== null ? ` · ${delta <= 0 ? "turun" : "naik"} ${Math.abs(delta)} poin dari cek pertama` : ""}</span></div>${I.chev}</button>`; })()
      : `<button class="card kcheck" data-k="check"><div class="kscore num" style="color:var(--muted)">?</div><div class="tx"><b>Belum ada cek mandiri</b><span>6 pertanyaan untuk memetakan pola dan langkah yang tepat</span></div>${I.chev}</button>`;

    const wk = k.weekly;
    view.innerHTML = `<div class="view">
      ${hero}

      <section>
        <div class="section-h" style="margin-bottom:10px"><h2>Cek mandiri</h2>${lastCheck ? `<button class="link" data-k="check">Ulangi cek</button>` : ""}</div>
        ${checkCard}
        <p class="note" style="margin:8px 0 0">Skor lebih rendah berarti kontrol lebih baik. Ulangi setiap 4 minggu untuk melihat kemajuan.</p>
      </section>

      <section class="card">
        <div class="section-h" style="margin-bottom:6px"><b>Jurnal mingguan</b><button class="link" data-k="weekly">Isi minggu ini</button></div>
        ${wk.length ? kChart(wk) : `<div class="empty" style="padding:14px 6px">Isi jurnal setiap akhir minggu: rasa kontrol, perkiraan waktu, dan kepuasan. Grafiknya muncul di sini.</div>`}
      </section>

      <section>
        <div class="section-h" style="margin-bottom:10px"><h2>Teknik</h2><span class="eyebrow">Panduan klinis</span></div>
        <div class="list">${Object.entries(KTECH).map(([id, t]) => `<button class="li" data-tech="${id}"><span class="tx"><b>${t.name}</b><span>${t.sub}</span></span>${I.chev}</button>`).join("")}
          <button class="li" data-k="otot"><span class="tx"><b>Panduan otot dasar panggul</b><span>Letak otot, cara mengencangkan, cara mengecek</span></span>${I.chev}</button></div>
      </section>

      <section class="card">
        <div class="eyebrow">Definisi medis · ISSM</div>
        <p style="margin:6px 0 0;font-size:14px">Ejakulasi dini adalah ejakulasi yang <b>hampir selalu terjadi dalam ±1 menit</b> sejak pengalaman pertama (seumur hidup), atau <b>memendek menjadi ±3 menit atau kurang</b> setelah sebelumnya normal (didapat). Kondisi ini disertai ketidakmampuan menunda dan berdampak negatif, misalnya stres, frustrasi, atau menghindari keintiman. Keluhan ini dilaporkan oleh sekitar 21–31% pria dewasa.</p>
      </section>

      <section>
        <div class="section-h" style="margin-bottom:10px"><h2>Gaya hidup</h2></div>
        <ul class="checks klist">
          <li><b>Aerobik 30 menit, 5× per minggu.</b> Lari, jalan cepat, atau bersepeda. Satu studi menemukan efeknya mirip obat.</li>
          <li><b>Latihan dasar panggul setiap hari.</b> Konsistensi lebih penting daripada intensitas.</li>
          <li><b>Kelola kecemasan.</b> Kecemasan memperparah keluhan, dan keluhan memperparah kecemasan. Bicarakan dengan pasangan.</li>
          <li><b>Perhatikan ereksi.</b> Sulit ereksi sering muncul bersamaan, dan pria cenderung terburu-buru sebelum ereksi hilang.</li>
          <li><b>Kondom yang lebih tebal</b> dapat sedikit mengurangi rangsangan.</li>
        </ul>
      </section>

      <section class="card kred">
        <div class="section-h" style="margin-bottom:8px"><b>Kapan harus ke dokter</b><span class="pill" style="color:var(--l4)">Penting</span></div>
        <ul class="warnl">
          <li>Keluhan baru muncul setelah sebelumnya normal</li>
          <li>Disertai sulit mendapatkan atau mempertahankan ereksi</li>
          <li>Nyeri saat ejakulasi atau buang air kecil, atau ada darah di sperma</li>
          <li>Jantung berdebar, gemetar, atau berat badan turun tanpa sebab (tanda tiroid)</li>
          <li>Sangat mengganggu hidup atau hubungan, atau tidak membaik setelah 12 minggu</li>
        </ul>
        <p class="note" style="margin:10px 0 0">Temui dokter spesialis <b>andrologi (Sp.And)</b> atau <b>urologi (Sp.U)</b>. Ada obat yang terbukti efektif, dan semuanya memerlukan resep. Jangan membeli obat tanpa pemeriksaan.</p>
      </section>

      <section>
        <div class="section-h" style="margin-bottom:10px"><h2>Dasar ilmiah</h2><span class="eyebrow">Kekuatan bukti</span></div>
        <div class="evs">${KEVID.map(e => `<article class="ev">
          <div class="ev-h"><b>${e.name}</b><span class="pill" style="color:${e.c}">${e.lvl}</span></div>
          <p>${e.text}</p><p class="muted" style="font-size:12px">Keterbatasan: ${e.lim}</p>
          <div class="ev-l">${e.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`).join("")}</div></article>`).join("")}</div>
      </section>

      <div class="list">${started ? `<button class="li danger" data-k="reset"><span class="tx"><b>Ulang program dari minggu 1</b><span>Riwayat cek dan jurnal tetap tersimpan</span></span>${I.chev}</button>` : ""}</div>
      <p class="note">Program ini disusun dari pedoman dan studi yang dipublikasikan, dan bukan pengganti pemeriksaan dokter. Semua jawaban tersimpan hanya di HP ini.</p>
    </div>`;

    const on = (sel, f) => view.querySelectorAll(sel).forEach(b => b.addEventListener("click", f));
    on('[data-k="check"]', kCheckSheet);
    on('[data-k="result"]', () => kResultSheet(lastCheck));
    on('[data-k="startprog"]', () => { KS().start = new Date(new Date().setHours(0, 0, 0, 0)).getTime(); save(); toast("Program Kontrol dimulai · minggu 1"); renderKontrol(); });
    on('[data-k="session"]', () => { const ww = Math.min(kWeek(), 12); const go = () => startPelvic(kSession(ww), `Program Kontrol · Minggu ${kWeek()}`, true); if (!S.logs.some(l => l.type === "pelvic")) muscleGuide(go); else go(); });
    on('[data-k="weekly"]', kWeeklySheet);
    on('[data-k="otot"]', () => muscleGuide());
    on('[data-k="reset"]', () => sheet(`<h2>Ulang program?</h2><p class="muted">Program kembali ke minggu 1 mulai hari ini. Riwayat cek mandiri dan jurnal tetap tersimpan.</p><div class="row" style="margin-top:16px"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-yes>Ulang</button></div>`,
      (el) => el.querySelector("[data-yes]").addEventListener("click", () => { KS().start = new Date(new Date().setHours(0, 0, 0, 0)).getTime(); save(); closeSheet(); renderKontrol(); })));
    view.querySelectorAll("[data-tech]").forEach(b => b.addEventListener("click", () => { const t = KTECH[b.dataset.tech]; sheet(`<div class="eyebrow" style="color:var(--pelvic)">Program Kontrol · teknik</div><h2>${t.name}</h2>${t.body()}<button class="btn btn-ghost btn-block" data-close style="margin-top:16px">Tutup</button>`); }));
  }

  function kChart(wk) {
    const byW = {}; wk.forEach(e => { byW[e.week] = e; });
    const W = 320, H = 132, pl = 20, pb = 22, pt = 12, cw = (W - pl) / 12, bw = cw * 0.56, y = (v) => pt + (H - pt - pb) * (1 - v / 4);
    const ff = "font-family:var(--f-display)";
    let g = "";
    for (let v = 0; v <= 4; v++) g += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line);stroke-width:1"/><text x="${pl - 6}" y="${y(v) + 3.5}" text-anchor="end" style="font-size:10px;fill:var(--muted);${ff}">${v}</text>`;
    for (let i = 1; i <= 12; i++) {
      const x = pl + (i - 1) * cw + (cw - bw) / 2, e = byW[i], p = kPhase(i);
      if (e) { const v = Math.max(e.control, 0.08); g += `<rect x="${x}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="3" style="fill:${p.color}"/><text x="${x + bw / 2}" y="${y(v) - 4}" text-anchor="middle" style="font-size:10px;font-weight:700;fill:var(--fg);${ff}">${e.control}</text>`; }
      g += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" style="font-size:10px;fill:var(--muted);${ff}">${i}</text>`;
    }
    const last = wk[wk.length - 1];
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skor kontrol per minggu">${g}</svg>
      <p class="note" style="margin:4px 0 0">Skor rasa kontrol per minggu program (0 = sangat buruk, 4 = sangat baik). Terakhir, minggu ${last.week}: perkiraan waktu <b>${KQ[0].o[last.time]}</b>, kepuasan ${last.sat}/4.</p>`;
  }

  function optGroup(name, opts, sel) {
    return `<div class="opts" role="radiogroup" data-g="${name}">${opts.map((o, i) => `<button type="button" role="radio" aria-checked="${sel === i}" data-v="${i}">${o}</button>`).join("")}</div>`;
  }
  function bindOpts(el, state, onChange) {
    el.querySelectorAll(".opts").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      g.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", x === b));
      state[g.dataset.g] = +b.dataset.v; onChange && onChange();
    })));
  }

  function kCheckSheet() {
    const st = {};
    sheet(`<div class="eyebrow" style="color:var(--pelvic)">Cek mandiri · 6 pertanyaan</div><h2>Pola ejakulasi</h2>
      <p class="muted" style="margin:6px 0 0;font-size:14px">Jawab berdasarkan sebagian besar pengalaman dalam 3–6 bulan terakhir. Jawaban tersimpan hanya di HP ini.</p>
      ${KQ.map((q, i) => `<div class="kq"><b><span class="num">${i + 1}</span>${q.q}</b>${optGroup("q" + i, q.o)}</div>`).join("")}
      <div class="kq"><b><span class="num">6</span>Sejak kapan keluhan ini ada?</b>${optGroup("onset", KONSET)}</div>
      <button class="btn btn-primary btn-block" data-submit disabled style="margin-top:18px;opacity:.5">Lihat hasil</button>
      <p class="note" style="margin-top:10px">Ambang skor mengikuti pola kuesioner klinis PEDT, tetapi cek ini tidak tervalidasi dan bukan diagnosis.</p>`,
      (el) => {
        const btn = el.querySelector("[data-submit]");
        bindOpts(el, st, () => { const ok = KQ.every((_, i) => st["q" + i] != null) && st.onset != null; btn.disabled = !ok; btn.style.opacity = ok ? 1 : .5; });
        btn.addEventListener("click", () => {
          const c = { ts: Date.now(), ans: KQ.map((_, i) => st["q" + i]), onset: st.onset };
          KS().checks.push(c); save(); closeSheet(); renderKontrol(); kResultSheet(c);
        });
      });
  }

  function kResultSheet(c) {
    const r = kInterpret(c);
    sheet(`<div class="eyebrow">Hasil cek mandiri</div>
      <div class="kres"><div class="kscore num" style="color:${r.band.c}">${r.score}<small>/20</small></div><div><b style="color:${r.band.c}">${r.band.t}</b><span class="muted" style="display:block;font-size:12px">0–8 batas umum · 9–10 tanda berkurang · 11+ sesuai pola</span></div></div>
      <p style="margin:12px 0 0;font-size:14px">${r.type}</p>
      <h3>Langkah yang disarankan</h3>
      <ol class="steps">${r.recs.map(x => `<li>${x}</li>`).join("")}</ol>
      <p class="note" style="margin-top:12px">Hasil ini membantu memetakan pola, bukan diagnosis. Diagnosis ditegakkan dokter melalui wawancara dan pemeriksaan.</p>
      <button class="btn btn-ghost btn-block" data-close style="margin-top:14px">Tutup</button>`);
  }

  function kWeeklySheet() {
    const k = KS(); const w = Math.max(1, Math.min(kWeek() || 1, 12));
    const prev = k.weekly.find(e => e.week === w) || {};
    const st = { control: prev.control, time: prev.time, sat: prev.sat };
    sheet(`<div class="eyebrow" style="color:var(--pelvic)">Jurnal · minggu ${w}</div><h2>Bagaimana minggu ini?</h2>
      <div class="kq"><b>Rasa kontrol saat berhubungan atau latihan</b>${optGroup("control", ["Sangat buruk", "Buruk", "Cukup", "Baik", "Sangat baik"], st.control)}</div>
      <div class="kq"><b>Perkiraan waktu sampai ejakulasi</b>${optGroup("time", KQ[0].o, st.time)}</div>
      <div class="kq"><b>Kepuasan (kamu dan pasangan)</b>${optGroup("sat", ["Sangat rendah", "Rendah", "Cukup", "Baik", "Sangat baik"], st.sat)}</div>
      <button class="btn btn-primary btn-block" data-save style="margin-top:18px">Simpan jurnal</button>`,
      (el) => {
        bindOpts(el, st);
        el.querySelector("[data-save]").addEventListener("click", () => {
          if (st.control == null || st.time == null || st.sat == null) { toast("Isi ketiga pertanyaan dulu"); return; }
          k.weekly = k.weekly.filter(e => e.week !== w).concat([{ week: w, ts: Date.now(), control: st.control, time: st.time, sat: st.sat }]).sort((a, b) => a.week - b.week);
          save(); closeSheet(); renderKontrol(); toast(`Jurnal minggu ${w} tersimpan`);
        });
      });
  }

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
