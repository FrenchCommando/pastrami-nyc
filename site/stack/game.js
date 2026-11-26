import { resolveDrop, verdict, pileStats } from './logic.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

const SLICE_H = 14;
const BREAD_H = 26;

let viewW = 0, viewH = 0, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.round(viewW * dpr);
  canvas.height = Math.round(viewH * dpr);
}
window.addEventListener('resize', resize);
resize();

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rrect(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  else ctx.rect(x, y, w, h);
}

// ---------- drawing ----------
function drawPastrami(x, y, w, h, seed, rot = 0) {
  if (w <= 0.5) return;
  const r = rng(seed);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  const l = -w / 2, t = -h / 2;

  const g = ctx.createLinearGradient(0, t, 0, t + h);
  g.addColorStop(0, '#c9555e');
  g.addColorStop(0.55, '#b0414c');
  g.addColorStop(1, '#842a35');
  rrect(l, t, w, h, 4);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // fat marbling
  ctx.strokeStyle = 'rgba(255, 228, 222, 0.6)';
  ctx.lineWidth = 1.6;
  const phase = r() * Math.PI * 2;
  ctx.beginPath();
  for (let i = 0; i <= w; i += 4) {
    const yy = t + h * 0.62 + Math.sin(i / 11 + phase) * 1.8;
    if (i === 0) ctx.moveTo(l + i, yy);
    else ctx.lineTo(l + i, yy);
  }
  ctx.stroke();
  // pepper crust
  ctx.fillStyle = '#3b1c16';
  ctx.fillRect(l, t, w, 3.5);
  ctx.fillStyle = '#140a07';
  const pepper = Math.max(1, Math.floor(w / 7));
  for (let i = 0; i < pepper; i++) {
    ctx.beginPath();
    ctx.arc(l + r() * w, t + r() * 5, 0.7 + r() * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawRye(x, y, w, h, seed, rot = 0) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  const l = -w / 2, t = -h / 2;
  rrect(l, t, w, h, 11);
  ctx.fillStyle = '#6b3e1d';
  ctx.fill();
  rrect(l + 4, t + 4, w - 8, h - 8, 8);
  ctx.fillStyle = '#ddbd86';
  ctx.fill();
  ctx.fillStyle = '#5a3a1e';
  const seeds = Math.floor(w / 12);
  for (let i = 0; i < seeds; i++) {
    ctx.save();
    ctx.translate(l + 10 + r() * (w - 20), t + 7 + r() * (h - 14));
    ctx.rotate(r() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- audio ----------
let audio = null;
function blip(freq, dur = 0.09, type = 'triangle', vol = 0.18) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, audio.currentTime + dur);
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  } catch { /* no audio, no problem */ }
}

// ---------- game state ----------
// x is the left edge as an offset from screen center, so resizing keeps the pile centered.
let state = 'ready';
let baseW = 0, base = null, stack = [], current = null, falling = [], floaters = [], topBread = null;
let camY = 0, camTarget = 0, scale = 1, scaleTarget = 1, streak = 0, perfects = 0, seedCounter = 1;

const PERFECT_LINES = ['PERFECT', 'Hand-cut!', 'Mazel tov!', 'Beautiful.', 'Like butter', 'Chef’s kiss'];
const MILESTONES = {
  10: 'Now that’s a sandwich',
  20: 'Mile high!',
  30: 'Cardiologist on line 1',
  45: 'Structural engineer notified',
  60: 'Visible from New Jersey',
  80: 'The pile has its own zip code',
};

function reset() {
  baseW = Math.min(viewW * 0.62, 300);
  seedCounter = 1;
  base = { x: -baseW / 2, w: baseW, seed: seedCounter++ };
  stack = [];
  falling = [];
  floaters = [];
  topBread = null;
  camY = camTarget = 0;
  scale = scaleTarget = 1;
  streak = 0;
  perfects = 0;
  spawn();
  updateScore();
}

function topSlice() { return stack.length ? stack[stack.length - 1] : base; }

function spawn() {
  const prev = topSlice();
  const n = stack.length;
  const range = Math.min(viewW / 2 + 20, 320);
  const fromLeft = n % 2 === 0;
  current = {
    x: fromLeft ? -range : range - prev.w,
    w: prev.w,
    dir: fromLeft ? 1 : -1,
    speed: Math.min(200 + n * 11, 640),
    seed: seedCounter++,
    range,
  };
}

function levelY(n) { return BREAD_H + n * SLICE_H; }

function drop() {
  const wy = levelY(stack.length);
  const res = resolveDrop(topSlice(), current, baseW, streak);
  streak = res.streak;

  if (res.kind === 'miss') {
    falling.push({ x: current.x, wy, w: current.w, vx: current.dir * 60, vy: 0, rot: 0, vr: current.dir * 2.5, seed: current.seed });
    current = null;
    blip(90, 0.35, 'sawtooth', 0.12);
    endGame();
    return;
  }

  stack.push({ ...res.placed, seed: current.seed });
  if (res.kind === 'perfect') {
    perfects++;
    floatText(PERFECT_LINES[Math.floor(Math.random() * PERFECT_LINES.length)] + (streak > 1 ? ` ×${streak}` : ''), '#b3262f');
    blip(520 + Math.min(streak, 10) * 60, 0.12, 'sine', 0.2);
  } else {
    const { x, w, side } = res.cut;
    falling.push({ x, wy, w, vx: side * (40 + Math.random() * 60), vy: 120, rot: 0, vr: side * (1.5 + Math.random() * 3), seed: current.seed + 9999 });
    blip(190, 0.08);
  }

  const n = stack.length;
  if (MILESTONES[n]) floatText(MILESTONES[n], '#2a1712', 1.6);
  updateScore();
  spawn();
}

function endGame() {
  state = 'over';
  const n = stack.length;
  const top = topSlice();
  topBread = {
    x: top.x + top.w / 2 - baseW / 2,
    wy: levelY(n) + 420,
    target: levelY(n),
    vy: 0,
    landed: false,
    seed: seedCounter++,
  };
  const totalH = levelY(n) + BREAD_H + 40;
  scaleTarget = Math.min(1, (viewH * 0.42) / totalH);
  camTarget = 0;
}

function showTicket() {
  const n = stack.length;
  const best = Math.max(n, +(localStorage.getItem('pastrami-best') || 0));
  localStorage.setItem('pastrami-best', best);
  const stats = pileStats(n);
  $('finalScore').textContent = n;
  $('verdict').textContent = verdict(n);
  $('inches').textContent = stats.inches;
  $('weight').textContent = stats.weight;
  $('perfects').textContent = perfects;
  $('best').textContent = best + (n === best && n > 0 ? ' ★' : '');
  $('over').classList.remove('hidden');
}

function updateScore() { $('score').textContent = stack.length; }

function floatText(text, color, life = 1) {
  floaters.push({ text, color, t: 0, life, x: viewW / 2, y: viewH * 0.36 });
}

// ---------- input ----------
function act() {
  if (state === 'playing' && current) drop();
}
function begin() {
  // a focused button would re-trigger begin() on the next space press
  if (document.activeElement) document.activeElement.blur();
  $('start').classList.add('hidden');
  $('over').classList.add('hidden');
  $('score').classList.remove('hidden');
  $('sub').classList.remove('hidden');
  reset();
  state = 'playing';
  blip(330, 0.1, 'sine');
}
canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state === 'playing') act();
    else if (state === 'ready' || !$('over').classList.contains('hidden')) begin();
  }
});
$('startBtn').addEventListener('click', begin);
$('againBtn').addEventListener('click', begin);

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  if (state === 'playing' && current) {
    current.x += current.dir * current.speed * dt;
    const minX = -current.range;
    const maxX = current.range - current.w;
    if (current.x < minX) { current.x = minX; current.dir = 1; }
    if (current.x > maxX) { current.x = maxX; current.dir = -1; }
    camTarget = Math.max(0, levelY(stack.length) - viewH * 0.45);
  }

  for (const f of falling) {
    f.vy -= 1700 * dt;
    f.wy += f.vy * dt;
    f.x += f.vx * dt;
    f.rot += f.vr * dt;
  }
  falling = falling.filter((f) => f.wy > camY - 2000);

  if (topBread && !topBread.landed) {
    topBread.vy -= 2200 * dt;
    topBread.wy += topBread.vy * dt;
    if (topBread.wy <= topBread.target) {
      topBread.wy = topBread.target;
      topBread.landed = true;
      blip(140, 0.18, 'triangle', 0.25);
      setTimeout(showTicket, 700);
    }
  }

  camY += (camTarget - camY) * Math.min(1, dt * 5);
  scale += (scaleTarget - scale) * Math.min(1, dt * 3);

  for (const f of floaters) f.t += dt;
  floaters = floaters.filter((f) => f.t < f.life);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewW, viewH);

  const baseY = viewH - 62;
  ctx.save();
  ctx.translate(viewW / 2, baseY);
  ctx.scale(scale, scale);
  // world y up -> canvas y = -(wy - camY)
  const Y = (wy, h) => -(wy + h - camY);

  // plate
  const plateW = baseW || Math.min(viewW * 0.62, 300);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, Y(0, 0) + 4, plateW * 0.72, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, Y(0, 0), plateW * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (base) {
    drawRye(base.x, Y(0, BREAD_H), base.w, BREAD_H, base.seed);
    stack.forEach((s, i) => drawPastrami(s.x, Y(levelY(i), SLICE_H), s.w, SLICE_H, s.seed));

    if (current && state === 'playing') {
      const wy = levelY(stack.length);
      // shadow guide
      const prev = topSlice();
      ctx.fillStyle = 'rgba(42, 23, 18, 0.08)';
      ctx.fillRect(prev.x, Y(wy, SLICE_H), prev.w, SLICE_H);
      drawPastrami(current.x, Y(wy, SLICE_H), current.w, SLICE_H, current.seed);
    }

    for (const f of falling) drawPastrami(f.x, Y(f.wy, SLICE_H), f.w, SLICE_H, f.seed, f.rot);

    if (topBread) {
      drawRye(topBread.x, Y(topBread.wy, BREAD_H), baseW, BREAD_H, topBread.seed);
      if (topBread.landed) {
        // toothpick + olive
        const cx = topBread.x + baseW / 2;
        const topY = Y(topBread.wy, BREAD_H);
        ctx.strokeStyle = '#d9b26a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, topY + 14);
        ctx.lineTo(cx, topY - 36);
        ctx.stroke();
        ctx.fillStyle = '#6b8e23';
        ctx.beginPath();
        ctx.arc(cx, topY - 38, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(cx + 2, topY - 39, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // idle screen: a little demo sandwich
    const w = plateW;
    drawRye(-w / 2, Y(0, BREAD_H), w, BREAD_H, 3);
    for (let i = 0; i < 6; i++) drawPastrami(-w / 2 + Math.sin(i * 1.7) * 6, Y(levelY(i), SLICE_H), w, SLICE_H, 100 + i);
    drawRye(-w / 2, Y(levelY(6), BREAD_H), w, BREAD_H, 7);
  }
  ctx.restore();

  // floating text in screen space
  ctx.textAlign = 'center';
  for (const f of floaters) {
    const p = f.t / f.life;
    ctx.globalAlpha = 1 - p * p;
    ctx.font = `${Math.round(26 + 6 * (1 - p))}px "Alfa Slab One", Georgia, serif`;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - p * 40);
  }
  ctx.globalAlpha = 1;
}

requestAnimationFrame(frame);
