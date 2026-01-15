/* ===== PARTICLE PORTRAIT using p5.js ===== */
// Note: p5.js requires functions to be in global scope
// No global variables declared here to avoid conflicts with script.js

let particles = [];
let portraitImg;
let imageLoaded = false;
let particlesCreated = false;

// Track intro visibility - does NOT use or declare introShown to avoid conflicts
function isIntroShown() {
  const introPageEl = document.getElementById("introPage");
  return introPageEl && !introPageEl.classList.contains("hidden");
}

function preload() {
  console.log("Preloading image...");
  // Load the image - p5.js handles this automatically
  portraitImg = loadImage("images/portrait.png");
}

function setup() {
  console.log("Setting up p5.js canvas...");
  const container = select("#particlePortrait");
  if (!container) {
    console.error("Container #particlePortrait not found!");
    return;
  }
  
  // Create canvas - p5.js handles this
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particlePortrait");
  canvas.id("p5-particle-canvas");
  
  // Optimize canvas for frequent pixel reads (if possible)
  try {
    const canvasEl = canvas.elt;
    if (canvasEl) {
      // Note: This is a performance hint, not required for functionality
      // The warning is just a suggestion for optimization
    }
  } catch(e) {
    // Ignore if optimization not possible
  }
  
  console.log("Canvas created:", canvas);
  
  // Check if image is loaded
  if (portraitImg && portraitImg.width > 0) {
    console.log("Image already loaded, creating particles...");
    imageLoaded = true;
    createParticles();
  } else {
    console.log("Waiting for image to load...");
    // Wait for image to load (p5.js handles this in preload, but just in case)
    let attempts = 0;
    const checkImage = setInterval(() => {
      attempts++;
      if (portraitImg && portraitImg.width > 0) {
        console.log("Image loaded after", attempts, "attempts");
        imageLoaded = true;
        createParticles();
        clearInterval(checkImage);
      } else if (attempts > 50) {
        console.error("Image failed to load after 5 seconds");
        clearInterval(checkImage);
      }
    }, 100);
  }
}

function createParticles() {
  if (particlesCreated) {
    console.log("Particles already created");
    return;
  }
  
  if (!portraitImg || portraitImg.width === 0) {
    console.error("Cannot create particles: image not loaded");
    return;
  }
  
  console.log("Creating particles from image:", portraitImg.width, "x", portraitImg.height);
  particles = [];
  
  // Calculate dimensions to fit image
  const maxWidth = width * 0.7;
  const maxHeight = height * 0.8;
  const imgAspect = portraitImg.width / portraitImg.height;
  let drawWidth = maxWidth;
  let drawHeight = maxWidth / imgAspect;
  
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = maxHeight * imgAspect;
  }
  
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  
  console.log("Draw dimensions:", drawWidth, "x", drawHeight);
  console.log("Offset:", offsetX, offsetY);
  
  // Create a temporary graphics to resize and sample
  let tempImg = portraitImg.get();
  tempImg.resize(drawWidth, drawHeight);
  
  // Load pixels - the warning about willReadFrequently is just a performance hint
  // It's safe to ignore for one-time operations like this
  tempImg.loadPixels();
  
  const pixelSize = 2; // Sample every 2nd pixel for many more particles
  const colors = [
    [300, 100, 70], // Pink
    [180, 100, 70], // Cyan
    [60, 100, 70],  // Yellow
    [240, 100, 70], // Blue
    [0, 100, 70]    // Red
  ];
  
  let pixelsProcessed = 0;
  let pixelsWithParticles = 0;
  
  // Make sure pixels are loaded
  tempImg.loadPixels();
  
  for (let y = 0; y < drawHeight; y += pixelSize) {
    for (let x = 0; x < drawWidth; x += pixelSize) {
      pixelsProcessed++;
      const index = (y * drawWidth + x) * 4;
      
      if (index >= tempImg.pixels.length - 3) continue;
      
      const r = tempImg.pixels[index];
      const g = tempImg.pixels[index + 1];
      const b = tempImg.pixels[index + 2];
      const a = tempImg.pixels[index + 3];
      
      // Create particles for ALL visible pixels (very permissive)
      if (a > 20) { // Very low alpha threshold - include almost all pixels
        const brightness = (r + g + b) / 3;
        
        // Create particles for almost everything - just skip completely black pixels
        // Lower threshold to get even more particles
        if (brightness > 5) { // Extremely low threshold - almost all pixels
          pixelsWithParticles++;
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          // Adjust opacity based on brightness for visual depth
          const opacityMultiplier = map(brightness, 0, 255, 0.5, 1.0);
          
          particles.push({
            x: offsetX + x + random(-5, 5),
            y: offsetY + y + random(-5, 5),
            targetX: offsetX + x,
            targetY: offsetY + y,
            size: random(3, 5), // Even larger particles for visibility
            color: randomColor,
            opacity: random(0.9, 1.0) * opacityMultiplier, // Higher opacity
            phase: random(TWO_PI),
            speed: random(0.05, 0.15)
          });
        }
      }
    }
  }
  
  console.log(`Processed ${pixelsProcessed} pixels, created ${pixelsWithParticles} particle positions`);
  
  particlesCreated = true;
  console.log(`Created ${particles.length} particles`);
  
  if (particles.length === 0) {
    console.warn("No particles were created! Check brightness threshold or image content.");
  }
}

function draw() {
  if (!isIntroShown()) {
    clear();
    return;
  }
  
  if (particles.length === 0) {
    // Debug: draw a test circle if no particles
    fill(255, 0, 0, 200);
    circle(width/2, height/2, 20);
    console.log("No particles to draw!");
    return;
  }
  
  clear();
  // Try different blend mode - SCREEN might be hiding particles
  blendMode(ADD); // ADD mode for brighter, more visible particles
  
  for (let i = 0; i < particles.length; i++) {
    let particle = particles[i];
    // Animate particles moving to their target positions
    const dx = particle.targetX - particle.x;
    const dy = particle.targetY - particle.y;
    particle.x += dx * particle.speed;
    particle.y += dy * particle.speed;
    
    // Add subtle floating animation
    const floatX = sin(millis() * 0.001 + particle.phase) * 0.5;
    const floatY = cos(millis() * 0.0008 + particle.phase) * 0.5;
    
    // Draw particle with colorful glow - very bright
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 200 // Very high opacity for visibility
    );
    noStroke();
    // Draw larger circles for better visibility
    circle(particle.x + floatX, particle.y + floatY, particle.size);
    
    // Add a brighter glow effect with multiple layers
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 80
    );
    circle(particle.x + floatX, particle.y + floatY, particle.size * 1.8);
    
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 40
    );
    circle(particle.x + floatX, particle.y + floatY, particle.size * 2.5);
  }
  
  blendMode(BLEND);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optionally recreate particles on resize
  // createParticles();
}
