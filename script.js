"use strict";

const canvas          = document.getElementById("c");
const ctx             = canvas.getContext("2d", { alpha: true });
const titlesEl        = document.getElementById("titlesOverlay");
const titleItems      = [0,1,2,3].map(i => document.getElementById("title" + i));
const hibiscusCanvas = document.getElementById("hibiscus");
let hibiscusLoaded   = false;

// ─── TIMING ──────────────────────────────────────────────────────────────────
const T_OPEN   = 2800;
const T_EXTEND = 2400;
const MAX_LEN  = 200;

// ─── EASING ──────────────────────────────────────────────────────────────────
function easeInOutQuart(t) {
  return t < .5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2,4)/2;
}
function easeOutCubic(t) { return 1 - Math.pow(1-t,3); }

// ─── STATE ───────────────────────────────────────────────────────────────────
let phase    = "idle";
let phaseT0  = 0;
let progress = 0;
function setPhase(p) { phase = p; phaseT0 = performance.now(); }

// ─── HOVER STATE ─────────────────────────────────────────────────────────────
let hoveredIdx   = -1;
let hoverT0      = 0;
let hoverAnchorX = 0;
let hoverAnchorY = 0;
let mouseX       = -9999;
let mouseY       = -9999;

document.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; });

// ─── INIT ────────────────────────────────────────────────────────────────────
canvas.style.opacity         = "1";
canvas.style.pointerEvents   = "auto";
titlesEl.style.pointerEvents = "none";
titleItems.forEach(el => {
  if (!el) return;
  el.style.opacity       = "0";
  el.style.visibility    = "hidden";
  el.style.pointerEvents = "none";
});

// ─── FIRST CLICK ─────────────────────────────────────────────────────────────
function onFirstClick() {
  if (phase !== "idle") return;
  setPhase("opening");
  canvas.style.pointerEvents = "none";
  wakeRAF();
}
canvas.addEventListener("click",    onFirstClick, { once: true });
canvas.addEventListener("touchend", onFirstClick, { once: true, passive: true });
document.addEventListener("click",  onFirstClick, { once: true });

// ─── SKIP CURTAIN when returning from a section page ─────────────────────────
if (new URLSearchParams(window.location.search).get("open") === "1") {
  progress = 1;
  setPhase("open");
  canvas.style.pointerEvents = "none";
  // Force titles visible immediately — don't wait for loop
  titleItems.forEach(el => {
    if (!el) return;
    el.style.opacity       = "1";
    el.style.visibility    = "visible";
    el.style.pointerEvents = "auto";
  });
  hibiscusCanvas.style.opacity    = "1";
  hibiscusCanvas.style.visibility = "visible";
  // Start hibiscus when module is ready
  window.__onHibiscusReady = () => {
    if (!hibiscusLoaded) { hibiscusLoaded = true; window.__startHibiscus(hibiscusCanvas); }
  };
  wakeRAF();
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const SECTION_PAGES = [
  "our-story.html",
  "making-of.html",
  "creators.html",
  "awards.html",
];

function navigateTo(idx) {
  if (phase !== "open") return;
  setPhase("navigating");
  hoveredIdx = -1;

  // Fade canvas to black, then go straight to the grid page.
  // No sections are shown — nothing flashes.
  canvas.style.opacity = "0";
  setTimeout(() => {
    window.location.href = SECTION_PAGES[idx];
  }, 600);
}

// ─── TITLE HOVER + CLICK ──────────────────────────────────────────────────────
titleItems.forEach((el, i) => {
  if (!el) return;
  el.style.cursor = "pointer";

  el.addEventListener("click", e => {
    e.stopPropagation();
    navigateTo(i);
  });

  el.addEventListener("mouseenter", () => {
    if (phase !== "open") return;
    const textEl = el.querySelector(".title-text") || el;
    const rect   = textEl.getBoundingClientRect();
    hoverAnchorX = rect.left + rect.width / 2;
    hoverAnchorY = rect.bottom + 6;
    hoveredIdx   = i;
    hoverT0      = performance.now();
    wakeRAF();
  });

  el.addEventListener("mouseleave", () => {
    hoveredIdx = -1;
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
    const travel  = 0.25 + relPos * 1.0;
    const destX   = side === -1 ? -travel*mid : W + travel*mid;
    const stagger = relPos * 0.28;

    const pal = [
      {h:48,s:94,l:67},{h:48,s:85,l:55},{h:48,s:92,l:75},
      {h:48,s:30,l:62},{h:48,s:20,l:42},{h:48,s:12,l:68},
      {h:0, s:0, l:58},{h:0, s:0, l:78},{h:48,s:50,l:88},
      {h:0, s:0, l:92},
    ];
    const c = pal[i % pal.length];

    threads.push({
      baseX, destX, stagger, relPos, side,
      x: baseX, vx: 0,
      mass:      0.4 + Math.random() * 0.3,
      thickness: 0.4 + Math.random() * 0.8,
      alpha:     0.35 + Math.random() * 0.30,
      hue:   c.h + (Math.random()-.5)*4,
      sat:   Math.max(0,  Math.min(100, c.s+(Math.random()-.5)*8)),
      light: Math.max(35, Math.min(95,  c.l+(Math.random()-.5)*6)),
      a1: 20+Math.random()*20,  f1:0.0028+Math.random()*.0022,
      s1: 0.00010+Math.random()*.00008, p1:Math.random()*Math.PI*2,
      a2: 5+Math.random()*6,    f2:0.009+Math.random()*.007,
      s2: 0.00030+Math.random()*.00020, p2:Math.random()*Math.PI*2,
      a3: 1+Math.random()*1.5,  f3:0.022+Math.random()*.016,
      s3: 0.00090+Math.random()*.00060, p3:Math.random()*Math.PI*2,
      ad: 30+Math.random()*20,
      sd: 0.00015+Math.random()*.00010,
      pd: (i/count)*Math.PI*8 + Math.random()*0.6,
    });
  }
}

// ─── DRAW CURTAIN THREAD ─────────────────────────────────────────────────────
function drawThread(th, t, swayAmt) {
  const SEG = 60, segH = H / SEG;
  const topX    = th.x;
  const swing   = topX - th.baseX;
  const bottomX = topX + swing * 0.18 * -1;

  ctx.beginPath();
  ctx.moveTo(topX, 0);
  for (let k = 1; k <= SEG; k++) {
    const y = k * segH, p = k / SEG;
    const strutX = topX + (bottomX - topX) * (p * p);
    const sag = Math.sin(p * Math.PI) * (1.2 + Math.abs(swing) * 0.008) * p;
    const tr  = y * 0.010;
    const w1 = Math.sin(y*th.f1 - t*th.s1 + tr     + th.p1) * th.a1 * p            * swayAmt;
    const w2 = Math.sin(y*th.f2 - t*th.s2 + tr*1.6 + th.p2) * th.a2 * Math.sqrt(p) * swayAmt;
    const w3 = Math.sin(y*th.f3 - t*th.s3 + tr*2.8 + th.p3) * th.a3 * (0.2+p*0.8) * swayAmt;
    const wd = Math.sin(t*th.sd  + th.pd   + p*0.6)          * th.ad * p            * swayAmt;
    ctx.lineTo(strutX + w1 + w2 + w3 + wd + sag * 0.4, y);
  }
  ctx.lineWidth   = th.thickness;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.strokeStyle = `hsla(${th.hue},${th.sat}%,${th.light}%,${th.alpha})`;
  ctx.stroke();
}

// ─── HOVER THREAD — coiled, multi-layer, bouncing tip ────────────────────────
function drawHoverThread(anchorX, anchorY, freeY, t, alpha) {
  const len = freeY - anchorY;
  if (len < 2) return 0;

  const SEGS = 60;
  const a1 = Math.min(13, len * 0.065);
  const a2 = Math.min( 5, len * 0.025);
  const a3 = Math.min( 2, len * 0.010);

  const bounce = (Math.sin(t * 0.00380) * 0.65
                + Math.sin(t * 0.00195 + 1.4) * 0.35) * 8;

  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  for (let k = 1; k <= SEGS; k++) {
    const p   = k / SEGS;
    const py  = anchorY + len * p + bounce * (p * p);
    const env = Math.sin(p * Math.PI);
    const w1 = Math.sin(p * Math.PI * 1.8 - t * 0.00180 + 0.00) * a1 * env;
    const w2 = Math.sin(p * Math.PI * 3.6 - t * 0.00290 + 1.20) * a2 * env;
    const w3 = Math.sin(p * Math.PI * 6.5 - t * 0.00480 + 2.50) * a3 * (0.2 + p * 0.8);
    ctx.lineTo(anchorX + w1 + w2 + w3, py);
  }

  const passes = [
    { w: 9,   a: 0.05 },
    { w: 3.5, a: 0.18 },
    { w: 1.2, a: 0.90 },
  ];
  for (const pass of passes) {
    ctx.lineWidth   = pass.w;
    ctx.strokeStyle = `rgba(210,168,65,${pass.a * alpha})`;
    ctx.lineCap     = "round";
    ctx.stroke();
  }

  return freeY + bounce;
}

// ─── DOWNWARD ARROW ───────────────────────────────────────────────────────────
function drawArrow(cx, cy, alpha) {
  const s = 8;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, -s * 0.35);
  ctx.lineTo(0,         s * 0.50);
  ctx.lineTo( s * 0.6, -s * 0.35);
  ctx.lineWidth   = 1.6;
  ctx.strokeStyle = `rgba(122,174,255,${0.85 * alpha})`;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.stroke();
  ctx.restore();
}

// ─── TOP PROGRESS / WAVE BAR (thread style) ──────────────────────────────────
// Title hue palette (one per title index)
const RAIL_COLORS = [
  "210,168,65",   // Our Story  — gold
  "249,220,92",   // Making Of  — bright yellow
  "252,200,100",  // creators   — warm amber
  "255,240,150",  // Awards     — pale gold
];

function drawRail(t) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0) return;

  // Pick color based on hovered title (default gold)
  const col  = hoveredIdx >= 0 ? RAIL_COLORS[hoveredIdx] : "210,168,65";
  const barW = W * p;

  // Wave parameters — active only when fully open
  const isOpen    = phase === "open";
  const amp       = isOpen ? (hoveredIdx >= 0 ? 2 : 1) : 0;
  const freq      = 0.012;
  const spd       = t * (hoveredIdx >= 0 ? 0.003 : 0.0015);

  // Build wave path (or straight line during load)
  function wavePath(xEnd) {
    ctx.beginPath();
    for (let x = 0; x <= xEnd; x += 3) {
      const y = 2 + Math.sin(x * freq + spd) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
  }

  ctx.save();
  ctx.lineCap = "round";

  // Outer glow
  wavePath(barW);
  ctx.lineWidth   = 5;
  ctx.strokeStyle = `rgba(${col},0.10)`;
  ctx.stroke();

  // Mid glow
  wavePath(barW);
  ctx.lineWidth   = 2.5;
  ctx.strokeStyle = `rgba(${col},0.25)`;
  ctx.stroke();

  // Inner glow
  wavePath(barW);
  ctx.lineWidth   = 1.2;
  ctx.strokeStyle = `rgba(${col},0.55)`;
  ctx.stroke();

  // Core line
  wavePath(barW);
  ctx.lineWidth   = 0.6;
  ctx.strokeStyle = `rgba(${col},0.90)`;
  ctx.stroke();

  // Tip dot (during load only)
  if (p < 1) {
    const tipY = 2 + Math.sin(barW * freq + spd) * amp;
    ctx.beginPath();
    ctx.arc(barW, tipY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${col},0.9)`;
    ctx.fill();
  }

  ctx.restore();
}

// ─── TRAIL ALPHA ─────────────────────────────────────────────────────────────
const ALPHA_IDLE = 0.04;
const ALPHA_ANIM = 0.20;

// ─── PREWARM ─────────────────────────────────────────────────────────────────
function prewarm() {
  ctx.fillStyle = "rgb(0,0,0)";
  ctx.fillRect(0, 0, W, H);
  const FRAMES = 250, T_STEP = 80;
  for (let f = 0; f < FRAMES; f++) {
    const t = f * T_STEP;
    ctx.fillStyle = `rgba(0,0,0,${ALPHA_IDLE})`;
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
  if (phase === "navigating") return;

  if (phase === "opening") {
    progress = Math.min(1, (t - phaseT0) / T_OPEN);
    if (progress >= 1) { progress = 1; setPhase("open"); }
  }

  const clearAlpha = (phase === "idle") ? ALPHA_IDLE : ALPHA_ANIM;
  ctx.fillStyle = `rgba(0,0,0,${clearAlpha})`;
  ctx.fillRect(0, 0, W, H);

  // Fade in titles and hibiscus animation together
  if (phase !== "idle") {
    const v = Math.max(0, (progress - .68) / .28);
    titleItems.forEach(el => {
      if (!el) return;
      el.style.opacity       = String(Math.min(1, v));
      el.style.visibility    = v > 0 ? "visible" : "hidden";
      el.style.pointerEvents = v > .5 ? "auto" : "none";
    });
    // Start hibiscus animation once curtain is fully open
    if (phase === "open" && !hibiscusLoaded && window.__startHibiscus) {
      hibiscusLoaded = true;
      window.__startHibiscus(hibiscusCanvas);
    }
    hibiscusCanvas.style.opacity    = String(Math.min(1, v));
    hibiscusCanvas.style.visibility = v > 0 ? "visible" : "hidden";
  }

  for (let i = 0; i < threads.length; i++) {
    const th  = threads[i];
    const raw = Math.max(0, Math.min(1, (progress - th.stagger) / (1 - th.stagger)));
    const ep  = easeInOutQuart(raw);
    const tx  = th.baseX + (th.destX - th.baseX) * ep;
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

  drawRail(t);

  // ── Hover thread ──────────────────────────────────────────────────────────
  if (hoveredIdx >= 0 && phase === "open") {
    const elapsed      = t - hoverT0;
    const mouseBelow   = Math.max(0, mouseY - hoverAnchorY);
    const mouseBonus   = Math.min(0.35, mouseBelow / 280 * 0.35);
    const baseProgress = Math.min(1, elapsed / T_EXTEND);
    const prog         = easeOutCubic(Math.min(1, baseProgress + mouseBonus));
    const emerge       = Math.min(1, elapsed / 300);
    const freeY        = hoverAnchorY + prog * MAX_LEN;

    const tipY = drawHoverThread(hoverAnchorX, hoverAnchorY, freeY, t, emerge);
    const pulse = 0.45 + 0.55 * Math.sin(t * 0.004);
    drawArrow(hoverAnchorX, tipY + 13, emerge * pulse);
  }

  rafId = requestAnimationFrame(loop);
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
resize();
wakeRAF();
