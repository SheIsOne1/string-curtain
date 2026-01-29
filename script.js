// Updated: Removed content section errors - cache bust: 2024-01
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
let introAnimationComplete = false; // Track when intro animation is complete
let curtainReady = false; // Track when curtain is ready for interaction

// Disable all interactions initially
canvas.style.opacity = "0";
canvas.style.pointerEvents = "none";
sectionsEl.style.opacity = "0";
if (debugEl) debugEl.style.opacity = "0";

// Block all interactions on the page until curtain is ready
document.body.style.pointerEvents = "none";
document.body.style.userSelect = "none";
document.body.style.cursor = "wait";

// Block keyboard events
function blockAllInteractions(e) {
  if (!curtainReady) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

// Add event listeners to block all interactions
document.addEventListener("keydown", blockAllInteractions, true);
document.addEventListener("keyup", blockAllInteractions, true);
document.addEventListener("keypress", blockAllInteractions, true);
document.addEventListener("contextmenu", blockAllInteractions, true);
document.addEventListener("mousedown", blockAllInteractions, true);
document.addEventListener("mouseup", blockAllInteractions, true);
document.addEventListener("touchstart", blockAllInteractions, true);
document.addEventListener("touchend", blockAllInteractions, true);
document.addEventListener("touchmove", blockAllInteractions, true);

// Handle intro page transition
function hideIntro() {
  // Prevent skipping animation - only allow after animation completes
  if (!introAnimationComplete) return;
  if (!introShown) return;
  introShown = false;
  
  if (introPage) {
    introPage.classList.add("hidden");
  }
  
  // Show curtain animation after intro fades out
  setTimeout(() => {
    console.log("Showing canvas, opacity set to 1");
    canvas.style.opacity = "1";
    canvas.style.transition = "opacity 0.5s ease-in";
    if (debugEl) debugEl.style.opacity = "1";
    
    // Enable interactions ONLY after BOTH Bella animation AND curtain fade-in completes
    const enableInteractions = () => {
      console.log("enableInteractions called, introAnimationComplete:", introAnimationComplete);
      // Double-check that both animations are complete before enabling interactions
      if (!introAnimationComplete) {
        console.log("Intro animation not complete yet, retrying in 100ms...");
        // If for some reason intro isn't complete, wait a bit more
        setTimeout(enableInteractions, 100);
        return;
      }
      
      console.log("Setting curtainReady = true");
      curtainReady = true;
      console.log("Curtain ready! Hover interactions enabled. pointer.active:", pointer.active, "curtainReady:", curtainReady);
      
      // Verify curtainReady was set correctly
      if (curtainReady !== true) {
        console.error("ERROR: curtainReady was not set correctly! Value:", curtainReady);
      } else {
        console.log("✓ curtainReady successfully set to true, value verified:", curtainReady);
      }
      
      // Force debug display to update by reading curtainReady again
      // This ensures any potential scope issues are resolved
      window.curtainReady = curtainReady; // Also store on window for debugging
      
      // Re-enable all interactions on the page
      document.body.style.pointerEvents = "auto";
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "default";
      
      // Remove blocking event listeners
      document.removeEventListener("keydown", blockAllInteractions, true);
      document.removeEventListener("keyup", blockAllInteractions, true);
      document.removeEventListener("keypress", blockAllInteractions, true);
      document.removeEventListener("contextmenu", blockAllInteractions, true);
      document.removeEventListener("mousedown", blockAllInteractions, true);
      document.removeEventListener("mouseup", blockAllInteractions, true);
      document.removeEventListener("touchstart", blockAllInteractions, true);
      document.removeEventListener("touchend", blockAllInteractions, true);
      document.removeEventListener("touchmove", blockAllInteractions, true);
      
      canvas.style.pointerEvents = "auto"; // Enable hover interactions
      console.log("Canvas pointer-events set to auto");
      
      // Force a mouse move check to activate pointer if mouse is already over canvas
      // Create a synthetic mousemove event to trigger activation
      const syntheticEvent = new MouseEvent("mousemove", {
        clientX: pointer.x,
        clientY: pointer.y,
        bubbles: true
      });
      handleMouseMove(syntheticEvent);
      
      // Also directly activate if mouse is within bounds
      const mouseOverCanvas = pointer.x >= 0 && pointer.x <= innerWidth && 
                              pointer.y >= 0 && pointer.y <= innerHeight;
      if (mouseOverCanvas) {
        pointer.active = true;
        console.log("Curtain ready - pointer activated directly, mouse is over canvas at", pointer.x, pointer.y);
      }
      
      // Title interactions will be enabled individually when they become visible
      // They start with pointer-events: none in CSS to allow mouse events to pass through to canvas
    };
    
    console.log("Scheduling enableInteractions in 500ms...");
    setTimeout(() => {
      console.log("Calling enableInteractions now...");
      enableInteractions();
    }, 500); // Wait for the 0.5s fade-in transition to complete
  }, 500);
}

/* ===== PARTICLE PORTRAIT ===== */
// Moved to separate file: particle-portrait.js

// Click on intro page to proceed (only after animation completes)
if (introPage) {
  // Block intro page clicks until animation completes
  introPage.addEventListener("click", (e) => {
    if (!introAnimationComplete) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    hideIntro();
  });
  
  // Mark animation as complete and allow transitions
  // fadeInScale (0.8s) + delay (0.3s) + lights (2.5s) = 3.6s total
  setTimeout(() => {
    introAnimationComplete = true;
    // Auto-transition after a short pause
    setTimeout(hideIntro, 300);
  }, 3600);
  
  // Also listen for animation end event as a backup
  const introTitle = introPage.querySelector('.intro-title');
  if (introTitle) {
    introTitle.addEventListener('animationend', (e) => {
      if (e.animationName === 'lights' && introShown) {
        introAnimationComplete = true;
        // Wait a bit after animation ends, then allow transition
        setTimeout(hideIntro, 300);
      }
    });
  }
}

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

/* ===== STRINGS (THEATRE-CURTAIN PHYSICS) ===== */
let strings = [];

// Simple mass–spring params - tuned for stable, smooth motion
const STRING_SEGMENTS = 18;      // number of points per string
const GRAVITY = 0.15;            // gentle downward pull
const DAMPING = 0.88;            // stronger damping for stability
const SPRING_STIFFNESS = 0.08;   // softer springs to prevent oscillations
const HANG_STIFFNESS = 0.10;     // gentler horizontal pull
const PHYSICS_STEPS = 1;         // single step for smoother motion

function seed() {
  strings = [];
  const count = Math.max(70, Math.floor(innerWidth / 11)); // slightly fewer but thicker
  const gap = innerWidth / count;
  const restLen = innerHeight / (STRING_SEGMENTS - 1);

  for (let i = 0; i < count; i++) {
    const baseX = (i + 0.5) * gap;

    // Pre-calc color / style
    const thickness = 1.4 + Math.random() * 1.6;
    const alpha = 0.3 + Math.random() * 0.3;
    const hue = Math.random() * 360;
    const sat = 55 + Math.random() * 15;
    const light = 72 + Math.random() * 12;

    // Build a vertical chain of points
    const points = [];
    for (let j = 0; j < STRING_SEGMENTS; j++) {
      const y = (j / (STRING_SEGMENTS - 1)) * innerHeight;
      points.push({
        x: baseX,
        y,
        vx: 0,
        vy: 0
      });
    }

    strings.push({
      baseX,
      points,
      restLen,
      thickness,
      alpha,
      hue,
      sat,
      light
    });
  }
}

const params = {
  openRadius: 280,   // opening radius
  openStrength: 120, // gentler pull for smooth, controlled opening
  followEase: 0.22,
  returnEase: 0.10,
  centerX: innerWidth / 2  // center point where curtain splits
};

function drawString(s) {
  const pts = s.points;
  if (!pts.length) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
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
  // Theatre curtain opens from center
  if (isHovering) {
    sectionsEl.style.opacity = "1";
    const centerX = innerWidth / 2;
    sectionsEl.style.setProperty("--reveal-x", `${centerX}px`);
    sectionsEl.style.setProperty("--reveal-w", `${params.openRadius * 0.5}px`);

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

  /* update strings with theatre curtain physics - opens from center */
  for (let step = 0; step < PHYSICS_STEPS; step++) {
    for (const s of strings) {
      const pts = s.points;

      // THEATRE CURTAIN: Determine opening based on distance from CENTER
      // Left side pulls left, right side pulls right
      let targetTopX = s.baseX;
      if (curtainReady && pointer.active) {
        const centerX = innerWidth / 2;
        const distFromCenter = Math.abs(s.baseX - centerX);
        
        // If string is within opening radius of center, pull it outward smoothly
        if (distFromCenter < params.openRadius) {
          const f = 1 - distFromCenter / params.openRadius;
          // Smooth easing curve for gradual opening
          const eased = f * f * (3 - 2 * f); // smoothstep
          // Left side goes left, right side goes right
          const dir = s.baseX < centerX ? -1 : 1;
          targetTopX = s.baseX + dir * params.openStrength * eased;
        }
      }
      
      // Smoothly ease the top point to target (prevents sudden jumps)
      const topEase = 0.15;
      pts[0].x += (targetTopX - pts[0].x) * topEase;

      // Pin top point to the rod (y is fixed, x is eased above)
      pts[0].y = 0;
      pts[0].vx = 0;
      pts[0].vy = 0;

      // Apply gravity, a bit of side "wind", and horizontal "hang" towards the rod under the top point
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        p.vy += GRAVITY;

        // Gentle pull under the rod horizontally, so strings line up beneath the top
        const hangTargetX = pts[0].x; // Use actual top position
        p.vx += (hangTargetX - p.x) * HANG_STIFFNESS;

        // Very subtle wind - much reduced to prevent chaos
        const wind =
          Math.sin((t * 0.0008) + (s.baseX * 0.01) + i * 0.15) * 0.02;
        p.vx += wind;
      }

      // Vertical springs between neighbouring points
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = (dist - s.restLen) / dist;
        const forceX = dx * diff * SPRING_STIFFNESS;
        const forceY = dy * diff * SPRING_STIFFNESS;

        // Top point is pinned; only move the lower one
        if (i > 0) {
          p1.vx += forceX * 0.5;
          p1.vy += forceY * 0.5;
        }
        p2.vx -= forceX * 0.5;
        p2.vy -= forceY * 0.5;
      }

      // Integrate positions with damping and simple floor collision
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        
        // Apply damping before integration for stability
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        
        // Clamp velocities to prevent wild movements
        p.vx = Math.max(-15, Math.min(15, p.vx));
        p.vy = Math.max(-15, Math.min(15, p.vy));

        p.x += p.vx;
        p.y += p.vy;

        // Soft floor to keep curtain within view
        if (p.y > innerHeight) {
          p.y = innerHeight;
          if (p.vy > 0) p.vy *= -0.3;
        }
        
        // Keep points within reasonable bounds
        p.x = Math.max(-50, Math.min(innerWidth + 50, p.x));
      }
    }
  }

  ctx.globalCompositeOperation = "lighter";
  strings.forEach(s => drawString(s));
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

