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
  returnEase: 0.10,
  clothDamping: 0.85, // cloth-like damping (lower = more resistance)
  clothInertia: 0.12, // how much momentum strings keep
  clothCoupling: 0.08 // how much neighboring strings influence each other (cloth folds)
};

function drawString(x, t, s) {
  const seg = 26;
  const segH = innerHeight / seg;

  ctx.beginPath();
  ctx.moveTo(x, 0);

  for (let i = 1; i <= seg; i++) {
    const y = i * segH;
    const progress = i / seg; // 0 to 1 down the string
    
    // Base playful wave (keeps the fun appearance)
    const baseWave =
      Math.sin(t * 0.0014 + y * 0.018 + s.phase) * s.wobble +
      Math.cos(t * 0.0011 + y * 0.012) * s.wobble * 0.6;
    
    // Cloth-like sag: more sag lower down (gravity effect)
    const sag = Math.sin(progress * Math.PI) * 2 * progress * progress;
    
    // Cloth-like folds: subtle variation based on position
    const fold = Math.sin(t * 0.0008 + s.baseX * 0.015 + progress * 2) * 1.5 * progress;
    
    // Combine: base wave + sag + folds for cloth-like appearance
    const wave = baseWave + sag + fold;
    
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

  /* update strings - THEATRE CURTAIN with CLOTH-LIKE physics */
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    let tx = s.baseX;

    // THEATRE CURTAIN: Opens from center when hovering
    // Left side pulls left, right side pulls right
    if (curtainReady && pointer.active) {
      const centerX = innerWidth / 2;
      const distFromCenter = Math.abs(s.baseX - centerX);
      
      if (distFromCenter < params.openRadius) {
        const f = 1 - distFromCenter / params.openRadius;
        // Left side goes left, right side goes right
        const dir = s.baseX < centerX ? -1 : 1;
        tx = s.baseX + dir * params.openStrength * f * f;
      }
    }

    // CLOTH-LIKE PHYSICS: Add momentum/inertia
    const targetEase = curtainReady && pointer.active ? params.followEase : params.returnEase;
    const force = (tx - s.x) * targetEase;
    
    // Apply force with momentum (cloth-like inertia)
    s.vx += force * params.clothInertia;
    s.vx *= params.clothDamping; // cloth damping
    
    // Clamp velocity to prevent wild movements
    s.vx = Math.max(-8, Math.min(8, s.vx));
    
    // Update position with velocity
    s.x += s.vx;
    
    // CLOTH-LIKE COUPLING: Neighboring strings influence each other (creates folds)
    if (params.clothCoupling > 0) {
      let neighborInfluence = 0;
      let neighborCount = 0;
      
      // Check left neighbor
      if (i > 0) {
        neighborInfluence += strings[i - 1].x;
        neighborCount++;
      }
      // Check right neighbor
      if (i < strings.length - 1) {
        neighborInfluence += strings[i + 1].x;
        neighborCount++;
      }
      
      if (neighborCount > 0) {
        const avgNeighborX = neighborInfluence / neighborCount;
        // Subtle pull toward neighbors (creates cloth-like folds)
        s.x += (avgNeighborX - s.x) * params.clothCoupling;
      }
    }
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

