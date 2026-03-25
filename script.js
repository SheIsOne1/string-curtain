// script.js
// Canvas curtain with hover-thread interaction.
// After curtain opens, hovering a title emits a single elastic thread
// that extends downward autonomously — mouse Y proximity gives the
// *feeling* of pulling without actually controlling the tip position.

"use strict";

const canvas     = document.getElementById("c");
const ctx        = canvas.getContext("2d", { alpha: true });
const sectionsEl = document.getElementById("sections");
const titlesEl   = document.getElementById("titlesOverlay");
const titleItems = [0,1,2,3].map(i => document.getElementById("title" + i));
const sectionEls = [0,1,2,3].map(i => document.getElementById("sec"   + i));

const SECTION_URLS = ["#section-0","#section-1","#section-2","#section-3"];

// ─── TIMING ──────────────────────────────────────────────────────────────────
const T_OPEN   = 2800;
const T_EXTEND = 2200;   // ms for hover thread to fully extend
const MAX_LEN  = 210;    // px — thread length at full extension

// ─── EASING ──────────────────────────────────────────────────────────────────
function easeInOutQuart(t) {
  return t < .5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2,4)/2;
}
function easeOutCubic(t)  { return 1 - Math.pow(1-t,3); }
function easeInCubic(t)   { return t * t * t; }

// ─── STATE ───────────────────────────────────────────────────────────────────
let phase    = "idle";   // idle → opening → open
let phaseT0  = 0;
let progress = 0;
function setPhase(p) { phase = p; phaseT0 = performance.now(); }

// ─── HOVER-THREAD STATE ───────────────────────────────────────────────────────
let hoveredIdx   = -1;   // which title is hovered (-1 = none)
let hoverT0      = 0;    // when hover started (performance.now())
let hoverAnchorX = 0;    // thread root — bottom-centre of the hovered title
let hoverAnchorY = 0;
let mouseX       = 0;
let mouseY       = 0;
let hoverNavigating = false;  // true once we've committed to navigate

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ─── INIT ────────────────────────────────────────────────────────────────────
canvas.style.opacity         = "1";
canvas.style.pointerEvents   = "auto";
sectionsEl.style.opacity     = "0";
titlesEl.style.pointerEvents = "none";
titleItems.forEach(el => {
  if (!el) return;
  el.style.opacity      = "0";
  el.style.visibility   = "hidden";
  el.style.pointerEvents = "none";
});

// ─── FIRST CLICK ─────────────────────────────────────────────────────────────
function onFirstClick() {
  if (phase !== "idle") return;
  setPhase("opening");
  canvas.style.pointerEvents = "none";
  wakeRAF();
}
document.addEventListener("click",    onFirstClick, { once: true });
document.addEventListener("touchend", onFirstClick, { once: true, passive: true });

// ─── NAVIGATION (direct — no fall) ───────────────────────────────────────────
function navigateTo(url) {
  window.location.hash = url.replace("#","");
}

// Wire up title hover + click
titleItems.forEach((el, i) => {
  if (!el) return;
  el.style.cursor = "pointer";

  // Click goes straight to section
  el.addEventListener("click", e => {
    e.stopPropagation();
    navigateTo(SECTION_URLS[i]);
  });

  // Hover spawns the downward thread
  el.addEventListener("mouseenter", () => {
    if (phase !== "open") return;
    if (hoverNavigating) return;
    const rect    = el.getBoundingClientRect();
    hoverAnchorX  = rect.left + rect.width  / 2;
    hoverAnchorY  = rect.top  + rect.height + 4;  // just below title baseline
    hoveredIdx    = i;
    hoverT0       = performance.now();
    hoverNavigating = false;
    wakeRAF();
  });

  el.addEventListener("mouseleave", () => {
    // Only cancel if we haven't committed to navigate yet
    if (!hoverNavigating) hoveredIdx = -1;
  });
});

// ─── RESIZE ──────────────────────────────────────────────────────────────────
let W = innerWidth, H = innerHeight;
function resize() {
  W = innerWidth; H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildThreads();
  prewarm();
}
addEventListener("resize", resize);

// ─── THREAD DATA ─────────────────────────────────────────────────────────────
let threads = [];

function buildThreads() {
  threads = [];
  const mid   = W / 2;
  const count = Math.max(200, Math.floor(W / 5));

  for (let i = 0; i < count; i++) {
    const baseX  = (i + .5) * (W / count);
    const side   = baseX <= mid ? -1 : 1;
    const relPos = baseX <= mid ? 1 - baseX/mid : (baseX-mid)/mid;

    const travel = 0.25 + relPos * 1.0;
    const destX  = side === -1 ? -travel*mid : W + travel*mid;
    const stagger = relPos * 0.28;

    const pal = [
      {h:48,s:94,l:67},
      {h:48,s:85,l:55},
      {h:48,s:92,l:75},
      {h:48,s:30,l:62},
      {h:48,s:20,l:42},
      {h:48,s:12,l:68},
      {h:0, s:0, l:58},
      {h:0, s:0, l:78},
      {h:48,s:50,l:88},
      {h:0, s:0, l:92},
    ];
    const c = pal[i % pal.length];

    threads.push({
      baseX, destX, stagger, relPos, side,
      x: baseX, vx: 0,
      mass: 0.4 + Math.random() * 0.3,

      thickness: 0.4 + Math.random() * 0.8,
      alpha:     0.35 + Math.random() * 0.30,
      hue:   c.h + (Math.random()-.5)*4,
      sat:   Math.max(0,  Math.min(100, c.s+(Math.random()-.5)*8)),
      light: Math.max(35, Math.min(95,  c.l+(Math.random()-.5)*6)),

      a1: 20 + Math.random() * 20,
      f1: 0.0028 + Math.random()*.0022,
      s1: 0.00010 + Math.random()*.00008,
      p1: Math.random() * Math.PI * 2,

      a2: 5 + Math.random() * 6,
      f2: 0.009  + Math.random()*.007,
      s2: 0.00030 + Math.random()*.00020,
      p2: Math.random() * Math.PI * 2,

      a3: 1 + Math.random() * 1.5,
      f3: 0.022 + Math.random()*.016,
      s3: 0.00090 + Math.random()*.00060,
      p3: Math.random() * Math.PI * 2,

      ad: 30 + Math.random() * 20,
      sd: 0.00015 + Math.random()*.00010,
      pd: (i / count) * Math.PI * 8 + Math.random() * 0.6,
    });
  }
}

// ─── DRAW ONE CURTAIN THREAD ──────────────────────────────────────────────────
function drawThread(th, t, swayAmt) {
  const SEG  = 60;
  const segH = H / SEG;
  const topX = th.x;
  const swing    = topX - th.baseX;
  const bottomX  = topX + swing * 0.18 * -1;

  ctx.beginPath();
  ctx.moveTo(topX, 0);

  for (let k = 1; k <= SEG; k++) {
    const y = k * segH;
    const p = k / SEG;
    const strutX = topX + (bottomX - topX) * (p * p);
    const sag    = Math.sin(p * Math.PI) * (1.2 + Math.abs(swing) * 0.008) * p;
    const tr     = y * 0.010;
    const w1 = Math.sin(y*th.f1 - t*th.s1 + tr     + th.p1) * th.a1 * p             * swayAmt;
    const w2 = Math.sin(y*th.f2 - t*th.s2 + tr*1.6 + th.p2) * th.a2 * Math.sqrt(p)  * swayAmt;
    const w3 = Math.sin(y*th.f3 - t*th.s3 + tr*2.8 + th.p3) * th.a3 * (0.2 + p*0.8) * swayAmt;
    const wd = Math.sin(t*th.sd + th.pd + p*0.6)            * th.ad * p              * swayAmt;
    ctx.lineTo(strutX + w1 + w2 + w3 + wd + sag * 0.4, y);
  }

  ctx.lineWidth   = th.thickness;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.strokeStyle = `hsla(${th.hue},${th.sat}%,${th.light}%,${th.alpha})`;
  ctx.stroke();
}

// ─── DRAW ELASTIC HOVER THREAD ────────────────────────────────────────────────
// Draws a single glowing thread from (x1,y1) to (x2,y2) with a
// perpendicular wave that rides along the thread length.
function drawElasticThread(x1, y1, x2, y2, t, masterAlpha) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len < 2) return;

  // Perpendicular unit vector (horizontal when thread is vertical)
  const nx = -dy / len;
  const ny =  dx / len;

  const SEGS    = 50;
  // Wave amplitude grows as the thread extends (slack increases with length)
  const waveAmp = Math.min(9, len * 0.045) * Math.sin(Math.min(1, len / 80) * Math.PI);
  const waveSpd = 0.0025;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let k = 1; k <= SEGS; k++) {
    const p    = k / SEGS;
    const px   = x1 + dx * p;
    const py   = y1 + dy * p;
    // Wave is zero at both endpoints, maximum in the middle
    const wave = Math.sin(p * Math.PI * 2.5 - t * waveSpd) * waveAmp * Math.sin(p * Math.PI);
    ctx.lineTo(px + nx * wave, py + ny * wave);
  }

  // Three passes: outer glow → inner glow → solid core
  const passes = [
    { width: 7,   alpha: 0.06 },
    { width: 3,   alpha: 0.18 },
    { width: 1.2, alpha: 0.85 },
  ];
  for (const pass of passes) {
    ctx.lineWidth   = pass.width;
    ctx.strokeStyle = `rgba(210,168,65,${pass.alpha * masterAlpha})`;
    ctx.lineCap     = "round";
    ctx.stroke();
  }
}

// ─── DRAW DOWNWARD ARROW ─────────────────────────────────────────────────────
// Draws a small chevron pointing downward at (cx, cy).
function drawArrow(cx, cy, masterAlpha) {
  const size = 9;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.moveTo(-size * 0.55, -size * 0.4);
  ctx.lineTo(0,             size * 0.45);
  ctx.lineTo( size * 0.55, -size * 0.4);

  ctx.lineWidth   = 1.6;
  ctx.strokeStyle = `rgba(210,168,65,${0.9 * masterAlpha})`;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.stroke();
  ctx.restore();
}

// ─── TOP RAIL ────────────────────────────────────────────────────────────────
function drawRail() {
  const g = ctx.createLinearGradient(0,0,0,22);
  g.addColorStop(0,   "rgba(50,38,12,0.97)");
  g.addColorStop(.4,  "rgba(90,68,22,0.80)");
  g.addColorStop(1,   "rgba(20,15,5,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,22);
  ctx.fillStyle = "rgba(210,168,65,0.28)";
  ctx.fillRect(0,0,W,1.5);
}

// ─── TRAIL ALPHA ─────────────────────────────────────────────────────────────
const ALPHA_IDLE = 0.04;   // slow fade → dense trails during idle
const ALPHA_ANIM = 0.20;   // fast clear → crisp animation after click

// ─── PREWARM ─────────────────────────────────────────────────────────────────
function prewarm() {
  ctx.fillStyle = "rgb(7,7,11)";
  ctx.fillRect(0, 0, W, H);
  const FRAMES = 250, T_STEP = 80;
  for (let f = 0; f < FRAMES; f++) {
    const t = f * T_STEP;
    ctx.fillStyle = `rgba(7,7,11,${ALPHA_IDLE})`;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < threads.length; i++) drawThread(threads[i], t, 1.0);
  }
}

// ─── RAF ─────────────────────────────────────────────────────────────────────
let rafId = null, pageVisible = true;
document.addEventListener("visibilitychange", () => {
  pageVisible = document.visibilityState === "visible";
  if (pageVisible) wakeRAF();
});
function wakeRAF() { if (!rafId) rafId = requestAnimationFrame(loop); }

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
function loop(t) {
  rafId = null;
  if (!pageVisible) return;

  // ── Phase transitions ────────────────────────────────────────────────────
  if (phase === "opening") {
    progress = Math.min(1, (t - phaseT0) / T_OPEN);
    if (progress >= 1) { progress = 1; setPhase("open"); }
  }

  // ── Clear ────────────────────────────────────────────────────────────────
  const isIdle    = phase === "idle";
  const clearAlpha = isIdle ? ALPHA_IDLE : ALPHA_ANIM;
  ctx.fillStyle = `rgba(7,7,11,${clearAlpha})`;
  ctx.fillRect(0, 0, W, H);

  // ── Menu / titles visibility ──────────────────────────────────────────────
  if (phase !== "idle") {
    const menuA = Math.max(0, (progress - .45) / .55);
    sectionsEl.style.opacity = String(menuA);
    sectionEls.forEach(el => { if (el) el.style.opacity = String(menuA); });
    titleItems.forEach(el => {
      if (!el) return;
      const v = Math.max(0, (progress - .68) / .28);
      el.style.opacity       = String(Math.min(1, v));
      el.style.visibility    = v > 0 ? "visible" : "hidden";
      el.style.pointerEvents = v > .5 ? "auto" : "none";
    });
  }

  // ── Update + draw curtain threads ─────────────────────────────────────────
  for (let i = 0; i < threads.length; i++) {
    const th = threads[i];
    const raw  = Math.max(0, Math.min(1, (progress - th.stagger) / (1 - th.stagger)));
    const ep   = easeInOutQuart(raw);
    const tx   = th.baseX + (th.destX - th.baseX) * ep;
    const diff = tx - th.x;

    th.vx += diff * (0.055 / th.mass);
    th.vx *= 0.966;
    th.vx  = Math.max(-20, Math.min(20, th.vx));
    th.x  += th.vx;

    if (i > 0 && i < threads.length - 1) {
      const kp = 0.024, kv = 0.014;
      th.x  += ((threads[i-1].x  + threads[i+1].x)  / 2 - th.x)  * kp;
      th.vx += ((threads[i-1].vx + threads[i+1].vx) / 2 - th.vx) * kv;
    }

    drawThread(th, t, 0.08 + (1 - ep) * 0.92);
  }

  drawRail();

  // ── Hover thread (only while open) ───────────────────────────────────────
  if (hoveredIdx >= 0 && phase === "open") {
    const elapsed = t - hoverT0;

    // ── Mouse-Y influence ──────────────────────────────────────────────────
    // When the mouse is below the anchor it feels like the user is pulling.
    // Map mouse position in the range [anchorY … anchorY+300] → [0 … 0.40].
    // This bonus is *added* to the autonomous progress so the wire moves
    // faster when the user intuitively pulls downward — but even without
    // any mouse movement the wire will fully extend on its own.
    const pullZone     = 300;
    const mouseBelow   = Math.max(0, mouseY - hoverAnchorY);
    const mouseBonus   = Math.min(0.40, mouseBelow / pullZone * 0.40);

    // Autonomous base progress (always advances regardless of mouse)
    const baseProgress = Math.min(1, elapsed / T_EXTEND);

    // Combined progress (capped at 1)
    const rawProgress  = Math.min(1, baseProgress + mouseBonus);
    const prog         = easeOutCubic(rawProgress);

    // Emerge: fade in over first 350 ms so thread doesn't pop into existence
    const emerge = Math.min(1, elapsed / 350);

    // Thread free-end — always straight down from anchor
    const freeY = hoverAnchorY + prog * MAX_LEN;

    drawElasticThread(hoverAnchorX, hoverAnchorY, hoverAnchorX, freeY, t, emerge);

    // Arrow pulses gently to invite interaction
    const arrowPulse = 0.55 + 0.45 * Math.sin(t * 0.004);
    drawArrow(hoverAnchorX, freeY + 13, emerge * arrowPulse);

    // Navigate once the thread is ~90% extended
    if (prog > 0.88 && !hoverNavigating) {
      hoverNavigating = true;
      // Small delay so the user sees the thread fully reach its destination
      setTimeout(() => {
        navigateTo(SECTION_URLS[hoveredIdx]);
      }, 220);
    }
  }

  rafId = requestAnimationFrame(loop);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
resize();
wakeRAF();
