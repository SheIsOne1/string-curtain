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
    // Ensure display is set
    title.style.display = "flex";
  } else {
    console.error(`Title ${i} is null!`);
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
      wobble: 0.9 + Math.random() * 1.1, // Natural variation for smooth movement
      thickness: 0.8 + Math.random() * 0.6, // Thinner like hair strands
      alpha: 0.70 + Math.random() * 0.18, // Gentler opacity variation
      // Smooth hand-drawn animation properties
      waveSpeed: 0.7 + Math.random() * 0.4, // Smooth wave speed
      waveFreq: 0.014 + Math.random() * 0.010, // Natural frequency
      naturalSway: Math.random() * Math.PI * 2, // natural sway phase
      mass: 0.4 + Math.random() * 0.25, // Natural weight for smooth flow
      curlAmount: 0.6 + Math.random() * 0.4, // Individual curl intensity (0.6-1.0)
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
  followEase: 0.05, // Very smooth brush stroke response
  returnEase: 0.04, // Very smooth brush stroke return
  clothDamping: 0.97, // Very high damping for smooth brush stroke (no bounce)
  clothInertia: 0.06, // Very low inertia for smooth brush stroke
  clothCoupling: 0.02 // Minimal coupling for smooth independence
};

function drawString(x, t, s) {
  const seg = 60; // More segments for very smooth, gentle curves
  const segH = innerHeight / seg;

  // GENTLE HAIR TEXTURE: Draw soft, smooth strokes with gentle variations
  const ropeStrands = 2; // Fewer strands for gentler appearance
  
  for (let strand = 0; strand < ropeStrands; strand++) {
    const strandOffset = (strand - (ropeStrands - 1) / 2) * 0.3; // Closer strands for gentler look
    const baseThickness = s.thickness * (0.6 + strand * 0.15); // Softer thickness variation
    
    // Draw entire string as one smooth, flexible curve
    ctx.beginPath();
    ctx.moveTo(x + strandOffset, 0);
    
    for (let i = 1; i <= seg; i++) {
      const y = i * segH;
      const progress = i / seg;
      
      // SMOOTH HAND-DRAWN WAVES - flowing, natural waves with curl
      const waveTravel = (t * s.waveSpeed * 0.0008) + (y * s.waveFreq); // Smooth wave travel
      const baseWave =
        Math.sin(waveTravel + s.phase) * s.wobble * 1.2 +
        Math.cos(waveTravel * 0.7 + s.phase * 0.8) * s.wobble * 0.8 +
        Math.sin(waveTravel * 1.6 + s.naturalSway) * s.wobble * 0.5; // Natural harmonics
      
      // HAIR CURL - spiral/curl effect like natural hair
      const curlPhase = y * 0.15 + t * s.waveSpeed * 0.0006 + s.phase * 0.5;
      const curl = (Math.sin(curlPhase) * 0.8 * progress +
                   Math.cos(curlPhase * 1.2) * 0.6 * progress +
                   Math.sin(curlPhase * 0.5) * 0.4 * progress) * s.curlAmount; // Individual curl intensity
      
      // SMOOTH SAG - natural, flowing sag
      const sagAmount = 1.5 + Math.sin(t * 0.00025 + s.phase) * 0.3; // Natural sag
      const sag = Math.sin(progress * Math.PI) * sagAmount * progress * progress;
      
      // SMOOTH FOLDS - natural, flowing movement
      const foldPhase = t * 0.0007 + s.baseX * 0.016 + progress * 2.1;
      const fold = Math.sin(foldPhase) * 1.1 * progress +
                   Math.cos(foldPhase * 1.35) * 0.8 * progress; // Natural folds
      
      // HAIR CURL TWIST - stronger spiral twist for curly hair
      const twistPhase = y * 0.12 + t * s.waveSpeed * 0.0008 + strand * 2.8 + s.phase * 0.02;
      const twist = Math.sin(twistPhase) * 0.5 * progress + 
                   Math.cos(twistPhase * 1.4) * 0.35 * progress +
                   Math.sin(twistPhase * 0.7) * 0.25 * progress; // Stronger curl effect
      
      // SMOOTH IRREGULARITIES - natural texture
      const irregularity = Math.sin(y * 0.13 + s.phase * 0.55 + strand) * 0.3 +
                           Math.cos(y * 0.085 + t * 0.00035) * 0.18; // Natural detail
      
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
      
      // Combine all effects with curl for curly hair
      const wave = baseWave + sag + fold + twist + curl + irregularity + responseWave;
      const px = x + wave * (i / seg) + strandOffset;
      
      ctx.lineTo(px, y);
    }
    
    // Draw with gentle, soft colors
    const colorVar = Math.sin(s.phase * 0.2 + strand * 0.4) * 1.5; // Gentler color variation
    // Softer lightness for gentle appearance (70-88 range)
    const light = Math.max(70, Math.min(88, s.light - strand * 0.2 + colorVar));
    // Softer alpha for gentle appearance
    const alpha = Math.min(0.85, s.alpha * (0.88 + strand * 0.02));
    
    // Gentle thickness variation
    const thicknessVar = 1 + Math.sin(t * 0.0002 + s.phase) * 0.15; // Gentler variation
    ctx.lineWidth = baseThickness * thicknessVar;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Use softer, gentler yellow colors
    ctx.strokeStyle = `hsla(${s.hue},${Math.max(82, Math.min(95, s.sat - 3))}%,${light}%,${alpha})`;
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
    
    // Show title in overlay (appears on hover)
    titleOverlayEls.forEach((titleEl, i) => {
      if (!titleEl) {
        console.error(`✗ Title element ${i} is null!`);
        return;
      }
      
      const isVisible = i === idx;
      if (isVisible) {
        // Force show the title using class + inline styles
        titleEl.classList.add("visible");
        titleEl.style.opacity = "1";
        titleEl.style.visibility = "visible";
        titleEl.style.display = "flex";
        titleEl.style.pointerEvents = "auto";
        titleEl.style.zIndex = "10";
        
        const computed = getComputedStyle(titleEl);
        const rect = titleEl.getBoundingClientRect();
        console.log(`✓ Showing title ${i}: "${titleEl.textContent}"`, {
          element: titleEl,
          textContent: titleEl.textContent,
          hasVisibleClass: titleEl.classList.contains("visible"),
          inlineStyles: {
            opacity: titleEl.style.opacity,
            visibility: titleEl.style.visibility,
            display: titleEl.style.display
          },
          computedStyles: {
            opacity: computed.opacity,
            visibility: computed.visibility,
            display: computed.display,
            zIndex: computed.zIndex,
            position: computed.position,
            color: computed.color
          },
          boundingRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          }
        });
      } else {
        titleEl.classList.remove("visible");
        titleEl.style.opacity = "0";
        titleEl.style.visibility = "hidden";
        titleEl.style.pointerEvents = "none";
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

    // BRUSH STROKE PHYSICS: Smooth, flowing, no bounce
    const targetEase = curtainReady && pointer.active ? params.followEase : params.returnEase;
    
    // Direct smooth interpolation like brush stroke (no physics bounce)
    const diff = tx - s.x;
    const smoothMove = diff * targetEase;
    
    // Very low inertia for smooth brush stroke
    const effectiveInertia = params.clothInertia / s.mass;
    s.vx += smoothMove * effectiveInertia;
    
    // Very high damping to eliminate all bounce (brush stroke smoothness)
    const damping = params.clothDamping + (s.mass - 0.4) * 0.008;
    s.vx *= damping;
    
    // Low velocity for smooth brush stroke
    const maxVel = 3.5 + s.wobble * 0.8; // Smooth brush stroke speed
    s.vx = Math.max(-maxVel, Math.min(maxVel, s.vx));
    
    // Kill any tiny velocities that cause bounce/jitter
    if (Math.abs(s.vx) < 0.05) {
      s.vx = 0; // Complete stop for smooth brush stroke
    }
    
    // Additional smoothing for brush stroke feel
    s.vx *= 0.98; // Extra smoothing
    
    // Update position
    s.x += s.vx;
    
    // HAND-DRAWN ANIMATION COUPLING - smooth, minimal coupling
    if (i > 0 && i < strings.length - 1) {
      const left = strings[i - 1];
      const right = strings[i + 1];
      
      // Calculate neighbor influence (very weak for smooth independence)
      const couplingStrength = curtainReady && pointer.active 
        ? params.clothCoupling * 0.2
        : params.clothCoupling * 0.05; // Minimal coupling
      
      // Smooth neighbor position influence
      const avgNeighborX = (left.x + right.x) / 2;
      const neighborInfluence = (avgNeighborX - s.x) * couplingStrength;
      
      // Smooth neighbor velocity influence
      const avgNeighborVx = (left.vx + right.vx) / 2;
      const velocityInfluence = (avgNeighborVx - s.vx) * couplingStrength * 0.15;
      
      s.x += neighborInfluence;
      s.vx += velocityInfluence;
    }
    
    // SMOOTH DRIFT - natural individual movement
    const drift = Math.sin(t * 0.0002 + s.phase * 0.02) * 0.15 +
                  Math.cos(t * 0.0001 + s.phase * 0.016) * 0.1; // Natural variation
    s.x += drift;
  }

  // Use source-over for gentle, soft appearance
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

