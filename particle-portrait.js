/* ===== SIMPLE PORTRAIT ANIMATION using p5.js ===== */
// Simpler approach: just display the image with nice effects

let portraitImg;
let imageOpacity = 0;
let targetOpacity = 0.7;

// Track intro visibility - does NOT use or declare introShown to avoid conflicts
function isIntroShown() {
  const introPageEl = document.getElementById("introPage");
  return introPageEl && !introPageEl.classList.contains("hidden");
}

function preload() {
  console.log("Preloading portrait image...");
  portraitImg = loadImage("images/portrait.png");
}

function setup() {
  console.log("Setting up p5.js canvas...");
  const container = select("#particlePortrait");
  if (!container) {
    console.error("Container #particlePortrait not found!");
    return;
  }
  
  // Use RGB color mode
  colorMode(RGB);
  
  // Create canvas
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("particlePortrait");
  canvas.id("p5-particle-canvas");
  
  console.log("Canvas created, image loaded:", portraitImg && portraitImg.width > 0);
}

function draw() {
  // Only draw when intro page is visible
  if (!isIntroShown()) {
    clear();
    imageOpacity = 0;
    return;
  }
  
  if (!portraitImg || portraitImg.width === 0) {
    return;
  }
  
  clear();
  colorMode(RGB);
  
  // Fade in the image smoothly
  imageOpacity += (targetOpacity - imageOpacity) * 0.05;
  
  // Calculate image dimensions to fit screen
  const maxWidth = width * 0.6;
  const maxHeight = height * 0.7;
  const imgAspect = portraitImg.width / portraitImg.height;
  let drawWidth = maxWidth;
  let drawHeight = maxWidth / imgAspect;
  
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = maxHeight * imgAspect;
  }
  
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  
  // Add subtle pulsing glow effect
  const time = millis() * 0.001;
  const pulse = sin(time * 0.8) * 0.05 + 1.0;
  const currentOpacity = imageOpacity * pulse;
  
  // Draw image with tint for colorful effect
  tint(255, 255, 255, currentOpacity * 255);
  image(portraitImg, offsetX, offsetY, drawWidth, drawHeight);
  
  // Add colorful gradient overlay for visual interest
  push();
  blendMode(SCREEN);
  const gradientAlpha = currentOpacity * 0.15;
  
  // Draw subtle colorful gradients around edges
  for (let i = 0; i < 3; i++) {
    const angle = (time + i * TWO_PI / 3) * 0.3;
    const x = width/2 + cos(angle) * width * 0.3;
    const y = height/2 + sin(angle) * height * 0.3;
    
    const colors = [
      [255, 107, 179, gradientAlpha], // Pink
      [0, 255, 255, gradientAlpha],   // Cyan
      [255, 234, 0, gradientAlpha]    // Yellow
    ];
    
    fill(colors[i][0], colors[i][1], colors[i][2], colors[i][3] * 255);
    noStroke();
    circle(x, y, width * 0.4);
  }
  pop();
  
  tint(255); // Reset tint
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
