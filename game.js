(function () {
var NS = 'http://www.w3.org/2000/svg';
var SAVE_KEY = 'cosmic-garden-v1';
var OFFLINE_CAP = 8 * 3600;
var NW = 150;
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

var TY = {
  well: { t: 'Колодец', c: C.w, f: 0.8, cost: 40, d: 'Даёт воду', r: [['out', 'Вода', '30/с', C.w]] },
  lotus: { t: 'Грядка лотоса', c: C.l, f: 0.6, cost: 60, d: 'Растит лотос', r: [['in', 'Вода', '14/с', C.w], ['out', 'Лотос', '14/с', C.l]] },
  pepper: { t: 'Грядка перца', c: C.p, f: 0.45, cost: 60, d: 'Растит перец', r: [['in', 'Вода', '10/с', C.w], ['out', 'Перец', '10/с', C.p]] },
  ivy: { t: 'Грядка плюща', c: C.i, f: 0.8, cost: 70, d: 'Растит плющ', r: [['in', 'Вода', '18/с', C.w], ['out', 'Плющ', '18/с', C.i]] },
  gen: { t: 'Генератор', c: C.e, f: 0.7, cost: 150, d: 'Даёт энергию', r: [['out', 'Энергия', '120 кВт', C.e]] },
  mixer: { t: 'Смеситель', c: C.m, f: 0.78, cost: 200, d: 'Смешивает плоды', r: [['in', 'Лотос', '14/с', C.l], ['in', 'Перец', '6/с', C.p], ['in', 'Плющ', '18/с', C.i], ['in', 'Энергия', '40 кВт', C.e], ['out', 'Смесь', '26/с', C.m]] },
  oven: { t: 'Печь', c: C.d, f: 0.55, cost: 250, d: 'Готовит блюда', r: [['in', 'Смесь', '26/с', C.m], ['in', 'Энергия', '60 кВт', C.e], ['out', 'Блюдо', '18/с', C.d]] },
  market: { t: 'Рынок', c: C.c, cost: 300, d: 'Продаёт блюда', r: [['in', 'Блюдо', '12/с', C.d], ['out', 'Монеты', '', C.c]] },
  lab: { t: 'Лаборатория', c: C.s, f: 0.3, cost: 400, d: 'Даёт науку', r: [['in', 'Блюдо', '6/с', C.d], ['out', 'Наука', '', C.s]] }
};

var T = {
  base: { x: 10, y: 190, t: 'Основы', e: 'Грядки и конвейеры', cost: 0, pre: [], done: 1 },
  hybrid: { x: 190, y: 70, t: 'Гибриды', e: 'Скрещивание растений', cost: 0, pre: ['base'], done: 1 },
  water: { x: 190, y: 190, t: 'Автополив', e: 'Колодцы и трубы', cost: 0, pre: ['base'], done: 1 },
  shop: { x: 190, y: 310, t: 'Меню гостей', e: 'Заказы от гостей', cost: 80, pre: ['base'] },
  speed: { x: 370, y: 70, t: 'Ускорение', e: 'Доход выше на 25%', cost: 120, pre: ['hybrid'] },
  crystal: { x: 370, y: 190, t: 'Теплицы', e: 'Грядки размером 2×2', cost: 300, pre: ['water'] },
  drone: { x: 370, y: 310, t: 'Дроны-пчёлы', e: 'Авто-сбор урожая', cost: 260, pre: ['shop'] },
  planet: { x: 550, y: 130, t: 'Новые планеты', e: 'Вторая планета', cost: 900, pre: ['speed', 'crystal'] }
};

var G = [
  { n: 'Ферн · туманник', w: 'Лёгкое и пряное', r: 320, d: 0 },
  { n: 'Крис · кристаллоид', w: 'Хрустящее и холодное', r: 450, d: 0 },
  { n: 'Омо · странник', w: 'Что-нибудь сладкое', r: 210, d: 0 }
];
var PR = [['Лотос', 85, 1], ['Перец', 140, 0], ['Плющ', 60, 1]];

var coins = 1240, sci = 755, lvl = 3;
var F = { nodes: {}, wires: [], sel: null, tmp: null, pend: null, cnt: 0 };
var tsel = null;
var resetArmed = false;

function addNode(type, x, y, id) {
  var t = TY[type];
  var k = id || (type + (++F.cnt));
  F.nodes[k] = { type: type, x: x, y: y, t: t.t, c: t.c, f: t.f == null ? null : t.f, r: t.r };
  return k;
}

function defaultWorld() {
  F = { nodes: {}, wires: [], sel: null, tmp: null, pend: null, cnt: 0 };
  addNode('well', 10, 60, 'well'); addNode('lotus', 190, 20, 'lotus'); addNode('pepper', 190, 150, 'pepper'); addNode('ivy', 190, 280, 'ivy');
  addNode('gen', 10, 420, 'gen'); addNode('mixer', 370, 60, 'mixer'); addNode('oven', 550, 120, 'oven'); addNode('market', 730, 120, 'market'); addNode('lab', 730, 290, 'lab');
  [['well', 0, 'lotus', 0], ['well', 0, 'pepper', 0], ['well', 0, 'ivy', 0], ['lotus', 1, 'mixer', 0], ['pepper', 1, 'mixer', 1], ['ivy', 1, 'mixer', 2], ['gen', 0, 'mixer', 3], ['gen', 0, 'oven', 1], ['mixer', 4, 'oven', 0], ['oven', 2, 'market', 0], ['oven', 2, 'lab', 0]].forEach(function (w) {
    F.wires.push({ a: w[0], ai: w[1], b: w[2], bi: w[3] });
  });
}

function hgt(n) { return 26 + n.r.length * 36 + (n.f != null ? 16 : 6); }
function py(n, i) { return n.y + 26 + i * 36 + 18; }
function missing(id) {
  var n = F.nodes[id];
  return n.r.some(function (r, i) {
    return r[0] === 'in' && !F.wires.some(function (w) { return w.b === id && w.bi === i; });
  });
}
function calc() {
  var inc = 0, si = 0;
  Object.keys(F.nodes).forEach(function (id) {
    var n = F.nodes[id];
    var wired = F.wires.some(function (w) { return w.b === id && w.bi === 0; });
    if (n.type === 'market' && wired) inc += 6;
    if (n.type === 'lab' && wired) si += 1;
  });
  var b = T.speed.done ? 1.25 : 1;
  return [inc * b, si * b];
}

var saveTimer = null;
function save() {
  try {
    var nodes = {};
    Object.keys(F.nodes).forEach(function (id) { var n = F.nodes[id]; nodes[id] = { type: n.type, x: n.x, y: n.y }; });
    var tech = {};
    Object.keys(T).forEach(function (id) { tech[id] = { done: T[id].done ? 1 : 0, x: T[id].x, y: T[id].y }; });
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 1, coins: coins, sci: sci, lvl: lvl, savedAt: Date.now(),
      nodes: nodes, wires: F.wires, cnt: F.cnt, tech: tech,
      guests: G.map(function (g) { return g.d; })
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
    if (!s || s.v !== 1) return null;
    coins = s.coins; sci = s.sci; lvl = s.lvl || 3;
    F = { nodes: {}, wires: [], sel: null, tmp: null, pend: null, cnt: s.cnt || 0 };
    Object.keys(s.nodes).forEach(function (id) {
      var n = s.nodes[id];
      if (TY[n.type]) addNode(n.type, n.x, n.y, id);
    });
    F.wires = (s.wires || []).filter(function (w) { return F.nodes[w.a] && F.nodes[w.b]; });
    Object.keys(s.tech || {}).forEach(function (id) {
      if (T[id]) { T[id].done = s.tech[id].done ? 1 : 0; T[id].x = s.tech[id].x; T[id].y = s.tech[id].y; }
    });
    (s.guests || []).forEach(function (d, i) { if (G[i]) G[i].d = d; });
    return s;
  } catch (e) { return null; }
}

function hud() {
  $('coin').textContent = String(Math.floor(coins));
  $('sci').textContent = String(Math.floor(sci));
  var c = calc();
  $('inc').textContent = '+' + (Math.round(c[0] * 10) / 10) + ' монет/с';
}
var tt = null;
function toast(m) {
  var t = $('toast'); t.textContent = m; t.style.opacity = 1;
  clearTimeout(tt); tt = setTimeout(function () { t.style.opacity = 0; }, 1800);
}

function renderF() {
  var s = $('fsc'); s.innerHTML = '';
  var cnt = {};
  F.wires.forEach(function (w) {
    var a = F.nodes[w.a], b = F.nodes[w.b], col = a.r[w.ai][3];
    var k = cnt[w.b] || 0; cnt[w.b] = k + 1;
    var x1 = a.x + NW, y1 = py(a, w.ai), x2 = b.x, y2 = py(b, w.bi);
    var xm = (x2 - x1 >= 30) ? x2 - 14 - k * 5 : x1 + 20;
    var d = 'M' + x1 + ' ' + y1 + ' H' + xm + ' V' + y2 + ' H' + x2;
    var hot = F.sel && (w.a === F.sel || w.b === F.sel);
    var op = !F.sel ? 1 : (hot ? 1 : 0.15);
    el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity: op }, s);
    el('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-dasharray': '1 15', opacity: op * 0.8, 'class': 'flow' }, s);
  });
  Object.keys(F.nodes).forEach(function (id) {
    var n = F.nodes[id], h = hgt(n), warn = missing(id);
    var g = el('g', { 'data-n': id, style: 'cursor:pointer' }, s);
    var stroke = F.sel === id ? '#ffffff' : (warn ? '#ff9a1f' : '#2a3b52');
    el('rect', { x: n.x, y: n.y, width: NW, height: h, rx: 4, fill: '#0e1622', stroke: stroke, 'stroke-width': F.sel === id ? 1.8 : 1.2 }, g);
    el('rect', { x: n.x + 1, y: n.y + 1, width: NW - 2, height: 25, rx: 3, fill: '#142031' }, g);
    el('rect', { x: n.x + 8, y: n.y + 7, width: 12, height: 12, rx: 3, fill: n.c }, g);
    el('text', { x: n.x + 27, y: n.y + 17, 'font-size': 12, fill: '#e8f1fa' }, g).textContent = n.t;
    if (warn) el('text', { x: n.x + NW - 10, y: n.y + 18, 'font-size': 14, fill: '#ff9a1f', 'text-anchor': 'end' }, g).textContent = '!';
    n.r.forEach(function (r, i) {
      var ry = n.y + 26 + i * 36, cy = py(n, i), isIn = r[0] === 'in';
      var live = isIn
        ? F.wires.some(function (w) { return w.b === id && w.bi === i; })
        : F.wires.some(function (w) { return w.a === id && w.ai === i; });
      if (isIn) {
        el('rect', { x: n.x - 4, y: cy - 4, width: 8, height: 8, fill: live ? r[3] : '#0e1622', stroke: r[3], 'stroke-width': 1.5 }, g);
        el('text', { x: n.x + 14, y: ry + 16, 'font-size': 12, fill: '#cfe0f0' }, g).textContent = r[1];
        el('text', { x: n.x + 14, y: ry + 30, 'font-size': 11, fill: '#6f8aa3' }, g).textContent = r[2];
        el('rect', { x: n.x + NW - 28, y: ry + 9, width: 18, height: 18, rx: 4, fill: '#1a2a40' }, g);
        el('rect', { x: n.x + NW - 23, y: ry + 14, width: 8, height: 8, rx: 2, fill: r[3] }, g);
        var act = F.tmp || F.pend;
        if (act && act.col === r[3] && act.id !== id) el('circle', { cx: n.x, cy: cy, r: 9, fill: 'none', stroke: r[3], 'stroke-width': 2, 'pointer-events': 'none' }, g);
        el('circle', { cx: n.x, cy: cy, r: 17, fill: '#fff', 'fill-opacity': 0.01, 'data-port': 'in', 'data-n': id, 'data-i': i }, g);
      } else {
        el('circle', { cx: n.x + NW, cy: cy, r: 4.5, fill: live ? r[3] : '#0e1622', stroke: r[3], 'stroke-width': 1.5 }, g);
        el('text', { x: n.x + NW - 14, y: ry + 16, 'font-size': 12, fill: '#cfe0f0', 'text-anchor': 'end' }, g).textContent = r[1];
        el('text', { x: n.x + NW - 14, y: ry + 30, 'font-size': 11, fill: '#6f8aa3', 'text-anchor': 'end' }, g).textContent = r[2];
        el('rect', { x: n.x + 10, y: ry + 9, width: 18, height: 18, rx: 4, fill: '#1a2a40' }, g);
        el('rect', { x: n.x + 15, y: ry + 14, width: 8, height: 8, rx: 2, fill: r[3] }, g);
        el('circle', { cx: n.x + NW, cy: cy, r: 17, fill: '#fff', 'fill-opacity': 0.01, 'data-port': 'out', 'data-n': id, 'data-i': i }, g);
      }
    });
    if (n.f != null) {
      el('rect', { x: n.x + 8, y: n.y + h - 12, width: NW - 16, height: 4, rx: 2, fill: '#1a2a40' }, g);
      el('rect', { x: n.x + 8, y: n.y + h - 12, width: (NW - 16) * n.f, height: 4, rx: 2, fill: warn ? '#ff9a1f' : n.c }, g);
    }
  });
  if (F.tmp) {
    var t = F.tmp, xm = (t.x + t.sx) / 2;
    el('path', { d: 'M' + t.sx + ' ' + t.sy + ' H' + xm + ' V' + t.y + ' H' + t.x, fill: 'none', stroke: t.col, 'stroke-width': 2.4, 'stroke-dasharray': '6 5', 'pointer-events': 'none' }, s);
  }
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
    el('text', { x: n.x + 10, y: n.y + 66, 'font-size': 11, fill: ac }, g).textContent = q === 'done' ? 'Изучено' : (n.cost + ' науки');
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
    d.textContent = n.e + ' · ' + n.cost + ' науки'; b.textContent = can ? 'Изучить' : 'Мало науки';
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

var fvb = { x: 150, y: 10, w: 400, h: 470 }, fhome = { x: 150, y: 10, w: 400, h: 470 };
var tvb = { x: 0, y: 30, w: 400, h: 470 }, thome = { x: 0, y: 30, w: 400, h: 470 };
var fb, tb2;

function connect(src, bid, bi) {
  var bn = F.nodes[bid];
  if (!bn || bid === src.id || bn.r[bi][0] !== 'in' || bn.r[bi][3] !== src.col) return false;
  F.wires = F.wires.filter(function (w) { return !(w.b === bid && w.bi === bi); });
  F.wires.push({ a: src.id, ai: src.i, b: bid, bi: bi });
  saveSoon();
  return true;
}

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
      coins -= t.cost;
      var id = addNode(k, Math.round((fvb.x + 30) / 10) * 10, Math.round((fvb.y + 30 + (F.cnt % 6) * 40) / 10) * 10);
      F.sel = id; renderF(); hud(); show(0); toast('Поставлено: ' + t.t + '. Соедините провода'); save();
    });
    c.appendChild(b); grid.appendChild(c);
  });
  p.appendChild(grid);
}

function ord() {
  var p = $('p3'); p.innerHTML = '';
  var h = document.createElement('div'); h.className = 'sub'; h.textContent = 'Гости ресторана'; p.appendChild(h);
  G.forEach(function (g) {
    var c = document.createElement('div'); c.className = 'card rowc'; c.style.marginBottom = '8px';
    c.innerHTML = '<div style="width:34px;height:34px;border-radius:50%;background:#b79cff;flex:none"></div><div class="grow"><div style="font-size:12px">' + g.n + '</div><div style="font-size:11px;color:#8fa7bd">' + g.w + '</div></div>';
    var b = document.createElement('button'); b.className = 'btn';
    b.textContent = g.d ? 'Готово' : 'Отдать · ' + g.r;
    if (g.d) { b.style.background = '#12352f'; b.style.color = '#19e6d0'; }
    b.addEventListener('click', function () {
      if (g.d) return; g.d = 1; coins += g.r; hud(); ord(); toast('+' + g.r + ' монет'); save();
    });
    c.appendChild(b); p.appendChild(c);
  });
  var h2 = document.createElement('div'); h2.className = 'sub'; h2.textContent = 'Цены на рынке'; p.appendChild(h2);
  PR.forEach(function (r) {
    var row = document.createElement('div'); row.className = 'card'; row.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px';
    row.innerHTML = '<span>' + r[0] + '</span><span style="color:' + (r[2] ? '#19e6d0' : '#ff7d6b') + '">' + r[1] + (r[2] ? ' ▲' : ' ▼') + '</span>';
    p.appendChild(row);
  });
}

function base() {
  var p = $('p4'); p.innerHTML = '';
  var st = [['Уровень', lvl], ['Жителей', 14], ['Звёзды', '2'], ['Планета', 'Мята']];
  var grid = document.createElement('div'); grid.className = 'grid2';
  st.forEach(function (s) {
    var c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div style="font-size:11px;color:#8fa7bd">' + s[0] + '</div><div style="font-size:18px;margin-top:2px">' + s[1] + '</div>';
    grid.appendChild(c);
  });
  p.appendChild(grid);
  var h = document.createElement('div'); h.className = 'sub'; h.textContent = 'Жители'; p.appendChild(h);
  [['Мира · садовница', 'Рост быстрее на 15%', '#3fd3a0'], ['Тоб · повар', 'Блюда дороже на 10%', '#ffb347']].forEach(function (r) {
    var c = document.createElement('div'); c.className = 'card rowc'; c.style.marginBottom = '6px';
    c.innerHTML = '<div style="width:30px;height:30px;border-radius:50%;background:' + r[2] + ';flex:none"></div><div><div style="font-size:12px">' + r[0] + '</div><div style="font-size:11px;color:#8fa7bd">' + r[1] + '</div></div>';
    p.appendChild(c);
  });
  var up = document.createElement('div'); up.className = 'card rowc'; up.style.cssText += ';margin-top:10px;border-color:#b79cff';
  up.innerHTML = '<div class="grow"><div style="font-size:11px;color:#b79cff">Следующее улучшение</div><div style="font-size:13px;margin-top:2px">Склад холода · 900</div></div>';
  var b = document.createElement('button'); b.className = 'btn'; b.style.background = '#b79cff'; b.style.color = '#1d1838'; b.textContent = 'Построить';
  b.addEventListener('click', function () {
    if (coins < 900) { b.textContent = 'Мало монет'; setTimeout(function () { b.textContent = 'Построить'; }, 900); return; }
    coins -= 900; lvl++; hud(); base(); toast('Склад холода построен'); save();
  });
  up.appendChild(b); p.appendChild(up);
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

var NAV = [['factory', 'Поле'], ['box', 'Каталог'], ['flask', 'Наука'], ['receipt', 'Заказы'], ['home', 'База']];
function show(k) {
  for (var i = 0; i < 5; i++) $('p' + i).style.display = (i === k) ? 'block' : 'none';
  if (k === 0) fb.fit();
  if (k === 1) cat();
  if (k === 2) { tb2.fit(); tsheet(); }
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
  renderF(); renderT(); hud(); show(0);

  if (saved && saved.savedAt) {
    var secs = Math.min(OFFLINE_CAP, Math.max(0, (Date.now() - saved.savedAt) / 1000));
    var c = calc();
    var gain = Math.floor(c[0] * secs), sgain = Math.floor(c[1] * secs);
    if (secs > 30 && (gain > 0 || sgain > 0)) {
      coins += gain; sci += sgain; hud();
      toast('Пока вас не было: +' + gain + ' монет' + (sgain ? ', +' + sgain + ' науки' : ''));
    }
  }

  var ticks = 0;
  setInterval(function () {
    var c = calc(); coins += c[0]; sci += c[1]; hud();
    ticks++; if (ticks % 5 === 0) save();
  }, 1000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('resize', function () { fb.fit(); tb2.fit(); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache optional */ });
  }
}

init();
})();
