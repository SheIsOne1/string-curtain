/* ===== PARTICLE PORTRAIT using p5.js ===== */
let particles = [];
let portraitImg;
let introShown = true;

// Listen for intro page visibility changes
const introPage = document.getElementById("introPage");
if (introPage) {
  const observer = new MutationObserver(() => {
    introShown = !introPage.classList.contains("hidden");
  });
  observer.observe(introPage, { attributes: true, attributeFilter: ['class'] });
}

function preload() {
  // Load the image
  portraitImg = loadImage("images/portrait.png", 
    () => console.log("Image loaded successfully!"),
    () => console.error("Failed to load image: images/portrait.png")
  );
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particlePortrait");
  canvas.id("p5-particle-canvas");
  
  // Only create particles if image loaded
  if (portraitImg && portraitImg.width > 0) {
    createParticles();
  } else {
    // Wait a bit for image to load
    setTimeout(() => {
      if (portraitImg && portraitImg.width > 0) {
        createParticles();
      }
    }, 100);
  }
}

function createParticles() {
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
  
  // Sample pixels to create particles
  portraitImg.resize(drawWidth, drawHeight);
  portraitImg.loadPixels();
  
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
      const r = portraitImg.pixels[index];
      const g = portraitImg.pixels[index + 1];
      const b = portraitImg.pixels[index + 2];
      const a = portraitImg.pixels[index + 3];
      
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
  
  console.log(`Created ${particles.length} particles`);
}

function draw() {
  if (!introShown) {
    clear();
    return;
  }
  
  clear();
  blendMode(SCREEN);
  
  for (let particle of particles) {
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
