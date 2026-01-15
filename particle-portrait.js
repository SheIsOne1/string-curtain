/* ===== SIMPLE COLORFUL PARTICLES using p5.js ===== */
// Just colorful particles lining up

let particles = [];

// Track intro visibility
function isIntroShown() {
  const introPageEl = document.getElementById("introPage");
  return introPageEl && !introPageEl.classList.contains("hidden");
}

function setup() {
  const container = select("#particlePortrait");
  if (!container) {
    return;
  }
  
  colorMode(RGB);
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particlePortrait");
  canvas.id("p5-particle-canvas");
  
  // Create colorful particles in lines
  const colors = [
    [255, 107, 179], // Pink
    [0, 255, 255],   // Cyan
    [255, 234, 0],   // Yellow
    [102, 51, 255],  // Blue
    [255, 51, 51]    // Red
  ];
  
  const particleCount = 200;
  const spacing = height / (particleCount + 1);
  
  for (let i = 0; i < particleCount; i++) {
    const y = (i + 1) * spacing;
    const color = colors[i % colors.length];
    
    particles.push({
      x: width / 2,
      y: y,
      targetX: width / 2,
      color: color,
      size: random(4, 8),
      phase: random(TWO_PI),
      speed: random(0.02, 0.05)
    });
  }
}

function draw() {
  if (!isIntroShown()) {
    clear();
    return;
  }
  
  clear();
  colorMode(RGB);
  
  const time = millis() * 0.001;
  
  // Draw particles
  for (let particle of particles) {
    // Add subtle floating animation
    const floatX = sin(time * 0.5 + particle.phase) * 20;
    const floatY = cos(time * 0.3 + particle.phase) * 5;
    
    // Animate towards target position
    particle.x += (particle.targetX - particle.x) * particle.speed;
    
    // Draw with glow effect
    const alpha = 180;
    fill(particle.color[0], particle.color[1], particle.color[2], alpha);
    noStroke();
    circle(particle.x + floatX, particle.y + floatY, particle.size);
    
    // Add glow
    fill(particle.color[0], particle.color[1], particle.color[2], alpha * 0.3);
    circle(particle.x + floatX, particle.y + floatY, particle.size * 2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
