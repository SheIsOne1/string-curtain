/* ===== PARTICLE PORTRAIT using p5.js ===== */
let particles = [];
let portraitImg;
let introShown = true;
let imageLoaded = false;
let particlesCreated = false;

// Listen for intro page visibility changes
let introPage;
document.addEventListener('DOMContentLoaded', () => {
  introPage = document.getElementById("introPage");
  if (introPage) {
    introShown = !introPage.classList.contains("hidden");
    const observer = new MutationObserver(() => {
      introShown = !introPage.classList.contains("hidden");
    });
    observer.observe(introPage, { attributes: true, attributeFilter: ['class'] });
  }
});

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
  
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particlePortrait");
  canvas.id("p5-particle-canvas");
  
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
  tempImg.loadPixels();
  
  const pixelSize = 4; // Sample every 4th pixel for performance
  const colors = [
    [300, 100, 70], // Pink
    [180, 100, 70], // Cyan
    [60, 100, 70],  // Yellow
    [240, 100, 70], // Blue
    [0, 100, 70]    // Red
  ];
  
  for (let y = 0; y < drawHeight; y += pixelSize) {
    for (let x = 0; x < drawWidth; x += pixelSize) {
      const index = (y * drawWidth + x) * 4;
      const r = tempImg.pixels[index];
      const g = tempImg.pixels[index + 1];
      const b = tempImg.pixels[index + 2];
      const a = tempImg.pixels[index + 3];
      
      // Only create particles for visible pixels
      if (a > 128) {
        const brightness = (r + g + b) / 3;
        
        // Only create particles for lighter areas
        if (brightness > 80) {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          particles.push({
            x: offsetX + x + random(-10, 10),
            y: offsetY + y + random(-10, 10),
            targetX: offsetX + x,
            targetY: offsetY + y,
            size: random(1.5, 3),
            color: randomColor,
            opacity: random(0.6, 1.0),
            phase: random(TWO_PI),
            speed: random(0.05, 0.15)
          });
        }
      }
    }
  }
  
  particlesCreated = true;
  console.log(`Created ${particles.length} particles`);
  
  if (particles.length === 0) {
    console.warn("No particles were created! Check brightness threshold or image content.");
  }
}

function draw() {
  if (!introShown || particles.length === 0) {
    clear();
    return;
  }
  
  clear();
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
    
    // Draw particle with colorful glow
    fill(
      particle.color[0],
      particle.color[1],
      particle.color[2],
      particle.opacity * 60
    );
    noStroke();
    circle(particle.x + floatX, particle.y + floatY, particle.size);
  }
  
  blendMode(BLEND);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optionally recreate particles on resize
  // createParticles();
}
