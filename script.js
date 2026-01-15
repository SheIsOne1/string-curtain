const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });
const introPage = document.getElementById("introPage");
const sectionsEl = document.getElementById("sections");
const sectionEls = [
  document.getElementById("sec0"),
  document.getElementById("sec1"),
  document.getElementById("sec2"),
  document.getElementById("sec3")
];
const titleEls = sectionEls.map(el => el.querySelector("h3"));
const titleOverlayEls = [
  document.getElementById("title0"),
  document.getElementById("title1"),
  document.getElementById("title2"),
  document.getElementById("title3")
];
const debugEl = document.getElementById("debug");

// Initially hide the curtain animation
let introShown = true;
canvas.style.opacity = "0";
sectionsEl.style.opacity = "0";
if (debugEl) debugEl.style.opacity = "0";

// Handle intro page transition
function hideIntro() {
  if (!introShown) return;
  introShown = false;
  
  if (introPage) {
    introPage.classList.add("hidden");
  }
  
  // Show curtain animation after intro fades out
  setTimeout(() => {
    canvas.style.opacity = "1";
    canvas.style.transition = "opacity 0.5s ease-in";
    if (debugEl) debugEl.style.opacity = "1";
  }, 500);
}

// Click on intro page to proceed
if (introPage) {
  introPage.addEventListener("click", hideIntro);
  // Also auto-transition after 3 seconds
  setTimeout(hideIntro, 3000);
}

// Debug: Log title overlay elements
console.log("Title overlay elements:", titleOverlayEls);
titleOverlayEls.forEach((title, i) => {
  console.log(`Title overlay ${i}:`, title, title ? title.textContent : "null");
});

/* ===== CANVAS SETUP ===== */
function resize() {
  const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seed();
}
addEventListener("resize", resize);

/* ===== POINTER ===== */
const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
addEventListener("mousemove", e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; });
addEventListener("mouseleave", () => pointer.active = false);

/* ===== CLICK NAVIGATION ===== */
// Click on canvas to navigate (only if not clicking on a title)
// Note: Titles are above canvas (z-index 3 vs 2), so clicks on titles 
// should hit titles first. This check is just a safety measure.
let lastClickTime = 0;
canvas.addEventListener("click", (e) => {
  const now = Date.now();
  if (now - lastClickTime < 300) return;
  lastClickTime = now;

  const clickedIdx = sectionIndex(e.clientX);
  const contentSection = document.getElementById(`content${clickedIdx}`);
  
  if (contentSection) {
    contentSection.scrollIntoView({ 
      behavior: "smooth",
      block: "start"
    });
  }
});

// Click on title to navigate
// Titles are above the canvas, so they should receive clicks first
// We use stopPropagation to prevent the click from bubbling to canvas
titleOverlayEls.forEach((titleEl, idx) => {
  if (titleEl) {
    // Make sure title is always clickable, even when opacity is 0
    titleEl.style.pointerEvents = "auto";
    titleEl.style.cursor = "pointer";
    
    titleEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Stop the click from reaching the canvas below
      console.log(`Title ${idx} (${titleEl.textContent}) clicked!`);
      
      const contentSection = document.getElementById(`content${idx}`);
      
      if (contentSection) {
        console.log(`Scrolling to content section ${idx}`);
        contentSection.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        });
      } else {
        console.error(`Content section ${idx} not found!`);
      }
    });
  } else {
    console.error(`Title element ${idx} is null!`);
  }
});

/* ===== 4-SECTION SNAP LOGIC ===== */
function sectionIndex(x) {
  return Math.min(3, Math.max(0, Math.floor(x / (innerWidth / 4))));
}
function sectionCenter(i) {
  return (i + 0.5) * (innerWidth / 4);
}

/* ===== MAGNETIC SNAP STATE ===== */
let snapX = innerWidth / 2;
const SNAP_EASE = 0.12; // lower = softer, higher = stronger magnet

/* ===== STRINGS ===== */
let strings = [];
function seed() {
  strings = [];
  const count = Math.max(90, Math.floor(innerWidth / 10));
  const gap = innerWidth / count;

  for (let i = 0; i < count; i++) {
    strings.push({
      baseX: (i + 0.5) * gap,
      x: (i + 0.5) * gap,
      phase: Math.random() * 1000,
      wobble: 0.7 + Math.random() * 1.3,
      thickness: 1.3 + Math.random() * 1.4,
      alpha: 0.28 + Math.random() * 0.28,
      hue: Math.random() * 360,
      sat: 55 + Math.random() * 15,
      light: 72 + Math.random() * 12
    });
  }
}

const params = {
  openRadius: 220,
  openStrength: 140,
  followEase: 0.18,
  returnEase: 0.10
};

function drawString(x, t, s) {
  const seg = 26;
  const segH = innerHeight / seg;

  ctx.beginPath();
  ctx.moveTo(x, 0);

  for (let i = 1; i <= seg; i++) {
    const y = i * segH;
    const wave =
      Math.sin(t * 0.0014 + y * 0.018 + s.phase) * s.wobble +
      Math.cos(t * 0.0011 + y * 0.012) * s.wobble * 0.6;
    ctx.lineTo(x + wave * (i / seg), y);
  }

  ctx.lineWidth = s.thickness;
  ctx.lineCap = "round";
  ctx.strokeStyle = `hsla(${s.hue},${s.sat}%,${s.light}%,${s.alpha})`;
  ctx.stroke();
}

/* ===== LOOP ===== */
function loop(t) {
  ctx.fillStyle = "rgba(7,7,11,0.22)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const idx = sectionIndex(pointer.x);
  const targetSnap = sectionCenter(idx);

  /* soft magnetic snap */
  snapX += (targetSnap - snapX) * SNAP_EASE;

  /* reveal logic */
  if (pointer.active) {
    sectionsEl.style.opacity = "1";
    sectionsEl.style.setProperty("--reveal-x", `${snapX}px`);
    sectionsEl.style.setProperty("--reveal-w", `${params.openRadius * 0.45}px`);

    sectionEls.forEach((el, i) => {
      el.style.opacity = i === idx ? "1" : "0";
    });
    
    // Show title in overlay (above canvas)
    titleOverlayEls.forEach((titleEl, i) => {
      if (titleEl) {
        titleEl.style.opacity = i === idx ? "1" : "0";
      }
    });
    
    // Debug display
    if (debugEl) {
      const titleEl = titleOverlayEls[idx];
      if (titleEl) {
        const computedStyle = window.getComputedStyle(titleEl);
        const parentStyle = window.getComputedStyle(titleEl.parentElement);
        debugEl.innerHTML = `
          Active: ${idx}<br>
          Title: "${titleEl.textContent}"<br>
          Title element: ${titleEl ? 'found' : 'NOT FOUND'}<br>
          Title opacity: ${titleEl.style.opacity || 'not set'}<br>
          Title computed opacity: ${computedStyle.opacity}<br>
          Parent opacity: ${parentStyle.opacity}<br>
          Title visible: ${titleEl.offsetParent !== null}<br>
          Title color: ${computedStyle.color}<br>
          Title display: ${computedStyle.display}<br>
          Title z-index: ${computedStyle.zIndex}<br>
          Parent z-index: ${parentStyle.zIndex}
        `;
      } else {
        debugEl.innerHTML = `Active: ${idx}<br>Title element NOT FOUND!`;
      }
    }
  } else {
    sectionsEl.style.opacity = "0";
    sectionsEl.style.setProperty("--reveal-w", "0px");
    sectionEls.forEach((el, i) => {
      el.style.opacity = "0";
    });
    // Hide all titles
    titleOverlayEls.forEach(titleEl => {
      if (titleEl) {
        titleEl.style.opacity = "0";
      }
    });
    if (debugEl) {
      debugEl.innerHTML = "Not hovering";
    }
  }

  /* update strings */
  for (const s of strings) {
    let tx = s.baseX;

    if (pointer.active) {
      const d = Math.abs(s.baseX - snapX);
      if (d < params.openRadius) {
        const f = 1 - d / params.openRadius;
        const dir = s.baseX < snapX ? -1 : 1;
        tx = s.baseX + dir * params.openStrength * f * f;
      }
    }

    s.x += (tx - s.x) * (pointer.active ? params.followEase : params.returnEase);
  }

  ctx.globalCompositeOperation = "lighter";
  strings.forEach(s => drawString(s.x, t, s));
  ctx.globalCompositeOperation = "source-over";

  requestAnimationFrame(loop);
}

resize();

// Test: Make sure title elements exist
titleOverlayEls.forEach((el, i) => {
  if (!el) {
    console.error(`Title overlay element ${i} NOT FOUND!`);
  } else {
    console.log(`Title overlay ${i} found:`, el.textContent);
  }
});

requestAnimationFrame(loop);

