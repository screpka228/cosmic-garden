(function () {
var NS = 'http://www.w3.org/2000/svg';
var SAVE_KEY = 'cosmic-garden-v2';
var OFFLINE_CAP = 8 * 3600;
var NW = 150;
var CAP = 6;
var SPEED = 140;
var GAP = 16;
var C = { w: '#1fb6ff', e: '#ff9a1f', l: '#b79cff', p: '#ff7d6b', i: '#3fd3a0', m: '#ffb347', d: '#ffd84d', c: '#ffd24a', s: '#19e6d0' };

function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
function $(id) { return document.getElementById(id); }

var ICONS = {
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4M12 7.5v1.5M12 15v1.5',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M8 15h8',
  factory: 'M3 21V11l6 4v-4l6 4V5h4v16z',
  box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14'
};
function ic(name, size, color) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:' + size + 'px;height:' + size + 'px;cursor:inherit"><path d="' + ICONS[name] + '"/></svg>';
}

/* Типы машин. rec: cyc — секунд на цикл, inp/out — [номер строки, сколько]. */
var TY = {
  well: { t: 'Колодец', c: C.w, cost: 40, d: 'Даёт воду', r: [['out', 'Вода', '', C.w]], rec: { cyc: 0.7, out: [[0, 1]] } },
  lotus: { t: 'Грядка лотоса', c: C.l, cost: 60, d: 'Растит лотос', r: [['in', 'Вода', '', C.w], ['out', 'Лотос', '', C.l]], rec: { cyc: 2.5, inp: [[0, 1]], out: [[1, 1]], plant: 1 } },
  pepper: { t: 'Грядка перца', c: C.p, cost: 60, d: 'Растит перец', r: [['in', 'Вода', '', C.w], ['out', 'Перец', '', C.p]], rec: { cyc: 3, inp: [[0, 1]], out: [[1, 1]], plant: 1 } },
  ivy: { t: 'Грядка плюща', c: C.i, cost: 70, d: 'Растит плющ', r: [['in', 'Вода', '', C.w], ['out', 'Плющ', '', C.i]], rec: { cyc: 2, inp: [[0, 1]], out: [[1, 1]], plant: 1 } },
  gen: { t: 'Генератор', c: C.e, cost: 150, d: 'Даёт энергию', r: [['out', 'Энергия', '', C.e]], rec: { cyc: 1, out: [[0, 1]] } },
  mixer: { t: 'Смеситель', c: C.m, cost: 200, d: 'Смешивает плоды', r: [['in', 'Лотос', '', C.l], ['in', 'Перец', '', C.p], ['in', 'Плющ', '', C.i], ['in', 'Энергия', '', C.e], ['out', 'Смесь', '', C.m]], rec: { cyc: 2.5, inp: [[0, 1], [1, 1], [2, 1], [3, 1]], out: [[4, 1]] } },
  oven: { t: 'Печь', c: C.d, cost: 250, d: 'Готовит блюда', r: [['in', 'Смесь', '', C.m], ['in', 'Энергия', '', C.e], ['out', 'Блюдо', '', C.d]], rec: { cyc: 2, inp: [[0, 1], [1, 1]], out: [[2, 1]] } },
  market: { t: 'Рынок', c: C.c, cost: 300, d: 'Продаёт блюда', r: [['in', 'Блюдо', '', C.d]], rec: { cyc: 1, inp: [[0, 1]], sell: 40 } },
  lab: { t: 'Лаборатория', c: C.s, cost: 400, d: 'Даёт науку', r: [['in', 'Блюдо', '', C.d]], rec: { cyc: 1.5, inp: [[0, 1]], sci: 4 } }
};

var T = {
  base: { x: 10, y: 190, t: 'Основы', e: 'Грядки и конвейеры', cost: 0, pre: [], done: 1 },
  hybrid: { x: 190, y: 70, t: 'Гибриды', e: 'Скрещивание растений', cost: 0, pre: ['base'], done: 1 },
  water: { x: 190, y: 190, t: 'Автополив', e: 'Колодцы и трубы', cost: 0, pre: ['base'], done: 1 },
  shop: { x: 190, y: 310, t: 'Меню гостей', e: 'Заказы от гостей', cost: 80, pre: ['base'] },
  speed: { x: 370, y: 70, t: 'Ускорение', e: 'Станки быстрее 25%', cost: 120, pre: ['hybrid'] },
  crystal: { x: 370, y: 190, t: 'Теплицы', e: 'Грядки быстрее 20%', cost: 300, pre: ['water'] },
  drone: { x: 370, y: 310, t: 'Дроны-пчёлы', e: 'Продажи +15%', cost: 260, pre: ['shop'] },
  planet: { x: 550, y: 130, t: 'Новые планеты', e: 'Вторая планета', cost: 900, pre: ['speed', 'crystal'] }
};

var G = [
  { n: 'Ферн · туманник', w: 'Лёгкое и пряное', r: 320, d: 0 },
  { n: 'Крис · кристаллоид', w: 'Хрустящее и холодное', r: 450, d: 0 },
  { n: 'Омо · странник', w: 'Что-нибудь сладкое', r: 210, d: 0 }
];
var PR = [['Лотос', 85, 1], ['Перец', 140, 0], ['Плющ', 60, 1]];

var stat = { sold: 0, built: 0 };
var QUESTS = [
  { t: 'Продай 10 блюд', r: 120, p: function () { return [stat.sold, 10]; } },
  { t: 'Поставь 2 машины', r: 200, p: function () { return [stat.built, 2]; } },
  { t: 'Изучи «Меню гостей»', r: 150, p: function () { return [T.shop.done ? 1 : 0, 1]; } },
  { t: 'Продай 100 блюд', r: 500, p: function () { return [stat.sold, 100]; } },
  { t: 'Изучи «Ускорение»', r: 400, p: function () { return [T.speed.done ? 1 : 0, 1]; } },
  { t: 'Накопи 3000 монет', r: 800, p: function () { return [Math.floor(coins), 3000]; } }
];

var coins = 1240, sci = 500, lvl = 3, xp = 0, qi = 0;
var F = { nodes: {}, wires: [], sel: null, tmp: null, pend: null, cnt: 0, ref: {}, dots: [], rot: 0 };
var tsel = null;
var resetArmed = false;
var QUIET = false;
var sales = [];
var floats = [];

function newBuf(t) { return t.r.map(function () { return 0; }); }
function addNode(type, x, y, id) {
  var t = TY[type];
  var k = id || (type + (++F.cnt));
  F.nodes[k] = { type: type, x: x, y: y, t: t.t, c: t.c, r: t.r, b: newBuf(t), p: 0, busy: false, why: '' };
  return k;
}
function freshF() { return { nodes: {}, wires: [], sel: null, tmp: null, pend: null, cnt: 0, ref: {}, dots: [], rot: 0 }; }

function defaultWorld() {
  F = freshF();
  addNode('well', 10, 60, 'well'); addNode('lotus', 190, 20, 'lotus'); addNode('pepper', 190, 150, 'pepper'); addNode('ivy', 190, 280, 'ivy');
  addNode('gen', 10, 420, 'gen'); addNode('mixer', 370, 60, 'mixer'); addNode('oven', 550, 120, 'oven'); addNode('market', 730, 120, 'market'); addNode('lab', 730, 290, 'lab');
  [['well', 0, 'lotus', 0], ['well', 0, 'pepper', 0], ['well', 0, 'ivy', 0], ['lotus', 1, 'mixer', 0], ['pepper', 1, 'mixer', 1], ['ivy', 1, 'mixer', 2], ['gen', 0, 'mixer', 3], ['gen', 0, 'oven', 1], ['mixer', 4, 'oven', 0], ['oven', 2, 'market', 0], ['oven', 2, 'lab', 0]].forEach(function (w) {
    F.wires.push({ a: w[0], ai: w[1], b: w[2], bi: w[3], q: [] });
  });
}

function hgt(n) { return 26 + n.r.length * 36 + 30; }
function py(n, i) { return n.y + 26 + i * 36 + 18; }
function missing(id) {
  var n = F.nodes[id];
  return n.r.some(function (r, i) {
    return r[0] === 'in' && !F.wires.some(function (w) { return w.b === id && w.bi === i; });
  });
}
function assignK() {
  var cnt = {};
  F.wires.forEach(function (w) { var k = cnt[w.b] || 0; cnt[w.b] = k + 1; w.k = k; if (!w.q) w.q = []; });
}
function wgeom(w) {
  var a = F.nodes[w.a], b = F.nodes[w.b];
  var x1 = a.x + NW, y1 = py(a, w.ai), x2 = b.x, y2 = py(b, w.bi);
  var xm = (x2 - x1 >= 30) ? x2 - 14 - (w.k || 0) * 5 : x1 + 20;
  var pts = [[x1, y1], [xm, y1], [xm, y2], [x2, y2]];
  var len = 0;
  for (var i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
  return { pts: pts, len: Math.max(len, 1) };
}
function pointAt(g, dist) {
  var pts = g.pts, d = dist;
  for (var i = 1; i < pts.length; i++) {
    var sl = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    if (d <= sl || i === pts.length - 1) {
      var t = sl ? Math.min(1, d / sl) : 1;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
    d -= sl;
  }
  return pts[pts.length - 1];
}

/* ---------- симуляция ---------- */
function xpNeed() { return 20 + lvl * 10; }
function addXP(n) {
  xp += n;
  while (xp >= xpNeed()) {
    xp -= xpNeed(); lvl++; coins += lvl * 50;
    if (!QUIET) toast('Уровень ' + lvl + '! +' + (lvl * 50) + ' монет');
  }
}
function cycTime(n) {
  var rc = TY[n.type].rec, m = 1;
  if (T.speed.done) m *= 1.25;
  if (rc.plant) { m *= 1.15; if (T.crystal.done) m *= 1.2; }
  return rc.cyc / m;
}
function floatText(x, y, txt, col) {
  if (QUIET || !F.topLayer) return;
  var e = el('text', { x: x, y: y, 'font-size': 14, fill: col, 'text-anchor': 'middle', 'font-weight': 'bold', stroke: '#0e1622', 'stroke-width': 3, 'paint-order': 'stroke' }, F.topLayer);
  e.textContent = txt;
  floats.push({ e: e, x: x, y: y, t: 0 });
}
function bump() {
  if (QUIET) return;
  var p = $('coin').parentNode;
  p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
}
function finish(id, n, rc) {
  (rc.out || []).forEach(function (x) { n.b[x[0]] += x[1]; });
  if (rc.sell) {
    var mult = 1 + 0.1 + (T.drone.done ? 0.15 : 0);
    var v = Math.round(rc.sell * mult);
    coins += v; stat.sold++; addXP(1);
    sales.push([performance.now(), v]);
    floatText(n.x + NW / 2, n.y - 4, '+' + v, '#ffd24a'); bump();
  }
  if (rc.sci) {
    sci += rc.sci;
    floatText(n.x + NW / 2, n.y - 4, '+' + rc.sci, '#19e6d0');
  }
  n.busy = false; n.p = 0;
}
function step(dt) {
  Object.keys(F.nodes).forEach(function (id) {
    var n = F.nodes[id], rc = TY[n.type].rec;
    if (!n.busy) {
      var okIn = true, why = '';
      (rc.inp || []).forEach(function (x) { if (n.b[x[0]] < x[1]) { okIn = false; if (!why) why = 'in:' + n.r[x[0]][1]; } });
      var room = true;
      (rc.out || []).forEach(function (x) { if (n.b[x[0]] + x[1] > CAP) room = false; });
      if (okIn && room) {
        (rc.inp || []).forEach(function (x) { n.b[x[0]] -= x[1]; });
        n.busy = true; n.p = 0; n.why = '';
      } else n.why = !okIn ? why : 'out';
    }
    if (n.busy) {
      n.p += dt / cycTime(n);
      if (n.p >= 1) finish(id, n, rc);
    }
  });
  var W = F.wires, cnt = W.length;
  if (!cnt) return;
  var order = W.slice().sort(function (x, y) { return (x.sent || 0) - (y.sent || 0); });
  for (var j = 0; j < cnt; j++) {
    var w = order[j], a = F.nodes[w.a], b = F.nodes[w.b];
    if (!a || !b) continue;
    var L = wgeom(w).len, sp = SPEED * dt / L;
    if (!w.q) w.q = [];
    for (var i = 0; i < w.q.length; i++) {
      var lim = i === 0 ? 1 : w.q[i - 1] - GAP / L;
      w.q[i] = Math.min(lim, w.q[i] + sp);
    }
    if (w.q.length && w.q[0] >= 1 && b.b[w.bi] < CAP) { w.q.shift(); b.b[w.bi]++; }
    if (a.b[w.ai] > 0 && b.b[w.bi] + w.q.length < CAP && (w.q.length === 0 || w.q[w.q.length - 1] > GAP / L)) { a.b[w.ai]--; w.q.push(0); w.sent = (w.sent || 0) + 1; }
  }
}
function simulate(secs) {
  QUIET = true;
  var steps = Math.ceil(Math.min(secs, OFFLINE_CAP) / 0.5);
  for (var i = 0; i < steps; i++) step(0.5);
  QUIET = false;
}
function rate() {
  var now = performance.now(), sum = 0;
  sales = sales.filter(function (s) { return now - s[0] < 10000; });
  sales.forEach(function (s) { sum += s[1]; });
  return sum / 10;
}

/* ---------- сохранение ---------- */
var saveTimer = null;
function save() {
  try {
    var nodes = {};
    Object.keys(F.nodes).forEach(function (id) {
      var n = F.nodes[id];
      nodes[id] = { type: n.type, x: n.x, y: n.y, b: n.b, p: n.p, busy: n.busy };
    });
    var tech = {};
    Object.keys(T).forEach(function (id) { tech[id] = { done: T[id].done ? 1 : 0, x: T[id].x, y: T[id].y }; });
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 2, coins: coins, sci: sci, lvl: lvl, xp: xp, qi: qi, stat: stat, savedAt: Date.now(),
      nodes: nodes,
      wires: F.wires.map(function (w) { return { a: w.a, ai: w.ai, b: w.b, bi: w.bi }; }),
      cnt: F.cnt, tech: tech, guests: G.map(function (g) { return g.d; })
    }));
  } catch (e) { /* storage unavailable */ }
}
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }

function load() {
  var raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
  if (!raw) return null;
  try {
    var s = JSON.parse(raw);
    if (!s || s.v !== 2) return null;
    coins = s.coins; sci = s.sci; lvl = s.lvl || 3; xp = s.xp || 0; qi = s.qi || 0;
    if (s.stat) stat = s.stat;
    F = freshF(); F.cnt = s.cnt || 0;
    Object.keys(s.nodes).forEach(function (id) {
      var n = s.nodes[id];
      if (!TY[n.type]) return;
      addNode(n.type, n.x, n.y, id);
      var m = F.nodes[id];
      if (n.b && n.b.length === m.b.length) m.b = n.b;
      m.p = n.p || 0; m.busy = !!n.busy;
    });
    F.wires = (s.wires || []).filter(function (w) { return F.nodes[w.a] && F.nodes[w.b]; }).map(function (w) { w.q = []; return w; });
    Object.keys(s.tech || {}).forEach(function (id) {
      if (T[id]) { T[id].done = s.tech[id].done ? 1 : 0; T[id].x = s.tech[id].x; T[id].y = s.tech[id].y; }
    });
    (s.guests || []).forEach(function (d, i) { if (G[i]) G[i].d = d; });
    return s;
  } catch (e) { return null; }
}

/* ---------- интерфейс ---------- */
var hudT = 0;
function hud() {
  $('coin').textContent = String(Math.floor(coins));
  $('sci').textContent = String(Math.floor(sci));
  $('inc').textContent = 'Ур. ' + lvl + ' · +' + (Math.round(rate() * 10) / 10) + '/с';
  $('xp').firstChild.style.width = Math.min(100, xp / xpNeed() * 100) + '%';
  updGoal();
}
var tt = null;
function toast(m) {
  var t = $('toast'); t.textContent = m; t.style.opacity = 1;
  clearTimeout(tt); tt = setTimeout(function () { t.style.opacity = 0; }, 2000);
}

function updGoal() {
  var q = QUESTS[qi], box = $('goal');
  if (!q) { box.querySelector('.gt').textContent = 'Все цели выполнены'; box.querySelector('.gbar i').style.width = '100%'; box.querySelector('.gn').textContent = ''; $('gclaim').style.display = 'none'; return; }
  var pr = q.p(), cur = Math.min(pr[0], pr[1]), done = pr[0] >= pr[1];
  box.querySelector('.gt').textContent = q.t;
  box.querySelector('.gbar i').style.width = (cur / pr[1] * 100) + '%';
  box.querySelector('.gn').textContent = cur + '/' + pr[1];
  var b = $('gclaim');
  b.style.display = done ? 'block' : 'none';
  b.textContent = 'Забрать +' + q.r;
  box.classList.toggle('ready', done);
  var tab = document.querySelector('#nav .tab:nth-child(4)');
  if (tab) tab.classList.toggle('dot', done);
}
function claimGoal() {
  var q = QUESTS[qi]; if (!q) return;
  var pr = q.p(); if (pr[0] < pr[1]) return;
  coins += q.r; qi++; toast('Цель выполнена: +' + q.r + ' монет'); bump(); hud(); save();
  if ($('p3').style.display !== 'none') ord();
}

function nodeState(id) {
  var n = F.nodes[id];
  if (n.busy) return { txt: 'Работает', col: n.c };
  if (missing(id)) return { txt: 'Нет провода', col: '#ff5a4d' };
  if (n.why === 'out') return { txt: 'Выход забит', col: '#ff5a4d' };
  if (n.why && n.why.indexOf('in:') === 0) return { txt: 'Ждёт: ' + n.why.slice(3), col: '#ff9a1f' };
  return { txt: 'Простой', col: '#6f8aa3' };
}

function renderF() {
  var s = $('fsc'); s.innerHTML = '';
  F.ref = {}; F.dots = [];
  assignK();
  var op0 = function (w) { var hot = F.sel && (w.a === F.sel || w.b === F.sel); return !F.sel ? 1 : (hot ? 1 : 0.15); };
  F.wires.forEach(function (w) {
    var a = F.nodes[w.a], col = a.r[w.ai][3], g = wgeom(w), p = g.pts;
    var d = 'M' + p[0][0] + ' ' + p[0][1] + ' H' + p[1][0] + ' V' + p[2][1] + ' H' + p[3][0];
    var op = op0(w);
    el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: op * 0.55 }, s);
    el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-dasharray': '1 15', opacity: op * 0.35, 'class': 'flow' }, s);
  });
  F.dotLayer = el('g', { style: 'pointer-events:none' }, s);
  Object.keys(F.nodes).forEach(function (id) {
    var n = F.nodes[id], h = hgt(n), warn = missing(id);
    var g = el('g', { 'data-n': id, style: 'cursor:pointer' }, s);
    var stroke = F.sel === id ? '#ffffff' : (warn ? '#ff9a1f' : '#2a3b52');
    var ref = { pips: [] };
    el('rect', { x: n.x, y: n.y, width: NW, height: h, rx: 4, fill: '#0e1622', stroke: stroke, 'stroke-width': F.sel === id ? 1.8 : 1.2 }, g);
    el('rect', { x: n.x + 1, y: n.y + 1, width: NW - 2, height: 25, rx: 3, fill: '#142031' }, g);
    ref.ic = el('rect', { x: n.x + 8, y: n.y + 7, width: 12, height: 12, rx: 3, fill: n.c }, g);
    el('text', { x: n.x + 27, y: n.y + 17, 'font-size': 12, fill: '#e8f1fa' }, g).textContent = n.t;
    if (warn) el('text', { x: n.x + NW - 10, y: n.y + 18, 'font-size': 14, fill: '#ff9a1f', 'text-anchor': 'end' }, g).textContent = '!';
    n.r.forEach(function (r, i) {
      var ry = n.y + 26 + i * 36, cy = py(n, i), isIn = r[0] === 'in';
      var live = isIn
        ? F.wires.some(function (w) { return w.b === id && w.bi === i; })
        : F.wires.some(function (w) { return w.a === id && w.ai === i; });
      var px0 = isIn ? n.x + 14 : n.x + NW - 14 - (CAP * 9 - 2);
      if (isIn) {
        el('rect', { x: n.x - 4, y: cy - 4, width: 8, height: 8, fill: live ? r[3] : '#0e1622', stroke: r[3], 'stroke-width': 1.5 }, g);
        el('text', { x: n.x + 14, y: ry + 16, 'font-size': 12, fill: '#cfe0f0' }, g).textContent = r[1];
        el('rect', { x: n.x + NW - 28, y: ry + 9, width: 18, height: 18, rx: 4, fill: '#1a2a40' }, g);
        el('rect', { x: n.x + NW - 23, y: ry + 14, width: 8, height: 8, rx: 2, fill: r[3] }, g);
        var act = F.tmp || F.pend;
        if (act && act.col === r[3] && act.id !== id) el('circle', { cx: n.x, cy: cy, r: 9, fill: 'none', stroke: r[3], 'stroke-width': 2 }, g);
        el('circle', { cx: n.x, cy: cy, r: 14, fill: '#fff', 'fill-opacity': 0.01, 'data-port': 'in', 'data-n': id, 'data-i': i }, g);
      } else {
        el('circle', { cx: n.x + NW, cy: cy, r: 4.5, fill: live ? r[3] : '#0e1622', stroke: r[3], 'stroke-width': 1.5 }, g);
        el('text', { x: n.x + NW - 14, y: ry + 16, 'font-size': 12, fill: '#cfe0f0', 'text-anchor': 'end' }, g).textContent = r[1];
        el('rect', { x: n.x + 10, y: ry + 9, width: 18, height: 18, rx: 4, fill: '#1a2a40' }, g);
        el('rect', { x: n.x + 15, y: ry + 14, width: 8, height: 8, rx: 2, fill: r[3] }, g);
        if (F.pend && F.pend.id === id && F.pend.i === i) el('circle', { cx: n.x + NW, cy: cy, r: 9, fill: 'none', stroke: r[3], 'stroke-width': 2 }, g);
        el('circle', { cx: n.x + NW, cy: cy, r: 14, fill: '#fff', 'fill-opacity': 0.01, 'data-port': 'out', 'data-n': id, 'data-i': i }, g);
      }
      var row = [];
      for (var j = 0; j < CAP; j++) row.push(el('rect', { x: px0 + j * 9, y: ry + 23, width: 7, height: 6, rx: 1.5, fill: j < n.b[i] ? r[3] : '#1a2a40' }, g));
      ref.pips.push(row);
    });
    ref.st = el('text', { x: n.x + 10, y: n.y + h - 16, 'font-size': 11, fill: '#6f8aa3' }, g);
    el('rect', { x: n.x + 8, y: n.y + h - 10, width: NW - 16, height: 4, rx: 2, fill: '#1a2a40' }, g);
    ref.bar = el('rect', { x: n.x + 8, y: n.y + h - 10, width: 0, height: 4, rx: 2, fill: n.c }, g);
    F.ref[id] = ref;
  });
  if (F.tmp) {
    var t = F.tmp, xm = (t.x + t.sx) / 2;
    el('path', { d: 'M' + t.sx + ' ' + t.sy + ' H' + xm + ' V' + t.y + ' H' + t.x, fill: 'none', stroke: t.col, 'stroke-width': 2.4, 'stroke-dasharray': '6 5' }, s);
  }
  F.topLayer = el('g', { style: 'pointer-events:none' }, s);
  floats = floats.filter(function (f) { if (f.e.parentNode) { F.topLayer.appendChild(f.e); return true; } return false; });
  updDyn();
}

function updDyn() {
  Object.keys(F.ref).forEach(function (id) {
    var n = F.nodes[id], r = F.ref[id];
    if (!n) return;
    var st = nodeState(id);
    r.bar.setAttribute('width', (NW - 16) * (n.busy ? Math.min(1, n.p) : 0));
    r.bar.setAttribute('fill', st.col);
    r.st.textContent = st.txt; r.st.setAttribute('fill', st.col);
    r.ic.setAttribute('class', n.busy ? 'busy' : '');
    r.pips.forEach(function (row, i) {
      var v = n.b[i], col = n.r[i][3];
      row.forEach(function (pip, j) { pip.setAttribute('fill', j < v ? col : '#1a2a40'); });
    });
  });
  var idx = 0;
  F.wires.forEach(function (w) {
    if (!F.nodes[w.a] || !F.nodes[w.b]) return;
    var g = wgeom(w), col = F.nodes[w.a].r[w.ai][3];
    (w.q || []).forEach(function (p) {
      var pt = pointAt(g, p * g.len);
      var c = F.dots[idx] || (F.dots[idx] = el('circle', { r: 4.4, stroke: '#fff', 'stroke-width': 0.9 }, F.dotLayer));
      c.setAttribute('cx', pt[0]); c.setAttribute('cy', pt[1]); c.setAttribute('fill', col); c.style.display = '';
      idx++;
    });
  });
  for (; idx < F.dots.length; idx++) F.dots[idx].style.display = 'none';
}
function updFloats(dt) {
  floats = floats.filter(function (f) {
    f.t += dt;
    if (f.t > 1.1) { if (f.e.parentNode) f.e.parentNode.removeChild(f.e); return false; }
    f.e.setAttribute('y', f.y - f.t * 34); f.e.setAttribute('opacity', Math.max(0, 1 - f.t / 1.1));
    return true;
  });
}

function tstate(id) {
  var n = T[id];
  if (n.done) return 'done';
  return n.pre.every(function (p) { return T[p].done; }) ? 'open' : 'locked';
}
function renderT() {
  var s = $('tsc'); s.innerHTML = '';
  Object.keys(T).forEach(function (id) {
    var b = T[id];
    b.pre.forEach(function (pid, k) {
      var a = T[pid], x1 = a.x + NW, y1 = a.y + 39, x2 = b.x, y2 = b.y + 39;
      var xm = (x2 - x1 >= 30) ? x2 - 14 - k * 6 : x1 + 20;
      var d = 'M' + x1 + ' ' + y1 + ' H' + xm + ' V' + y2 + ' H' + x2;
      var col = a.done && b.done ? '#19e6d0' : (a.done ? '#ff9a1f' : '#3a4a60');
      var hot = tsel && (tsel === id || tsel === pid), op = !tsel ? 1 : (hot ? 1 : 0.2);
      el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: op }, s);
      if (a.done) el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-dasharray': '1 15', opacity: op * 0.8, 'class': 'flow' }, s);
    });
  });
  Object.keys(T).forEach(function (id) {
    var n = T[id], q = tstate(id);
    var edge = tsel === id ? '#ffffff' : (q === 'done' ? '#19e6d0' : (q === 'open' ? '#ff9a1f' : '#2a3b52'));
    var ac = q === 'done' ? '#19e6d0' : (q === 'open' ? '#ff9a1f' : '#4a5c72');
    var g = el('g', { 'data-n': id, style: 'cursor:pointer' }, s);
    el('rect', { x: n.x, y: n.y, width: NW, height: 78, rx: 4, fill: '#0e1622', stroke: edge, 'stroke-width': tsel === id ? 1.8 : 1.2 }, g);
    el('rect', { x: n.x + 1, y: n.y + 1, width: NW - 2, height: 25, rx: 3, fill: '#142031' }, g);
    el('rect', { x: n.x + 8, y: n.y + 7, width: 12, height: 12, rx: 3, fill: ac }, g);
    el('text', { x: n.x + 27, y: n.y + 17, 'font-size': 12, fill: q === 'locked' ? '#7f94a9' : '#e8f1fa' }, g).textContent = n.t;
    el('text', { x: n.x + 10, y: n.y + 44, 'font-size': 11, fill: '#8fa7bd' }, g).textContent = n.e;
    el('text', { x: n.x + 10, y: n.y + 62, 'font-size': 11, fill: ac }, g).textContent = q === 'done' ? 'Изучено' : (n.cost + ' науки');
    if (q === 'open') {
      el('rect', { x: n.x + 8, y: n.y + 68, width: NW - 16, height: 4, rx: 2, fill: '#1a2a40' }, g);
      el('rect', { x: n.x + 8, y: n.y + 68, width: (NW - 16) * Math.min(1, sci / n.cost), height: 4, rx: 2, fill: '#ff9a1f' }, g);
    }
    if (n.pre.length) el('rect', { x: n.x - 4, y: n.y + 35, width: 8, height: 8, fill: ac }, g);
    el('circle', { cx: n.x + NW, cy: n.y + 39, r: 4.5, fill: ac }, g);
  });
}
function tsheet() {
  var sh = $('tsheet');
  if (!tsel) { sh.style.display = 'none'; return; }
  var n = T[tsel], q = tstate(tsel), b = $('tb'), d = $('td');
  sh.style.display = 'block'; $('tn').textContent = n.t;
  if (q === 'done') {
    d.textContent = n.e + ' · изучено'; b.textContent = 'Готово'; b.style.background = '#12352f'; b.style.color = '#19e6d0';
  } else if (q === 'open') {
    var can = sci >= n.cost;
    d.textContent = n.e + ' · ' + Math.floor(sci) + '/' + n.cost + ' науки'; b.textContent = can ? 'Изучить' : 'Мало науки';
    b.style.background = can ? '#ff9a1f' : '#2a3b52'; b.style.color = can ? '#2a1800' : '#8fa7bd';
  } else {
    var need = n.pre.filter(function (p) { return !T[p].done; }).map(function (p) { return T[p].t; }).join(', ');
    d.textContent = 'Сначала: ' + need; b.textContent = 'Закрыто'; b.style.background = '#1a2a40'; b.style.color = '#6f8aa3';
  }
}

function bind(svg, vb, cb) {
  var d = null;
  var ptrs = {};
  var pinch = null;
  function setVB() { svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); }
  function fit() {
    if (!svg.clientWidth || !svg.clientHeight) return;
    vb.h = vb.w * svg.clientHeight / svg.clientWidth; setVB();
  }
  function wpt(cx, cy) {
    var p = svg.createSVGPoint(); p.x = cx; p.y = cy;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function snap(v) { return Math.round(v / 10) * 10; }
  function zoomAt(cx, cy, f) {
    var p = wpt(cx, cy);
    var nw = Math.min(1400, Math.max(220, vb.w * f)), s = nw / vb.w;
    vb.x = p.x - (p.x - vb.x) * s; vb.y = p.y - (p.y - vb.y) * s;
    vb.w = nw; vb.h = vb.h * s; setVB();
  }
  function applyDrag(cx, cy) {
    var p = wpt(cx, cy);
    if (d.mode === 'wire') cb.wireMove(p);
    else if (d.mode === 'node') cb.move(d.id, snap(p.x + d.ox), snap(p.y + d.oy));
  }
  function auto() {
    if (!d || !d.last || (d.mode !== 'wire' && d.mode !== 'node') || !d.moved) { if (d) d.raf = 0; return; }
    var r = svg.getBoundingClientRect(), m = 48, x = d.last.x, y = d.last.y, vx = 0, vy = 0;
    if (x < r.left + m) vx = x - (r.left + m); else if (x > r.right - m) vx = x - (r.right - m);
    if (y < r.top + m) vy = y - (r.top + m); else if (y > r.bottom - m) vy = y - (r.bottom - m);
    if (vx || vy) {
      var k = vb.w / svg.clientWidth;
      vb.x += Math.max(-m, Math.min(m, vx)) / m * 12 * k;
      vb.y += Math.max(-m, Math.min(m, vy)) / m * 12 * k;
      setVB(); applyDrag(d.last.x, d.last.y);
    }
    d.raf = requestAnimationFrame(auto);
  }
  function cancelDrag() {
    if (d && d.raf) cancelAnimationFrame(d.raf);
    if (d && d.mode === 'wire') { cb.wireCancel(); }
    d = null;
  }
  svg.addEventListener('pointerdown', function (e) {
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    svg.setPointerCapture(e.pointerId);
    var ids = Object.keys(ptrs);
    if (ids.length === 2) {
      cancelDrag();
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, w: vb.w, h: vb.h, x: vb.x, y: vb.y, mid: wpt((a.x + b.x) / 2, (a.y + b.y) / 2) };
      return;
    }
    if (ids.length > 2) return;
    var pe = cb.wire && e.target.closest ? e.target.closest('[data-port]') : null;
    var ne = e.target.closest ? e.target.closest('[data-n]') : null;
    var id = ne ? ne.getAttribute('data-n') : null;
    d = { sx: e.clientX, sy: e.clientY, last: { x: e.clientX, y: e.clientY }, moved: false, id: id, vx: vb.x, vy: vb.y, mode: 'pan', pe: pe, raf: 0 };
    if (pe) { d.mode = 'wire'; cb.wireStart(pe); }
    else if (id) { d.mode = 'node'; var p0 = cb.pos(id), w0 = wpt(e.clientX, e.clientY); d.ox = p0[0] - w0.x; d.oy = p0[1] - w0.y; }
    svg.style.cursor = 'grabbing';
  });
  svg.addEventListener('pointermove', function (e) {
    if (ptrs[e.pointerId]) { ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY; }
    if (pinch) {
      var ids = Object.keys(ptrs);
      if (ids.length >= 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        var s = pinch.dist / (Math.hypot(a.x - b.x, a.y - b.y) || 1);
        var nw = Math.min(1400, Math.max(220, pinch.w * s)), r = nw / pinch.w;
        vb.w = nw; vb.h = pinch.h * r;
        vb.x = pinch.mid.x - (pinch.mid.x - pinch.x) * r; vb.y = pinch.mid.y - (pinch.mid.y - pinch.y) * r;
        setVB();
      }
      return;
    }
    if (!d) return;
    d.last = { x: e.clientX, y: e.clientY };
    var dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.sqrt(dx * dx + dy * dy) > 4) {
      d.moved = true;
      if (d.mode === 'wire' || d.mode === 'node') d.raf = requestAnimationFrame(auto);
    }
    if (!d.moved) return;
    if (d.mode === 'pan') {
      var k = vb.w / svg.clientWidth;
      vb.x = d.vx - dx * k; vb.y = d.vy - dy * k; setVB();
    } else applyDrag(e.clientX, e.clientY);
  });
  function release(e) {
    delete ptrs[e.pointerId];
    if (pinch) { if (Object.keys(ptrs).length < 2) pinch = null; d = null; svg.style.cursor = 'grab'; return; }
    if (!d) return;
    if (d.raf) cancelAnimationFrame(d.raf);
    if (d.mode === 'wire') cb.wireEnd(document.elementFromPoint(e.clientX, e.clientY), d.moved, d.pe);
    else if (!d.moved) cb.tap(d.id);
    else if (d.mode === 'node') saveSoon();
    d = null; svg.style.cursor = 'grab';
  }
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', function (e) {
    delete ptrs[e.pointerId];
    if (Object.keys(ptrs).length < 2) pinch = null;
    cancelDrag(); svg.style.cursor = 'grab';
  });
  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.12 : 0.89);
  }, { passive: false });
  return {
    fit: fit,
    zoom: function (f) {
      var cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
      var nw = Math.min(1400, Math.max(220, vb.w * f)), r = nw / vb.w;
      vb.w = nw; vb.h = vb.h * r; vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2; setVB();
    },
    reset: function (h) { vb.x = h.x; vb.y = h.y; vb.w = h.w; vb.h = h.h; fit(); }
  };
}



function connect(src, bid, bi) {
  var bn = F.nodes[bid];
  if (!bn || bid === src.id || bn.r[bi][0] !== 'in' || bn.r[bi][3] !== src.col) return false;
  F.wires = F.wires.filter(function (w) { return !(w.b === bid && w.bi === bi); });
  F.wires.push({ a: src.id, ai: src.i, b: bid, bi: bi, q: [] });
  saveSoon();
  return true;
}

var fvb = { x: 130, y: -50, w: 400, h: 470 }, fhome = { x: 130, y: -50, w: 400, h: 470 };
var tvb = { x: 0, y: 30, w: 400, h: 470 }, thome = { x: 0, y: 30, w: 400, h: 470 };
var fb, tb2;

function initGraphs() {
  fb = bind($('fs'), fvb, {
    wire: true,
    pos: function (id) { return [F.nodes[id].x, F.nodes[id].y]; },
    move: function (id, x, y) { F.nodes[id].x = x; F.nodes[id].y = y; renderF(); },
    tap: function (id) { F.pend = null; F.sel = (id && F.sel !== id) ? id : null; renderF(); },
    wireStart: function (pe) {
      if (pe.getAttribute('data-port') !== 'out') return;
      var id = pe.getAttribute('data-n'), i = +pe.getAttribute('data-i'), n = F.nodes[id];
      F.tmp = { id: id, i: i, col: n.r[i][3], sx: n.x + NW, sy: py(n, i), x: n.x + NW, y: py(n, i) };
      renderF();
    },
    wireMove: function (p) { if (F.tmp) { F.tmp.x = p.x; F.tmp.y = p.y; renderF(); } },
    wireCancel: function () { F.tmp = null; renderF(); },
    wireEnd: function (target, moved, pe) {
      var kind = pe.getAttribute('data-port');
      var pid = pe.getAttribute('data-n'), pi = +pe.getAttribute('data-i');
      if (kind === 'in') {
        F.tmp = null;
        if (!moved) {
          if (F.pend) {
            if (!connect(F.pend, pid, pi)) toast('Цвета не совпадают');
            else F.pend = null;
          } else {
            F.wires = F.wires.filter(function (w) { return !(w.b === pid && w.bi === pi); });
            saveSoon();
          }
        }
        renderF(); hud(); return;
      }
      var t = F.tmp; F.tmp = null;
      if (!moved) {
        var same = F.pend && F.pend.id === pid && F.pend.i === pi;
        F.pend = same ? null : { id: pid, i: pi, col: F.nodes[pid].r[pi][3] };
        if (F.pend) toast('Теперь тапните вход того же цвета');
      } else if (t && target && target.closest) {
        var te = target.closest('[data-port="in"]');
        if (te) connect(t, te.getAttribute('data-n'), +te.getAttribute('data-i'));
        F.pend = null;
      }
      renderF(); hud();
    }
  });
  tb2 = bind($('ts'), tvb, {
    wire: false,
    pos: function (id) { return [T[id].x, T[id].y]; },
    move: function (id, x, y) { T[id].x = x; T[id].y = y; renderT(); },
    tap: function (id) { tsel = (id && tsel !== id) ? id : null; renderT(); tsheet(); }
  });
  $('fzi').addEventListener('click', function () { fb.zoom(0.8); });
  $('fzo').addEventListener('click', function () { fb.zoom(1.25); });
  $('fzh').addEventListener('click', function () { fb.reset(fhome); });
  $('gclaim').addEventListener('click', claimGoal);
  $('tb').addEventListener('click', function () {
    if (!tsel) return;
    var n = T[tsel];
    if (tstate(tsel) === 'open' && sci >= n.cost) {
      sci -= n.cost; n.done = 1; hud(); renderT(); tsheet(); toast('Изучено: ' + n.t); save();
    }
  });
}

function cat() {
  var p = $('p1'); p.innerHTML = '';
  var h = document.createElement('div'); h.className = 'sub'; h.textContent = 'Каталог машин'; p.appendChild(h);
  var grid = document.createElement('div'); grid.className = 'grid2';
  Object.keys(TY).forEach(function (k) {
    var t = TY[k];
    var c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div class="rowc" style="gap:8px"><div style="width:12px;height:12px;border-radius:3px;background:' + t.c + '"></div><div style="font-size:12px">' + t.t + '</div></div><div style="font-size:11px;color:#8fa7bd;margin:6px 0 8px">' + t.d + '</div>';
    var b = document.createElement('button'); b.className = 'btn'; b.style.width = '100%'; b.textContent = 'Купить · ' + t.cost;
    b.addEventListener('click', function () {
      if (coins < t.cost) { b.textContent = 'Мало монет'; setTimeout(function () { b.textContent = 'Купить · ' + t.cost; }, 900); return; }
      coins -= t.cost; stat.built++;
      var id = addNode(k, Math.round((fvb.x + 30) / 10) * 10, Math.round((fvb.y + 30 + (F.cnt % 6) * 40) / 10) * 10);
      F.sel = id; renderF(); hud(); show(0); toast('Поставлено: ' + t.t + '. Соедините провода'); save();
    });
    c.appendChild(b); grid.appendChild(c);
  });
  p.appendChild(grid);
}

function ord() {
  var p = $('p3'); p.innerHTML = '';
  var h0 = document.createElement('div'); h0.className = 'sub'; h0.textContent = 'Цели'; p.appendChild(h0);
  QUESTS.forEach(function (q, i) {
    if (i < qi - 1) return;
    var pr = q.p(), cur = Math.min(pr[0], pr[1]);
    var c = document.createElement('div'); c.className = 'card'; c.style.marginBottom = '6px';
    var isDone = i < qi, active = i === qi;
    if (isDone) c.style.opacity = '0.5';
    if (i > qi + 1) c.style.opacity = '0.45';
    c.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:12px"><span>' + (isDone ? '✓ ' : '') + q.t + '</span><span style="color:#ffd24a">+' + q.r + '</span></div>' +
      '<div class="gbar" style="margin-top:8px"><i style="width:' + (isDone ? 100 : cur / pr[1] * 100) + '%"></i></div>';
    p.appendChild(c);
  });
  var h = document.createElement('div'); h.className = 'sub'; h.textContent = 'Гости ресторана'; p.appendChild(h);
  G.forEach(function (g) {
    var c = document.createElement('div'); c.className = 'card rowc'; c.style.marginBottom = '8px';
    c.innerHTML = '<div style="width:34px;height:34px;border-radius:50%;background:#b79cff;flex:none"></div><div class="grow"><div style="font-size:12px">' + g.n + '</div><div style="font-size:11px;color:#8fa7bd">' + g.w + '</div></div>';
    var b = document.createElement('button'); b.className = 'btn';
    b.textContent = g.d ? 'Готово' : 'Отдать · ' + g.r;
    if (g.d) { b.style.background = '#12352f'; b.style.color = '#19e6d0'; }
    b.addEventListener('click', function () {
      if (g.d) return; g.d = 1; coins += g.r; bump(); hud(); ord(); toast('+' + g.r + ' монет'); save();
    });
    c.appendChild(b); p.appendChild(c);
  });
  var h2 = document.createElement('div'); h2.className = 'sub'; h2.textContent = 'Цены на рынке'; p.appendChild(h2);
  PR.forEach(function (r) {
    var row = document.createElement('div'); row.className = 'card'; row.style.cssText += ';display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px';
    row.innerHTML = '<span>' + r[0] + '</span><span style="color:' + (r[2] ? '#19e6d0' : '#ff7d6b') + '">' + r[1] + (r[2] ? ' ▲' : ' ▼') + '</span>';
    p.appendChild(row);
  });
}

function base() {
  var p = $('p4'); p.innerHTML = '';
  var st = [['Уровень', lvl], ['Продано блюд', stat.sold], ['Машин', Object.keys(F.nodes).length], ['Планета', 'Мята']];
  var grid = document.createElement('div'); grid.className = 'grid2';
  st.forEach(function (s) {
    var c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div style="font-size:11px;color:#8fa7bd">' + s[0] + '</div><div style="font-size:18px;margin-top:2px">' + s[1] + '</div>';
    grid.appendChild(c);
  });
  p.appendChild(grid);
  var xc = document.createElement('div'); xc.className = 'card'; xc.style.marginTop = '8px';
  xc.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:11px;color:#8fa7bd"><span>Опыт до уровня ' + (lvl + 1) + '</span><span>' + xp + '/' + xpNeed() + '</span></div><div class="gbar" style="margin-top:8px"><i style="width:' + Math.min(100, xp / xpNeed() * 100) + '%"></i></div>';
  p.appendChild(xc);
  var h = document.createElement('div'); h.className = 'sub'; h.textContent = 'Жители'; p.appendChild(h);
  [['Мира · садовница', 'Грядки быстрее на 15%', '#3fd3a0'], ['Тоб · повар', 'Блюда дороже на 10%', '#ffb347']].forEach(function (r) {
    var c = document.createElement('div'); c.className = 'card rowc'; c.style.marginBottom = '6px';
    c.innerHTML = '<div style="width:30px;height:30px;border-radius:50%;background:' + r[2] + ';flex:none"></div><div><div style="font-size:12px">' + r[0] + '</div><div style="font-size:11px;color:#8fa7bd">' + r[1] + '</div></div>';
    p.appendChild(c);
  });
  var rs = document.createElement('button'); rs.className = 'btn'; rs.style.cssText += ';width:100%;margin-top:18px;background:#1a2a40;color:#8fa7bd';
  rs.textContent = resetArmed ? 'Нажмите ещё раз: сбросить всё' : 'Сбросить прогресс';
  rs.addEventListener('click', function () {
    if (!resetArmed) { resetArmed = true; base(); setTimeout(function () { resetArmed = false; if ($('p4').style.display !== 'none') base(); }, 3000); return; }
    resetArmed = false;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    location.reload();
  });
  p.appendChild(rs);
}

var NAV = [['factory', 'Поле'], ['box', 'Каталог'], ['flask', 'Наука'], ['receipt', 'Цели'], ['home', 'База']];
function show(k) {
  for (var i = 0; i < 5; i++) $('p' + i).style.display = (i === k) ? 'block' : 'none';
  if (k === 0) fb.fit();
  if (k === 1) cat();
  if (k === 2) { tb2.fit(); renderT(); tsheet(); }
  if (k === 3) ord();
  if (k === 4) base();
  var nav = $('nav'); nav.innerHTML = '';
  NAV.forEach(function (n, i) {
    var b = document.createElement('div');
    b.className = 'tab' + (i === k ? ' on' : '');
    b.innerHTML = ic(n[0], 20) + n[1];
    b.addEventListener('click', function () { show(i); });
    nav.appendChild(b);
  });
  updGoal();
}

function init() {
  $('ic-coin').innerHTML = ic('coin', 17, '#ffd24a');
  $('ic-flask').innerHTML = ic('flask', 17, '#19e6d0');
  $('fzi').innerHTML = ic('plus', 18);
  $('fzo').innerHTML = ic('minus', 18);
  $('fzh').innerHTML = ic('home', 18, '#ff9a1f');

  defaultWorld();
  var saved = load();
  initGraphs();
  var c0 = coins, s0 = sci;
  if (!saved) {
    simulate(25);
    coins = c0; sci = s0; lvl = 3; xp = 0; stat.sold = 0; sales = [];
  }
  if (saved && saved.savedAt) {
    var secs = (Date.now() - saved.savedAt) / 1000;
    if (secs > 30) simulate(secs);
  }
  renderF(); renderT(); show(0); hud();
  if (coins - c0 > 0 || sci - s0 > 0) toast('Пока вас не было: +' + Math.floor(coins - c0) + ' монет, +' + Math.floor(sci - s0) + ' науки');

  var last = performance.now(), acc = 0, saveAcc = 0;
  function frame(t) {
    var raw = (t - last) / 1000; last = t;
    if (raw > 2) {
      var cb0 = coins, sb0 = sci;
      simulate(raw); renderF();
      if (coins - cb0 > 0 || sci - sb0 > 0) toast('Пока вас не было: +' + Math.floor(coins - cb0) + ' монет, +' + Math.floor(sci - sb0) + ' науки');
      raw = 0.016;
    }
    var dt = Math.min(0.25, raw);
    acc += dt;
    while (acc >= 0.1) { step(0.1); acc -= 0.1; }
    updDyn(); updFloats(dt);
    hudT += dt; if (hudT > 0.25) { hudT = 0; hud(); }
    saveAcc += dt; if (saveAcc > 5) { saveAcc = 0; save(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', function () { fb.fit(); tb2.fit(); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache optional */ });
  }
}

init();
})();
