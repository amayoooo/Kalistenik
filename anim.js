/* =========================================================
   KALISTENIK PRO — ANIMASI GERAKAN
   Figur garis tampak samping. Setiap gerakan = beberapa pose
   kunci yang dianimasikan berulang. Pose ditulis sebagai titik
   pinggul, bahu, tangan, dan kaki; siku & lutut dihitung otomatis.
   Koordinat: kanvas 200×132, lantai di y = 124.
   ========================================================= */
(function () {
  "use strict";
  const F = 124;
  const LEN = { torso: 30, ua: 15.5, fa: 15.5, th: 20, sh: 20, head: 6.2, neck: 3, foot: 6 };

  /* ---------- Geometri ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]) || 0.0001;
  const unit = (a) => mul(a, 1 / len(a));
  const rot = (v, deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
  // arah dari sudut terhadap vertikal-atas, positif = condong ke kanan
  const lean = (deg) => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180)];
  const from = (p, deg, l) => add(p, mul(lean(deg), l));

  function ik(R, T, l1, l2, s) {
    const d0 = sub(T, R), d = len(d0), u = unit(d0);
    const dd = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
    const a = Math.acos((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd)) * 180 / Math.PI * s;
    return [add(R, mul(rot(u, a), l1)), add(R, mul(u, dd))];
  }

  /* Pose → titik sendi lengkap */
  function solve(p) {
    const hip = p.hip, sh = p.sh || from(hip, p.t || 0, LEN.torso);
    const up = unit(sub(sh, hip));
    const head = add(sh, mul(rot(up, p.tilt || 0), LEN.neck + LEN.head));
    const eb = p.eb || [1, 1], kb = p.kb || [-1, -1];
    const el = [], ha = [], kn = [], an = [], to = [];
    for (let i = 0; i < 2; i++) {
      const hand = p.hands[i] || p.hands[0];
      if (p.elbows && p.elbows[i]) { el[i] = p.elbows[i]; ha[i] = hand; }
      else { const r = ik(sh, hand, LEN.ua, LEN.fa, (p.eb && p.eb[i] != null) ? eb[i] : eb[0]); el[i] = r[0]; ha[i] = r[1]; }
      const foot = p.feet[i] || p.feet[0];
      if (p.knees && p.knees[i]) { kn[i] = p.knees[i]; an[i] = foot; }
      else { const r = ik(hip, foot, LEN.th, LEN.sh, (p.kb && p.kb[i] != null) ? kb[i] : kb[0]); kn[i] = r[0]; an[i] = r[1]; }
      if (p.toes && p.toes[i]) to[i] = p.toes[i];
      else {
        const d = unit(sub(an[i], kn[i]));
        to[i] = add(an[i], mul(p.point ? d : [d[1], -d[0]], LEN.foot));
      }
      if (to[i][1] > F) to[i] = [an[i][0] + Math.sign(to[i][0] - an[i][0] || 1) * Math.sqrt(Math.max(0, LEN.foot * LEN.foot - (F - an[i][1]) ** 2)), F];
    }
    return { hip, sh, head, el, ha, kn, an, to };
  }

  /* ---------- Helper pose ---------- */
  // badan lurus dari titik tumpu (kaki/lutut) dengan sudut dari vertikal
  function line(base, deg, legLen) {
    const hip = from(base, deg, legLen), sh = from(base, deg, legLen + LEN.torso);
    return { hip, sh };
  }
  const both = (a, b) => [a, b || a];
  const K = (p, d = 0.8, h = 0.3) => ({ p, d, h });

  /* ---------- Template gerakan ---------- */
  const T = {};

  /* PUSH-UP (lantai) */
  T.pushup = (o = {}) => {
    const foot = [o.footX || 62, F], hx = o.handX || 127, fhx = o.farHandX || hx;
    const mk = (deg, nearBend, farHand) => {
      const b = line(foot, deg, 40);
      const hands = [[hx, F], farHand || [fhx, F]];
      return { ...b, hands, feet: both(foot), eb: [1, 1], point: true };
    };
    const up = mk(o.upDeg || 65.5), down = mk(o.downDeg || 81.5);
    if (o.oneArm) { up.hands[1] = add(up.hip, [6, -6]); down.hands[1] = add(down.hip, [6, -6]); up.elbows = [null, add(up.sh, [-8, 12])]; down.elbows = [null, add(down.sh, [-8, 12])]; }
    return { props: o.props || [], frames: [K(up, 1.1, 0.35), K(down, 0.9, 0.25)] };
  };
  T.kneePushup = () => {
    const knee = [80, F];
    const mk = (deg) => { const hip = from(knee, deg, 20), sh = from(knee, deg, 50); return { hip, sh, hands: both([120, F]), feet: both([62, 112]), knees: both(knee), point: true }; };
    return { props: [], frames: [K(mk(55), 1, 0.35), K(mk(77), 0.9, 0.25)] };
  };
  T.wallPushup = () => {
    const foot = [108, F];
    const mk = (deg) => ({ ...line(foot, deg, 40), hands: both([157, 60]), feet: both(foot), point: true });
    return { props: [{ wall: 160 }], frames: [K(mk(19), 1, 0.35), K(mk(30), 0.9, 0.25)] };
  };
  T.inclinePushup = () => {
    const foot = [82, F];
    const mk = (deg) => ({ ...line(foot, deg, 40), hands: both([128, 98]), feet: both(foot), point: true });
    return { props: [{ bench: [118, 172, 98] }], frames: [K(mk(39), 1, 0.35), K(mk(55), 0.9, 0.25)] };
  };
  T.pikePushup = () => {
    const feet = both([60, 98]);
    const up = { hip: [92, 74], sh: [110, 98], hands: both([128, F]), feet, eb: [1, 1], point: true, tilt: 0 };
    const down = { hip: [99, 84], sh: [117, 110], hands: both([128, F]), feet, eb: [1, 1], point: true };
    return { props: [{ bench: [24, 70, 98] }], frames: [K(up, 1.1, 0.35), K(down, 0.9, 0.25)] };
  };
  T.dips = () => {
    const up = { hip: [100, 78], sh: [102, 47], hands: both([104, 78]), feet: both([90, 112]), kb: [-1, -1], eb: [1, 1] };
    const down = { hip: [95, 95], sh: [99, 65], hands: both([104, 78]), feet: both([84, 122]), kb: [-1, -1], eb: [1, 1] };
    return { props: [{ pbars: [70, 136, 78] }], frames: [K(up, 1.1, 0.3), K(down, 0.9, 0.25)] };
  };

  /* HANDSTAND & HSPU */
  T.handstand = (o = {}) => {
    const hx = o.hx || 110;
    const mk = (sway, shY) => {
      const sh = [hx + sway * 0.3, shY || 93];
      const hip = add(sh, mul(lean(sway), LEN.torso));
      const ft = add(hip, mul(lean(sway * 1.2), 39));
      return { hip, sh, hands: both([hx, F]), feet: both(ft), eb: [-1, -1], kb: [1, 1], point: true, elbows: shY ? null : null };
    };
    if (o.press) {
      const up = mk(0), down = mk(0, 111);
      down.eb = [1, 1];
      return { props: o.wall ? [{ wall: hx + 9 }] : [], frames: [K(up, 1.2, 0.35), K(down, 1.0, 0.25)] };
    }
    return { props: o.wall ? [{ wall: hx + 12 }] : [], frames: o.wall ? [K(mk(4), 1.6, 0.4), K(mk(6), 1.6, 0.4)] : [K(mk(-3), 1.3, 0.2), K(mk(3), 1.3, 0.2)] };
  };

  /* GANTUNG & TARIK */
  const BAR = 14;
  function hang(shY, o = {}) {
    const hx = o.hx || 100, hands = o.hands || both([hx, BAR + 2]);
    const sh = [hx + (o.shDx || 0), shY];
    const hip = o.hip || add(sh, mul(lean(o.lean || 180), LEN.torso));
    return { hip, sh, hands, feet: o.feet || both(add(hip, [-5, 38])), kb: [-1, -1], eb: o.eb || [-1, -1], point: true, elbows: o.elbows };
  }
  T.deadHang = () => ({ props: [{ bar: [100, BAR] }], frames: [K(hang(45), 2, 0.2), K(hang(46), 2, 0.2)] });
  T.scapula = () => ({ props: [{ bar: [100, BAR] }], frames: [K(hang(46), 0.7, 0.3), K(hang(40), 0.6, 0.8)] });
  T.pullup = (o = {}) => {
    const top = o.chest ? 16 : 22;
    const down = hang(45), up = hang(top, { shDx: o.chest ? 3 : 0 });
    if (o.archer) { down.hands = [[100, BAR + 2], [132, BAR + 2]]; up.hands = [[100, BAR + 2], [132, BAR + 2]]; }
    if (o.oneArm) { down.hands = [[100, BAR + 2], [100, 34]]; up.hands = [[100, BAR + 2], [101, 22 + 16]]; }
    const frames = o.negative ? [K(down, 0.5, 0.1), K(up, 4.5, 0.8)] : [K(down, 1.0, 0.3), K(up, 1.1, 0.4)];
    if (o.negative) { frames[0] = K(up, 4.5, 0.6); frames[1] = K(down, 0.6, 0.6); }
    return { props: [{ bar: [100, BAR] }], frames };
  };
  T.muscleUp = () => {
    const B = 40, hands = both([100, B + 2]);
    const hangP = { hip: [100, 101], sh: [100, 72], hands, feet: both([94, 120]), kb: [1, 1], eb: [-1, -1], point: true };
    const pull = { hip: [93, 82], sh: [101, 54], hands, feet: both([86, 108]), kb: [1, 1], eb: [-1, -1], point: true };
    const trans = { hip: [96, 66], sh: [106, 38], hands, feet: both([86, 94]), kb: [1, 1], eb: [1, 1], point: true };
    const top = { hip: [98, 42], sh: [101, 11], hands, feet: both([94, 82]), kb: [1, 1], eb: [1, 1], point: true };
    return { props: [{ bar: [100, B] }], frames: [K(hangP, 0.7, 0.3), K(pull, 0.5, 0), K(trans, 0.6, 0), K(top, 1.0, 0.6)] };
  };
  T.row = () => {
    const heel = [58, F], hand = both([130, 88]);
    const down = { ...line(heel, 83.5, 40), hands: hand, feet: both(heel), eb: [-1, -1], toes: both([60, 117]) };
    const up = { ...line(heel, 66, 40), hands: hand, feet: both(heel), eb: [-1, -1], toes: both([60, 117]) };
    return { props: [{ bar: [130, 88], posts: true }], frames: [K(down, 1.0, 0.3), K(up, 1.1, 0.4)] };
  };
  T.kneeRaise = (o = {}) => {
    const base = hang(45);
    const up = o.toes
      ? hang(48, { hip: [92, 74], feet: both([120, 24]) })
      : hang(46, { feet: both([110, 90]), hip: [99, 75] });
    if (!o.toes) { up.kb = [-1, -1]; up.knees = both([118, 64]); up.feet = both([117, 84]); }
    return { props: [{ bar: [100, BAR] }], frames: [K(base, 1.0, 0.3), K(up, 1.0, 0.4)] };
  };

  /* LEVER (front lever, tuck, raise) */
  T.lever = (o = {}) => {
    const B = 22, hands = both([100, B + 2]);
    const flat = (kind) => {
      const sh = [88, 50], hip = [118, 50];
      const p = { sh, hip, hands, feet: both([158, 50]), eb: [1, 1], point: true, tilt: 0 };
      if (kind === "tuck") { p.hip = [114, 46]; p.knees = both([108, 32]); p.feet = both([124, 34]); }
      if (kind === "adv") { p.knees = both([126, 34]); p.feet = both([140, 48]); }
      return p;
    };
    if (o.raise) {
      const low = { sh: [100, 54], hip: [100, 84], hands, feet: both([96, 123]), eb: [-1, -1], point: true };
      return { props: [{ bar: [100, B] }], frames: [K(low, 1.4, 0.3), K(flat("full"), 1.6, 0.5)] };
    }
    const p = flat(o.kind || "full"); const p2 = JSON.parse(JSON.stringify(p)); p2.hip[1] += 1.5; p2.feet[0][1] += 2; p2.feet[1][1] += 2;
    return { props: [{ bar: [100, B] }], frames: [K(p, 1.8, 0.2), K(p2, 1.8, 0.2)] };
  };

  /* PLANCHE */
  T.planche = (o = {}) => {
    const hands = both([110, F]);
    const mk = (dy) => {
      if (o.kind === "lean") return { hip: [80, 106 + dy], sh: [118, 98], hands, feet: both([50, F]), eb: [1, 1], point: true };
      const p = { sh: [122, 96 + dy], hip: [94, 98 + dy], hands, feet: both([54, 98 + dy]), eb: [1, 1], point: true, tilt: 10 };
      if (o.kind === "tuck") { p.hip = [100, 92 + dy]; p.knees = both([108, 104 + dy]); p.feet = both([92, 108 + dy]); }
      return p;
    };
    return { props: [], frames: [K(mk(0), 1.8, 0.3), K(mk(1.5), 1.8, 0.3)] };
  };

  /* HUMAN FLAG */
  T.flag = (o = {}) => {
    const hands = [[150, 40], [150, 76]];
    const mk = (dy) => {
      const p = { sh: [124, 58 + dy], hip: [94, 60 + dy], hands, feet: both([54, 62 + dy]), eb: [1, -1], point: true };
      if (o.tuck) { p.knees = both([86, 46 + dy]); p.feet = both([102, 44 + dy]); }
      return p;
    };
    return { props: [{ pole: 150 }], frames: [K(mk(0), 1.8, 0.2), K(mk(2), 1.8, 0.2)] };
  };

  /* KAKI */
  T.squat = (o = {}) => {
    const ft = both([104, F]);
    const stand = { hip: [100, 85], t: 0, hands: both([102, 86]), feet: ft, eb: [1, 1] };
    const deep = { hip: [86, 107], t: 30, hands: both([136, 84]), feet: ft, eb: [1, 1] };
    if (!o.jump) return { props: [], frames: [K(stand, 1.1, 0.3), K(deep, 1.0, 0.3)] };
    const air = { hip: [100, 70], t: 0, hands: both([110, 40]), feet: both([104, 108]), eb: [1, 1], point: true };
    return { props: [], frames: [K(stand, 0.6, 0.1), K(deep, 0.35, 0.05), K(air, 0.35, 0.05), K(stand, 0.6, 0.3)] };
  };
  T.lunge = (o = {}) => {
    if (o.bench) {
      const back = [62, 98], toe = [56, 97];
      const up = { hip: [100, 88], t: 3, hands: both([102, 88]), feet: [[120, F], back], kb: [-1, -1], eb: [-1, -1], toes: [null, toe] };
      const down = { hip: [96, 106], t: 6, hands: both([98, 108]), feet: [[118, F], back], knees: [[116, 106], [82, 113]], eb: [-1, -1], toes: [null, toe] };
      return { props: [{ bench: [30, 70, 98] }], frames: [K(up, 1.0, 0.3), K(down, 1.0, 0.3)] };
    }
    const up = { hip: [98, 87], t: 3, hands: both([100, 88]), feet: [[120, F], [76, F]], kb: [-1, -1], eb: [-1, -1], toes: [null, [70, F]] };
    const down = { hip: [98, 104], t: 4, hands: both([99, 106]), feet: [[120, F], [74, 121]], knees: [[118, 104], [92, 122]], eb: [-1, -1], toes: [null, [68, F]] };
    return { props: [], frames: [K(up, 1.0, 0.3), K(down, 1.0, 0.3)] };
  };
  T.calf = () => {
    const up = { hip: [100, 79], t: 0, hands: both([104, 80]), feet: [[101, 118], [88, 108]], toes: [[107, F], null], eb: [-1, -1], kb: [-1, 1] };
    const down = { hip: [100, 85], t: 0, hands: both([104, 85]), feet: [[100, F], [88, 112]], toes: [[107, F], null], eb: [-1, -1], kb: [-1, 1] };
    return { props: [{ step: [92, 124] }], frames: [K(down, 0.8, 0.2), K(up, 0.7, 0.6)] };
  };
  T.pistol = (o = {}) => {
    const ft = [104, F];
    const stand = { hip: [100, 85], t: 0, hands: both([128, 74]), feet: [ft, [138, 96]], kb: [-1, -1], eb: [1, 1], point: false };
    const low = { hip: [88, 111], t: 26, hands: both([140, 86]), feet: [ft, [144, 108]], kb: [-1, -1], eb: [1, 1] };
    if (o.shrimp) {
      stand.feet[1] = [78, 104]; stand.kb = [-1, 1]; stand.toes = [null, [74, 99]]; stand.hands = [[122, 80], [80, 102]];
      low.feet[1] = [70, 122]; low.knees = [null, [86, 122]]; low.hands = [[136, 84], [70, 118]]; low.toes = [null, [66, 117]];
    }
    return { props: [], frames: [K(stand, 1.2, 0.3), K(low, 1.1, 0.3)] };
  };
  T.bridge = (o = {}) => {
    const feet = both([122, F]);
    const down = { hip: [92, 120], sh: [62, 120], hands: both([92, 123]), feet, kb: [-1, -1], eb: [1, 1], tilt: 0 };
    const up = { hip: [96, 101], sh: [63, 119], hands: both([92, 123]), feet, kb: [-1, -1], eb: [1, 1] };
    return { props: [], frames: [K(down, 1.0, 0.3), K(up, 0.9, 0.8)] };
  };

  /* CORE */
  T.plank = () => {
    const foot = [40, F];
    const mk = (dy) => { const sh = [130, 107], hip = add(add(foot, mul(sub(sh, foot), 40 / 70)), [0, dy]); return { hip, sh, hands: both([147, 122]), elbows: both([130, 122]), feet: both(foot), point: true }; };
    return { props: [], frames: [K(mk(0), 2, 0.2), K(mk(1.5), 2, 0.2)] };
  };
  T.deadBug = () => {
    const base = { hip: [96, 119], sh: [66, 119], hands: both([66, 88]), elbows: both([66, 103]), knees: both([96, 99]), feet: both([116, 99]), point: true };
    const ext = JSON.parse(JSON.stringify(base));
    ext.hands[0] = [36, 116]; ext.elbows[0] = [51, 117]; ext.knees[1] = [115, 115]; ext.feet[1] = [135, 116];
    const ext2 = JSON.parse(JSON.stringify(base));
    ext2.hands[1] = [36, 116]; ext2.elbows[1] = [51, 117]; ext2.knees[0] = [115, 115]; ext2.feet[0] = [135, 116];
    return { props: [], frames: [K(base, 0.9, 0.2), K(ext, 0.9, 0.3), K(base, 0.9, 0.2), K(ext2, 0.9, 0.3)] };
  };
  T.hollow = (o = {}) => {
    const mk = (dy) => {
      const p = { hip: [96, 120], sh: [68, 112 + dy * 0.5], hands: both([38, 104 + dy]), feet: both([134, 108 + dy]), eb: [1, 1], point: true };
      if (o.tuck) { p.knees = both([90, 102 + dy]); p.feet = both([106, 110 + dy]); p.hands = both([92, 104 + dy]); p.elbows = both([78, 108 + dy]); }
      return p;
    };
    return { props: [], frames: [K(mk(0), 1.6, 0.2), K(mk(2), 1.6, 0.2)] };
  };
  T.lsit = (o = {}) => {
    const hands = both([100, F]);
    const mk = (dy) => {
      const p = { hip: [100, 112 + dy], sh: [100, 82 + dy * 0.3], hands, feet: both([140, 112 + dy]), eb: [1, 1], point: true };
      if (o.kind === "tuck") { p.knees = both([116, 100 + dy]); p.feet = both([118, 118 + dy]); }
      if (o.kind === "v") { p.sh = [92, 84]; p.hip = [100, 113 + dy]; p.feet = both([128, 76 + dy]); }
      return p;
    };
    return { props: [{ parallettes: [100] }], frames: [K(mk(0), 1.7, 0.2), K(mk(-1.5), 1.7, 0.2)] };
  };
  T.dragon = (o = {}) => {
    const hands = both([46, 101]);
    const up = { sh: [62, 100], hip: [64, 70], hands, feet: both([66, 30]), eb: [-1, -1], point: true, kb: [1, 1], elbows: both([52, 90]) };
    const flat = { sh: [62, 100], hip: [91, 92], hands, feet: both([130, 82]), eb: [-1, -1], point: true, kb: [1, 1], elbows: both([52, 90]) };
    const frames = o.negative ? [K(up, 4.5, 0.5), K(flat, 0.8, 0.4)] : [K(up, 1.6, 0.4), K(flat, 1.6, 0.4)];
    return { props: [{ bench: [30, 150, 104] }], frames };
  };

  /* ---------- Peta gerakan → animasi ---------- */
  const MAP = {
    "wall-pushup": () => T.wallPushup(),
    "incline-pushup": () => T.inclinePushup(),
    "knee-pushup": () => T.kneePushup(),
    "pushup": () => T.pushup(),
    "diamond-pushup": () => T.pushup({ handX: 124 }),
    "dips": () => T.dips(),
    "archer-pushup": () => T.pushup({ farHandX: 158 }),
    "pseudo-planche": () => T.pushup({ handX: 108, upDeg: 64, downDeg: 80 }),
    "pike-pushup": () => T.pikePushup(),
    "one-arm-pushup": () => T.pushup({ oneArm: true }),
    "wall-hspu": () => T.handstand({ wall: true, press: true }),
    "free-hspu": () => T.handstand({ press: true }),

    "dead-hang": () => T.deadHang(),
    "scapula-pull": () => T.scapula(),
    "australian-row": () => T.row(),
    "negative-pullup": () => T.pullup({ negative: true }),
    "pullup": () => T.pullup(),
    "chinup": () => T.pullup(),
    "ctb-pullup": () => T.pullup({ chest: true }),
    "archer-pullup": () => T.pullup({ archer: true }),
    "muscle-up": () => T.muscleUp(),
    "mu-volume": () => T.muscleUp(),
    "front-lever-raise": () => T.lever({ raise: true }),
    "one-arm-pullup": () => T.pullup({ oneArm: true }),

    "squat": () => T.squat(),
    "jump-squat": () => T.squat({ jump: true }),
    "lunge": () => T.lunge(),
    "bulgarian": () => T.lunge({ bench: true }),
    "glute-bridge": () => T.bridge(),
    "calf-raise": () => T.calf(),
    "shrimp-squat": () => T.pistol({ shrimp: true }),
    "pistol": () => T.pistol(),
    "pistol-volume": () => T.pistol(),
    "dragon-pistol": () => T.pistol(),

    "plank": () => T.plank(),
    "dead-bug": () => T.deadBug(),
    "tuck-hollow": () => T.hollow({ tuck: true }),
    "hollow-hold": () => T.hollow(),
    "hanging-knee": () => T.kneeRaise(),
    "toes-to-bar": () => T.kneeRaise({ toes: true }),
    "tuck-lsit": () => T.lsit({ kind: "tuck" }),
    "lsit": () => T.lsit(),
    "vsit": () => T.lsit({ kind: "v" }),
    "dragon-neg": () => T.dragon({ negative: true }),
    "dragon-flag": () => T.dragon(),

    "wall-handstand": () => T.handstand({ wall: true }),
    "freestanding-hs": () => T.handstand(),
    "hs-60": () => T.handstand(),
    "tuck-fl": () => T.lever({ kind: "tuck" }),
    "front-lever": () => T.lever({ kind: "full" }),
    "tuck-planche": () => T.planche({ kind: "tuck" }),
    "planche": () => T.planche(),
    "human-flag": () => T.flag(),

    /* Pelvic floor yang melibatkan gerakan */
    "p-bridge": () => T.bridge(),
    "p-squat": () => T.squat(),
    "p-lunge": () => T.lunge()
  };

  /* ---------- Render ---------- */
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  function drawProps(g, props) {
    const st = "stroke:var(--anim-prop);fill:none;stroke-width:3;stroke-linecap:round";
    const fillSt = "fill:var(--anim-prop-fill);stroke:var(--anim-prop);stroke-width:1.5";
    props.forEach(p => {
      if (p.wall != null) el("rect", { x: p.wall, y: 8, width: 30, height: F - 8, style: fillSt }, g);
      if (p.bench) { const [x1, x2, y] = p.bench; el("rect", { x: x1, y, width: x2 - x1, height: 5, rx: 1.5, style: fillSt }, g); el("path", { d: `M${x1 + 5} ${y + 5}V${F}M${x2 - 5} ${y + 5}V${F}`, style: st }, g); }
      if (p.step) { const [x, y] = p.step; el("rect", { x: x, y: y - 0.5, width: 40, height: 0.5, style: fillSt }, g); }
      if (p.bar) {
        const [x, y] = p.bar;
        if (p.posts) el("path", { d: `M${x} ${y}V${F}`, style: st }, g);
        else el("path", { d: `M${x - 52} ${y}H${x + 52}`, style: st + ";opacity:.35" }, g);
        el("circle", { cx: x, cy: y, r: 3.2, style: "fill:var(--anim-prop)" }, g);
      }
      if (p.pbars) { const [x1, x2, y] = p.pbars; el("path", { d: `M${x1} ${y}H${x2}M${x1 + 6} ${y}V${F}M${x2 - 6} ${y}V${F}`, style: st }, g); }
      if (p.pole != null) el("path", { d: `M${p.pole} 4V${F}`, style: st + ";stroke-width:4" }, g);
      if (p.parallettes) { const x = p.parallettes[0]; el("path", { d: `M${x - 9} ${F}L${x - 5} ${F - 0.5}H${x + 5}L${x + 9} ${F}`, style: st + ";stroke-width:2" }, g); }
    });
  }

  function buildFigure(g) {
    const far = el("g", { style: "stroke:var(--anim-far);stroke-linecap:round;stroke-linejoin:round;fill:none" }, g);
    const near = el("g", { style: "stroke:var(--anim-fig);stroke-linecap:round;stroke-linejoin:round;fill:none" }, g);
    return {
      farArm: el("polyline", { style: "stroke-width:4.2" }, far),
      farLeg: el("polyline", { style: "stroke-width:5" }, far),
      torso: el("line", { style: "stroke-width:7" }, near),
      nearLeg: el("polyline", { style: "stroke-width:5.4" }, near),
      nearArm: el("polyline", { style: "stroke-width:4.6" }, near),
      head: el("circle", { r: LEN.head, style: "fill:var(--anim-fig);stroke:none" }, near)
    };
  }
  const pts = (arr) => arr.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  function paint(fig, j) {
    fig.farArm.setAttribute("points", pts([j.sh, j.el[1], j.ha[1]]));
    fig.farLeg.setAttribute("points", pts([j.hip, j.kn[1], j.an[1], j.to[1]]));
    fig.nearLeg.setAttribute("points", pts([j.hip, j.kn[0], j.an[0], j.to[0]]));
    fig.nearArm.setAttribute("points", pts([j.sh, j.el[0], j.ha[0]]));
    fig.torso.setAttribute("x1", j.hip[0]); fig.torso.setAttribute("y1", j.hip[1]); fig.torso.setAttribute("x2", j.sh[0]); fig.torso.setAttribute("y2", j.sh[1]);
    fig.head.setAttribute("cx", j.head[0]); fig.head.setAttribute("cy", j.head[1]);
  }
  const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function lerpJ(a, b, t) {
    const o = {};
    for (const k in a) o[k] = Array.isArray(a[k][0]) ? a[k].map((p, i) => lerpP(p, b[k][i], t)) : lerpP(a[k], b[k], t);
    return o;
  }
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const live = new Set();
  let raf = 0;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frameAt(a, time) {
    const total = a.cycle; let t = (time / 1000) % total;
    for (let i = 0; i < a.frames.length; i++) {
      const f = a.frames[i], nx = a.joints[(i + 1) % a.frames.length];
      if (t < f.h) return a.joints[i];
      t -= f.h;
      if (t < f.d) return lerpJ(a.joints[i], nx, ease(t / f.d));
      t -= f.d;
    }
    return a.joints[0];
  }
  function loop(now) {
    live.forEach(a => { if (!a.svg.isConnected) { live.delete(a); return; } paint(a.fig, frameAt(a, now - a.t0)); });
    raf = live.size ? requestAnimationFrame(loop) : 0;
  }

  /* API: Anim.mount(container, exerciseId) → true jika ada animasi */
  function mount(container, id) {
    const def = MAP[id]; if (!def || !container) return false;
    const d = def();
    const svg = el("svg", { viewBox: "0 -6 200 136", class: "anim-svg", role: "img", "aria-label": "Animasi gerakan" });
    el("path", { d: `M4 ${F + 0.5}H196`, style: "stroke:var(--anim-floor);stroke-width:1.5" }, svg);
    drawProps(svg, d.props || []);
    const fig = buildFigure(svg);
    const a = { svg, fig, frames: d.frames, joints: d.frames.map(f => solve(f.p)), t0: performance.now() };
    a.cycle = d.frames.reduce((t, f) => t + f.d + f.h, 0);
    container.innerHTML = ""; container.appendChild(svg);
    if (reduce) { paint(fig, a.joints[Math.min(1, a.joints.length - 1)]); return true; }
    paint(fig, a.joints[0]);
    live.add(a); if (!raf) raf = requestAnimationFrame(loop);
    return true;
  }
  function has(id) { return !!MAP[id]; }

  /* untuk lembar uji: pose statis */
  function still(container, id, i) {
    const d = MAP[id](); const svg = el("svg", { viewBox: "0 -6 200 136", class: "anim-svg" });
    el("path", { d: `M4 ${F + 0.5}H196`, style: "stroke:var(--anim-floor);stroke-width:1.5" }, svg);
    drawProps(svg, d.props || []); const fig = buildFigure(svg); paint(fig, solve(d.frames[i].p)); container.appendChild(svg);
  }

  window.Anim = { mount, has, still, ids: Object.keys(MAP), frameCount: (id) => MAP[id]().frames.length };
})();
