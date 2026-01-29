// Updated: Removed content section errors - cache bust: 2024-01
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: true });
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

// Start directly with curtain - no intro page
let introShown = false;
let introAnimationComplete = true; // Skip intro animation
let curtainReady = true; // Curtain is ready immediately

// Show curtain immediately
canvas.style.opacity = "1";
canvas.style.pointerEvents = "auto";
sectionsEl.style.opacity = "0";
if (debugEl) debugEl.style.opacity = "1";

// Enable interactions immediately
document.body.style.pointerEvents = "auto";
document.body.style.userSelect = "auto";
document.body.style.cursor = "default";

// No blocking needed - curtain starts immediately

// Intro page removed - curtain starts immediately
// No hideIntro function needed

/* ===== PARTICLE PORTRAIT ===== */
// Moved to separate file: particle-portrait.js

// Intro page removed - curtain starts immediately
// No intro page logic needed

// Debug: Log title overlay elements and ensure they start with pointer-events: none
console.log("Title overlay elements:", titleOverlayEls);
titleOverlayEls.forEach((title, i) => {
  console.log(`Title overlay ${i}:`, title, title ? title.textContent : "null");
  // Force pointer-events to none initially to allow mouse events to pass through to canvas
  if (title) {
    title.style.pointerEvents = "none";
  }
});

/* ===== CANVAS SETUP ===== */
function resize() {
  const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  params.centerX = innerWidth / 2; // Update center on resize
  seed();
}
addEventListener("resize", resize);

/* ===== POINTER ===== */
const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };

// Track mouse position - attach to both window and canvas for reliability
function handleMouseMove(e) {
  // Always update position, even if curtain not ready
  pointer.x = e.clientX; 
  pointer.y = e.clientY; 
  
  // Activate pointer if curtain is ready
  if (curtainReady) {
    if (!pointer.active) {
      console.log("Mouse moved - pointer.active set to true", "x:", pointer.x, "y:", pointer.y, "curtainReady:", curtainReady);
    }
    pointer.active = true;
  }
}

// Attach to window (global)
addEventListener("mousemove", handleMouseMove);

// Also attach to canvas for better reliability
canvas.addEventListener("mousemove", handleMouseMove);

// REMOVED all mouseleave/mouseout handlers - they were firing too frequently
// We'll rely ONLY on periodic bounds checking in the loop
// This prevents false positives when mouse moves between elements
// pointer.active will be set to true on mousemove and only reset by the loop's bounds check

/* ===== CLICK NAVIGATION ===== */
// Click on canvas to navigate (only if not clicking on a title)
// Note: Titles are above canvas (z-index 3 vs 2), so clicks on titles 
// should hit titles first. This check is just a safety measure.
let lastClickTime = 0;
canvas.addEventListener("click", (e) => {
  // Prevent clicks if curtain is not ready
  if (!curtainReady) {
    e.preventDefault();
    return;
  }
  
  const now = Date.now();
  if (now - lastClickTime < 300) return;
  lastClickTime = now;

  const clickedIdx = sectionIndex(e.clientX);
  // Sections are fixed position and already visible, so clicking just highlights them
  // If you want to add scrollable content sections later, uncomment this:
  /*
  const contentSection = document.getElementById(`content${clickedIdx}`) || 
                        document.getElementById(`sec${clickedIdx}`);
  
  if (contentSection) {
    contentSection.scrollIntoView({ 
      behavior: "smooth",
      block: "start"
    });
  }
  */
});

// Click on title to navigate
// Titles are above the canvas, so they should receive clicks first
// We use stopPropagation to prevent the click from bubbling to canvas
titleOverlayEls.forEach((titleEl, idx) => {
  if (titleEl) {
    // Initially disable interactions until curtain is ready
    // CSS already sets pointer-events: none, so mouse events pass through to canvas
    titleEl.style.cursor = "pointer";
    
    titleEl.addEventListener("click", (e) => {
      // Prevent clicks if curtain is not ready
      if (!curtainReady) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation(); // Stop the click from reaching the canvas below
      console.log(`Title ${idx} (${titleEl.textContent}) clicked!`);
      
      // Sections are fixed position behind the curtain, so they're already visible
      // If you want to add scrollable content sections later, you can uncomment this:
      /*
      const contentSection = document.getElementById(`content${idx}`) || 
                            document.getElementById(`sec${idx}`);
      
      if (contentSection) {
        console.log(`Scrolling to section ${idx}`);
        contentSection.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        });
      }
      */
      
      // For now, clicking on a title just keeps the hover state active
      // You could add other actions here if needed
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

/* ===== STRINGS (THEATRE-CURTAIN) ===== */
let strings = [];

function seed() {
  strings = [];
  const count = Math.max(90, Math.floor(innerWidth / 10));
  const gap = innerWidth / count;

  for (let i = 0; i < count; i++) {
    strings.push({
      baseX: (i + 0.5) * gap,
      x: (i + 0.5) * gap,
      vx: 0, // velocity for cloth-like momentum
      phase: Math.random() * 1000,
      wobble: 0.7 + Math.random() * 1.3,
      thickness: 1.3 + Math.random() * 1.4,
      alpha: 0.4 + Math.random() * 0.3, // more opaque for richer colors
      // Custom color palette: #F9DC5C #FAE588 #FCEFB4 #FDF4CB #FDF8E1
      // Converted to HSL: bright yellow, light yellow, pale yellow, very pale yellow, almost white yellow
      ...(function() {
        const palette = [
          { h: 48, s: 94, l: 67 },  // #F9DC5C - bright yellow
          { h: 48, s: 92, l: 75 },  // #FAE588 - light yellow
          { h: 48, s: 90, l: 85 },  // #FCEFB4 - pale yellow
          { h: 48, s: 88, l: 90 },  // #FDF4CB - very pale yellow
          { h: 48, s: 85, l: 93 }   // #FDF8E1 - almost white yellow
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];
        // Add very slight variation to make it more organic while keeping colors true to palette
        const hue = color.h + (Math.random() - 0.5) * 2; // Reduced variation
        const sat = Math.max(80, Math.min(100, color.s + (Math.random() - 0.5) * 3)); // Keep saturation high
        const light = Math.max(60, Math.min(95, color.l + (Math.random() - 0.5) * 3)); // Keep lightness in range
        return { hue, sat, light };
      })()
    });
  }
}

const params = {
  openRadius: 280, // wider opening to cover more of each section
  openStrength: 180, // stronger pull for more visible opening
  followEase: 0.18,
  returnEase: 0.10,
  clothDamping: 0.85, // cloth-like damping (lower = more resistance)
  clothInertia: 0.12, // how much momentum strings keep
  clothCoupling: 0.08 // how much neighboring strings influence each other (cloth folds)
};

function drawString(x, t, s) {
  const seg = 50; // More segments for very smooth, flexible curves
  const segH = innerHeight / seg;

  // ORGANIC ROPE TEXTURE: Draw multiple overlapping strokes with natural variations
  const ropeStrands = 3; // number of strands in the rope
  
  for (let strand = 0; strand < ropeStrands; strand++) {
    const strandOffset = (strand - (ropeStrands - 1) / 2) * 0.5;
    const baseThickness = s.thickness * (0.5 + strand * 0.2);
    
    // Draw entire string as one smooth, flexible curve
    ctx.beginPath();
    let firstPoint = true;
    
    for (let i = 0; i <= seg; i++) {
      const y = i * segH;
      const progress = i / seg;
      
      // Base playful wave - INCREASED for more visible flexibility
      const baseWave =
        Math.sin(t * 0.0014 + y * 0.018 + s.phase) * s.wobble * 1.3 +
        Math.cos(t * 0.0011 + y * 0.012) * s.wobble * 0.8;
      
      // Cloth-like sag: more sag lower down (gravity effect)
      const sag = Math.sin(progress * Math.PI) * 2.5 * progress * progress;
      
      // Cloth-like folds: subtle variation based on position
      const fold = Math.sin(t * 0.0008 + s.baseX * 0.015 + progress * 2) * 2 * progress;
      
      // ORGANIC ROPE TWIST: more pronounced spiral
      const twistPhase = y * 0.08 + t * 0.001 + strand * 2.1 + s.phase * 0.01;
      const twist = Math.sin(twistPhase) * 0.6 + Math.cos(twistPhase * 1.3) * 0.3;
      
      // ORGANIC IRREGULARITIES: natural bumps
      const irregularity = Math.sin(y * 0.12 + s.phase * 0.5 + strand) * 0.5 +
                           Math.cos(y * 0.07 + t * 0.0005) * 0.3;
      
      // Combine all effects for flexible, organic rope
      const wave = baseWave + sag + fold + twist + irregularity;
      const px = x + wave * (i / seg) + strandOffset;
      
      if (firstPoint) {
        ctx.moveTo(px, y);
        firstPoint = false;
      } else {
        // Use smooth curves - calculate control point for bezier
        const prevY = (i - 1) * segH;
        const prevProgress = (i - 1) / seg;
        const prevBaseWave = Math.sin(t * 0.0014 + prevY * 0.018 + s.phase) * s.wobble * 1.3 +
                            Math.cos(t * 0.0011 + prevY * 0.012) * s.wobble * 0.8;
        const prevSag = Math.sin(prevProgress * Math.PI) * 2.5 * prevProgress * prevProgress;
        const prevFold = Math.sin(t * 0.0008 + s.baseX * 0.015 + prevProgress * 2) * 2 * prevProgress;
        const prevTwistPhase = prevY * 0.08 + t * 0.001 + strand * 2.1 + s.phase * 0.01;
        const prevTwist = Math.sin(prevTwistPhase) * 0.6 + Math.cos(prevTwistPhase * 1.3) * 0.3;
        const prevIrregularity = Math.sin(prevY * 0.12 + s.phase * 0.5 + strand) * 0.5 +
                                 Math.cos(prevY * 0.07 + t * 0.0005) * 0.3;
        const prevWave = prevBaseWave + prevSag + prevFold + prevTwist + prevIrregularity;
        const prevPx = x + prevWave * ((i - 1) / seg) + strandOffset;
        
        // Control point for smooth curve
        const cpx = (prevPx + px) / 2;
        const cpy = (prevY + y) / 2;
        
        ctx.quadraticCurveTo(prevPx, prevY, cpx, cpy);
      }
    }
    
    // Apply organic thickness and color variation along the path
    const gradient = ctx.createLinearGradient(x - 50, 0, x + 50, innerHeight);
    const colorVar1 = Math.sin(s.phase * 0.3 + strand * 0.5) * 8;
    const colorVar2 = Math.sin(s.phase * 0.3 + strand * 0.5 + 1) * 8;
    const light1 = Math.max(15, Math.min(40, s.light - strand * 2 + colorVar1));
    const light2 = Math.max(15, Math.min(40, s.light - strand * 2 + colorVar2));
    gradient.addColorStop(0, `hsla(${s.hue},${s.sat}%,${light1}%,${s.alpha * (0.7 + strand * 0.15)})`);
    gradient.addColorStop(1, `hsla(${s.hue},${s.sat}%,${light2}%,${s.alpha * (0.7 + strand * 0.15)})`);
    
    // Thickness variation
    const thicknessVar = 1 + Math.sin(t * 0.0003 + s.phase) * 0.3;
    ctx.lineWidth = baseThickness * thicknessVar;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }
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
  // Always update debug display with current state
  const isHovering = curtainReady && pointer.active;
  
  // Periodically check if mouse is still within viewport bounds
  // This acts as a fallback deactivation if mouse truly left the window
  if (t % 60 === 0) { // Check every ~1 second
    if (pointer.active && (pointer.x < -50 || pointer.x > innerWidth + 50 || 
                           pointer.y < -50 || pointer.y > innerHeight + 50)) {
      pointer.active = false;
      console.log("Mouse out of bounds - pointer.active set to false", pointer.x, pointer.y);
    }
  }
  
  // Debug log when hovering state changes (but only occasionally to avoid spam)
  if (t % 180 === 0 && isHovering) { // Log every ~3 seconds when hovering
    console.log("HOVERING - Pointer active:", pointer.active, "Curtain ready:", curtainReady, "Mouse:", pointer.x, pointer.y);
  }
  
  // Only reveal if curtain is ready AND pointer is active
  // Curtain opens around the active section (4-section method)
  if (isHovering) {
    sectionsEl.style.opacity = "1";
    sectionsEl.style.setProperty("--reveal-x", `${snapX}px`);
    // Match reveal width to opening radius for better alignment
    sectionsEl.style.setProperty("--reveal-w", `${params.openRadius * 0.6}px`);

    sectionEls.forEach((el, i) => {
      el.style.opacity = i === idx ? "1" : "0";
    });
    
    // Show title in overlay (above canvas)
    titleOverlayEls.forEach((titleEl, i) => {
      if (titleEl) {
        const isVisible = i === idx;
        titleEl.style.opacity = isVisible ? "1" : "0";
        // Only enable pointer events when visible - allows mouse events to pass through to canvas when hidden
        titleEl.style.pointerEvents = isVisible ? "auto" : "none";
      }
    });
    
  } else {
    sectionsEl.style.opacity = "0";
    sectionsEl.style.setProperty("--reveal-w", "0px");
    sectionEls.forEach((el, i) => {
      el.style.opacity = "0";
    });
    // Hide all titles and disable their pointer events
    titleOverlayEls.forEach(titleEl => {
      if (titleEl) {
        titleEl.style.opacity = "0";
        titleEl.style.pointerEvents = "none"; // Allow mouse events to pass through
      }
    });
  }
  
  // Always update debug display with current state - read values directly
  if (debugEl) {
    const titleEl = titleOverlayEls[idx];
    // Read values directly from the variables to ensure we get current state
    const currentPointerActive = pointer.active;
    const currentCurtainReady = curtainReady;
    const currentIsHovering = currentCurtainReady && currentPointerActive;
    const status = currentIsHovering ? "HOVERING ✓" : "Not hovering";
    
    debugEl.innerHTML = `
      Status: ${status}<br>
      Pointer active: ${currentPointerActive} (type: ${typeof currentPointerActive})<br>
      Curtain ready: ${currentCurtainReady} (type: ${typeof currentCurtainReady})<br>
      isHovering: ${currentIsHovering}<br>
      Mouse: ${Math.floor(pointer.x)}, ${Math.floor(pointer.y)}<br>
      Active section: ${idx}<br>
      ${titleEl ? `Title: "${titleEl.textContent}"` : 'Title: NOT FOUND'}<br>
      Snap X: ${Math.floor(snapX)}<br>
      Target snap: ${Math.floor(targetSnap)}
    `;
    
    // Log if values don't match what we expect
    if (currentCurtainReady === false && t > 5000) { // After 5 seconds, curtain should be ready
      if (t % 180 === 0) { // Log occasionally
        console.warn("WARNING: curtainReady is false but should be true! t:", t, "introAnimationComplete:", introAnimationComplete);
      }
    }
    
    // Also log current state every 3 seconds for debugging
    if (t % 180 === 0) {
      console.log("Debug display update - curtainReady:", curtainReady, "pointer.active:", pointer.active, "t:", t);
    }
  }

  /* update strings - CURTAIN with CLOTH-LIKE physics (4-section method) */
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    let tx = s.baseX;

    // CURTAIN: Opens around the active section (snapX) when hovering
    // Strings near the section center pull outward (left/right)
    // This creates an opening that follows the 4-section system
    if (curtainReady && pointer.active) {
      const d = Math.abs(s.baseX - snapX);
      if (d < params.openRadius) {
        // Smooth falloff curve
        const f = 1 - d / params.openRadius;
        const eased = f * f * (3 - 2 * f); // smoothstep for smoother opening
        // Left side of section goes left, right side goes right
        const dir = s.baseX < snapX ? -1 : 1;
        tx = s.baseX + dir * params.openStrength * eased;
      }
    }

    // Cloth-like physics: accumulate velocity for momentum
    const targetEase = curtainReady && pointer.active ? params.followEase : params.returnEase;
    const force = (tx - s.x) * targetEase;
    
    // Add force to velocity (momentum)
    s.vx += force * params.clothInertia;
    // Apply damping
    s.vx *= params.clothDamping;
    
    // Clamp velocity to prevent wild movements
    s.vx = Math.max(-10, Math.min(10, s.vx));
    
    // Update position
    s.x += s.vx;
    
    // Subtle neighbor coupling for cloth folds (only when opening)
    if (curtainReady && pointer.active && params.clothCoupling > 0 && i > 0 && i < strings.length - 1) {
      const avgNeighborX = (strings[i - 1].x + strings[i + 1].x) / 2;
      // Very subtle pull toward neighbors
      s.x += (avgNeighborX - s.x) * params.clothCoupling * 0.3;
    }
  }

  // Use source-over instead of lighter for matte, non-shiny appearance
  ctx.globalCompositeOperation = "source-over";
  strings.forEach(s => drawString(s.x, t, s));

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

