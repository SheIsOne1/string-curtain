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

// Debug: Log title overlay elements - initialize them as hidden
console.log("Title overlay elements:", titleOverlayEls);
titleOverlayEls.forEach((title, i) => {
  console.log(`Title overlay ${i}:`, title, title ? title.textContent : "null");
  // Initialize titles as hidden (behind curtain, appear on hover)
  if (title) {
    title.style.opacity = "0";
    title.style.visibility = "hidden";
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

/* ===== CLICK NAVIGATION ===== */
// Click on title in header to navigate (optional - hover already works)
titleOverlayEls.forEach((titleEl, idx) => {
  if (titleEl) {
    titleEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Title ${idx} (${titleEl.textContent}) clicked!`);
      // Clicking a title can trigger additional actions if needed
      // Hover already handles the reveal, so this is optional
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
      alpha: 0.85 + Math.random() * 0.15, // high opacity for visibility
      // Organic movement properties - each string unique
      waveSpeed: 0.8 + Math.random() * 0.4, // unique wave speed per string
      waveFreq: 0.015 + Math.random() * 0.008, // unique frequency
      naturalSway: Math.random() * Math.PI * 2, // natural sway phase
      mass: 0.8 + Math.random() * 0.4, // unique mass affects response
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
    ctx.moveTo(x + strandOffset, 0);
    
    for (let i = 1; i <= seg; i++) {
      const y = i * segH;
      const progress = i / seg;
      
      // ORGANIC WAVE PROPAGATION - waves travel down the string naturally
      const waveTravel = (t * s.waveSpeed * 0.001) + (y * s.waveFreq);
      const baseWave =
        Math.sin(waveTravel + s.phase) * s.wobble * 1.3 +
        Math.cos(waveTravel * 0.7 + s.phase * 0.8) * s.wobble * 0.8 +
        Math.sin(waveTravel * 1.5 + s.naturalSway) * s.wobble * 0.4; // natural sway
      
      // ORGANIC GRAVITY SAG - more realistic sag with variation
      const sagAmount = 2.5 + Math.sin(t * 0.0003 + s.phase) * 0.5; // varying gravity
      const sag = Math.sin(progress * Math.PI) * sagAmount * progress * progress;
      
      // ORGANIC FOLDS - respond to movement and position
      const foldPhase = t * 0.0008 + s.baseX * 0.015 + progress * 2;
      const fold = Math.sin(foldPhase) * 2 * progress +
                   Math.cos(foldPhase * 1.3) * 1.2 * progress; // more complex fold
      
      // ORGANIC ROPE TWIST - natural spiral with variation
      const twistPhase = y * 0.08 + t * s.waveSpeed * 0.001 + strand * 2.1 + s.phase * 0.01;
      const twist = Math.sin(twistPhase) * 0.6 + 
                   Math.cos(twistPhase * 1.3) * 0.3 +
                   Math.sin(twistPhase * 0.5) * 0.2; // additional twist harmonics
      
      // ORGANIC IRREGULARITIES - natural bumps and texture
      const irregularity = Math.sin(y * 0.12 + s.phase * 0.5 + strand) * 0.5 +
                           Math.cos(y * 0.07 + t * 0.0005) * 0.3 +
                           Math.sin(y * 0.2 + t * 0.0003 + s.phase) * 0.2; // more texture
      
      // ORGANIC RESPONSE - strings respond to their position relative to opening
      let responseWave = 0;
      if (curtainReady && pointer.active) {
        const distFromSnap = Math.abs(s.baseX - snapX);
        if (distFromSnap < params.openRadius * 1.5) {
          const response = (1 - distFromSnap / (params.openRadius * 1.5)) * 0.3;
          const responsePhase = t * 0.002 + s.baseX * 0.02;
          // Strings near opening have more movement
          responseWave = Math.sin(responsePhase) * response * progress;
        }
      }
      
      // Combine all effects for flexible, organic rope
      const wave = baseWave + sag + fold + twist + irregularity + responseWave;
      const px = x + wave * (i / seg) + strandOffset;
      
      ctx.lineTo(px, y);
    }
    
    // Draw with solid color for better visibility - make it bright!
    const colorVar = Math.sin(s.phase * 0.3 + strand * 0.5) * 2;
    // Keep lightness high for visibility (65-90 range)
    const light = Math.max(65, Math.min(90, s.light - strand * 0.3 + colorVar));
    // High alpha for visibility
    const alpha = Math.min(1.0, s.alpha * (0.95 + strand * 0.03));
    
    // Thickness variation
    const thicknessVar = 1 + Math.sin(t * 0.0003 + s.phase) * 0.2;
    ctx.lineWidth = baseThickness * thicknessVar;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Use bright yellow colors with high opacity
    ctx.strokeStyle = `hsla(${s.hue},${Math.max(85, s.sat)}%,${light}%,${alpha})`;
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
  
  // Only reveal if curtain is ready AND pointer is active
  // Curtain opens around the active section (4-section method)
  if (isHovering) {
    sectionsEl.style.opacity = "1";
    // Vertical reveal from top
    const revealH = Math.min(innerHeight, params.openRadius * 2);
    sectionsEl.style.setProperty("--reveal-y", "0px"); // Start from top
    sectionsEl.style.setProperty("--reveal-h", `${revealH}px`);
    // Horizontal section selection
    sectionsEl.style.setProperty("--reveal-section-left", `${idx * 25}%`);
    sectionsEl.style.setProperty("--reveal-section-right", `${(idx + 1) * 25}%`);
    

    sectionEls.forEach((el, i) => {
      el.style.opacity = i === idx ? "1" : "0";
    });
    
    // Show title in overlay (behind curtain, appears on hover)
    titleOverlayEls.forEach((titleEl, i) => {
      if (titleEl) {
        const isVisible = i === idx;
        if (isVisible) {
          titleEl.style.opacity = "1";
          titleEl.style.visibility = "visible";
          titleEl.style.pointerEvents = "auto";
        } else {
          titleEl.style.opacity = "0";
          titleEl.style.visibility = "hidden";
          titleEl.style.pointerEvents = "none";
        }
      }
    });
    
  } else {
    sectionsEl.style.opacity = "0";
    sectionsEl.style.setProperty("--reveal-h", "0px");
    sectionEls.forEach((el, i) => {
      el.style.opacity = "0";
    });
    // Hide all titles and disable their pointer events
    titleOverlayEls.forEach(titleEl => {
      if (titleEl) {
        titleEl.style.opacity = "0";
        titleEl.style.visibility = "hidden";
        titleEl.style.pointerEvents = "none"; // Allow mouse events to pass through
      }
    });
  }
  
  // Always update debug display with current state - read values directly
  if (debugEl) {
    const titleEl = idx >= 0 ? titleOverlayEls[idx] : null;
    // Read values directly from the variables to ensure we get current state
    const currentPointerActive = pointer.active;
    const currentCurtainReady = curtainReady;
    const currentIsHovering = currentCurtainReady && currentPointerActive && idx >= 0;
    const status = currentIsHovering ? "HOVERING ✓" : "Not hovering";
    
    debugEl.innerHTML = `
      Status: ${status}<br>
      Pointer active: ${currentPointerActive}<br>
      Curtain ready: ${currentCurtainReady}<br>
      Hovered title: ${idx >= 0 ? idx : "none"}<br>
      Active section: ${idx >= 0 ? idx : "none"}<br>
      ${titleEl ? `Title: "${titleEl.textContent}"` : 'Title: NOT HOVERED'}<br>
      Snap X: ${Math.floor(snapX)}<br>
      Target snap: ${Math.floor(targetSnap)}
    `;
  }

  /* update strings - CURTAIN with CLOTH-LIKE physics (opens from top) */
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

    // ORGANIC PHYSICS: More natural cloth-like movement
    const targetEase = curtainReady && pointer.active ? params.followEase : params.returnEase;
    const force = (tx - s.x) * targetEase;
    
    // Mass affects how strings respond (heavier strings move slower)
    const effectiveInertia = params.clothInertia / s.mass;
    s.vx += force * effectiveInertia;
    
    // Organic damping - varies slightly per string
    const damping = params.clothDamping + (s.mass - 1) * 0.02;
    s.vx *= damping;
    
    // Natural velocity limits (not too rigid)
    const maxVel = 8 + s.wobble * 2; // more flexible strings can move faster
    s.vx = Math.max(-maxVel, Math.min(maxVel, s.vx));
    
    // Update position
    s.x += s.vx;
    
    // ORGANIC NEIGHBOR COUPLING - creates natural ripple effects
    if (i > 0 && i < strings.length - 1) {
      const left = strings[i - 1];
      const right = strings[i + 1];
      
      // Calculate neighbor influence (stronger when curtain is active)
      const couplingStrength = curtainReady && pointer.active 
        ? params.clothCoupling * 0.5 
        : params.clothCoupling * 0.2;
      
      // Average neighbor position creates natural folds
      const avgNeighborX = (left.x + right.x) / 2;
      const neighborInfluence = (avgNeighborX - s.x) * couplingStrength;
      
      // Also consider neighbor velocities for wave propagation
      const avgNeighborVx = (left.vx + right.vx) / 2;
      const velocityInfluence = (avgNeighborVx - s.vx) * couplingStrength * 0.3;
      
      s.x += neighborInfluence;
      s.vx += velocityInfluence;
    }
    
    // ORGANIC DRIFT - subtle natural drift for more life
    const drift = Math.sin(t * 0.0002 + s.phase * 0.01) * 0.1;
    s.x += drift;
  }

  // Use source-over instead of lighter for matte, non-shiny appearance
  ctx.globalCompositeOperation = "source-over";
  
  // Draw all strings
  if (strings.length === 0) {
    console.warn("No strings to draw! strings.length:", strings.length);
  } else {
    strings.forEach(s => drawString(s.x, t, s));
  }

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

