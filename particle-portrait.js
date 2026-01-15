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
  
  // Set color mode to HSB so we can use HSL-like colors
  colorMode(HSB, 360, 100, 100, 1);
  
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
  
  // Calculate dimensions to fit image - ensure it fits well on screen
  const maxWidth = width * 0.6;
  const maxHeight = height * 0.7;
  const imgAspect = portraitImg.width / portraitImg.height;
  let drawWidth = maxWidth;
  let drawHeight = maxWidth / imgAspect;
  
  // If image is too tall, constrain by height instead
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = maxHeight * imgAspect;
  }
  
  // Ensure minimum size
  if (drawWidth < 200) {
    drawWidth = 200;
    drawHeight = drawWidth / imgAspect;
  }
  
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  
  console.log("Original image:", portraitImg.width, "x", portraitImg.height);
  console.log("Draw dimensions:", drawWidth, "x", drawHeight);
  console.log("Canvas size:", width, "x", height);
  console.log("Offset:", offsetX, offsetY);
  
  // Create a temporary graphics to resize and sample
  let tempImg = createGraphics(floor(drawWidth), floor(drawHeight));
  tempImg.image(portraitImg, 0, 0, floor(drawWidth), floor(drawHeight));
  
  // Load pixels - the warning about willReadFrequently is just a performance hint
  // It's safe to ignore for one-time operations like this
  tempImg.loadPixels();
  
  console.log("Temp image pixels length:", tempImg.pixels.length);
  console.log("Expected pixels:", floor(drawWidth) * floor(drawHeight) * 4);
  
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
  
  const actualWidth = floor(drawWidth);
  const actualHeight = floor(drawHeight);
  
  for (let y = 0; y < actualHeight; y += pixelSize) {
    for (let x = 0; x < actualWidth; x += pixelSize) {
      pixelsProcessed++;
      const index = (y * actualWidth + x) * 4;
      
      if (index >= tempImg.pixels.length - 3 || index < 0) continue;
      
      const r = tempImg.pixels[index];
      const g = tempImg.pixels[index + 1];
      const b = tempImg.pixels[index + 2];
      const a = tempImg.pixels[index + 3];
      
      // Sample every Nth pixel more strategically
      // Create particles based on image variation, not just brightness
      if (a > 5) { // Very low alpha threshold
        const brightness = (r + g + b) / 3;
        
        // Use a more complex logic: create particles where there's visual interest
        // Higher probability for brighter pixels, but also some for darker areas
        const brightnessProbability = map(brightness, 0, 255, 0.1, 1.0);
        const shouldCreate = random() < brightnessProbability || brightness > 100;
        
        if (shouldCreate) {
          pixelsWithParticles++;
          
          // Choose color based on actual pixel color with some randomness
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          // Adjust opacity based on brightness for visual depth
          const opacityMultiplier = map(brightness, 0, 255, 0.6, 1.0);
          
          // Ensure particles are within canvas bounds
          const finalX = constrain(offsetX + x + random(-2, 2), 0, width);
          const finalY = constrain(offsetY + y + random(-2, 2), 0, height);
          
          particles.push({
            x: finalX,
            y: finalY,
            targetX: constrain(offsetX + x, 0, width),
            targetY: constrain(offsetY + y, 0, height),
            size: random(3, 5), // Even larger particles for visibility
            color: randomColor,
            opacity: random(0.8, 1.0) * opacityMultiplier, // Higher opacity
            phase: random(TWO_PI),
            speed: random(0.05, 0.15)
          });
        }
      }
    }
  }
  
  console.log(`Processed ${pixelsProcessed} pixels, created ${pixelsWithParticles} particle positions`);
  console.log(`Particle X range: ${Math.min(...particles.map(p => p.x))} to ${Math.max(...particles.map(p => p.x))}`);
  console.log(`Particle Y range: ${Math.min(...particles.map(p => p.y))} to ${Math.max(...particles.map(p => p.y))}`);
  
  particlesCreated = true;
  console.log(`Created ${particles.length} particles`);
  
  if (particles.length === 0) {
    console.warn("No particles were created! Check brightness threshold or image content.");
  } else if (particles.length < 100) {
    console.warn(`Only ${particles.length} particles created - might not form a clear portrait. Consider lowering brightness threshold.`);
  }
}

function draw() {
  // Only draw when intro page is visible
  if (!isIntroShown()) {
    clear();
    return;
  }
  
  if (particles.length === 0) {
    // Debug: draw a test circle if no particles
    colorMode(RGB, 255);
    background(0, 0, 0, 0); // Transparent background in RGB mode
    fill(255, 0, 0, 200);
    noStroke();
    circle(width/2, height/2, 20);
    colorMode(HSB, 360, 100, 100, 1); // Switch back to HSB
    console.log("No particles to draw! particles.length =", particles.length);
    return;
  }
  
  // Clear with transparent background - use RGB mode for background
  colorMode(RGB, 255);
  background(0, 0, 0, 0); // Transparent black in RGB
  colorMode(HSB, 360, 100, 100, 1); // Switch back to HSB for particles
  
  // Use SCREEN blend mode for better visibility with dark background
  blendMode(SCREEN);
  
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
    // HSB mode: H (0-360), S (0-100), B (0-100), Alpha (0-1)
    fill(
      particle.color[0], // Hue (0-360)
      particle.color[1], // Saturation (0-100)
      particle.color[2], // Brightness (0-100)
      min(1.0, particle.opacity) // Alpha 0-1, ensure it's not > 1
    );
    noStroke();
    // Draw larger circles for better visibility
    circle(particle.x + floatX, particle.y + floatY, particle.size);
    
    // Add a brighter glow effect with multiple layers
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 0.6
    );
    circle(particle.x + floatX, particle.y + floatY, particle.size * 1.8);
    
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 0.3
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
