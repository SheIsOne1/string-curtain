import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

// ===== DOM ELEMENTS =====
const container = document.getElementById('canvas-container');
const sectionsEl = document.getElementById('sections');
const sectionEls = ['sec0', 'sec1', 'sec2', 'sec3'].map(id => document.getElementById(id));
const titleOverlayEls = ['title0', 'title1', 'title2', 'title3'].map(id => document.getElementById(id));
const debugEl = document.getElementById('debug');

// ===== THREE.js SCENE SETUP =====
const scene = new THREE.Scene();
scene.background = null; // Transparent to see sections behind

const camera = new THREE.PerspectiveCamera(
  45, // FOV
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 15;
camera.position.y = 0;

const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// ===== LIGHTING =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// ===== CURTAIN PARAMETERS =====
const CURTAIN_WIDTH = 20;
const CURTAIN_HEIGHT = 12;
const NUM_STRINGS = 150; // Number of individual string lines
const SEGMENTS_PER_STRING = 80; // Smoothness of each string

// Physics parameters
const params = {
  openRadius: 2.8,
  openStrength: 1.8,
  followEase: 0.07,
  returnEase: 0.05,
  damping: 0.96,
  inertia: 0.10,
  coupling: 0.03,
  brushResistance: 0.15
};

// ===== POINTER STATE =====
const pointer = {
  x: 0,
  y: 0,
  active: false,
  vx: 0,
  vy: 0,
  prevX: 0,
  prevY: 0,
  world: new THREE.Vector3()
};

let snapX = 0;
const SNAP_EASE = 0.12;

// ===== COLOR PALETTE =====
const palette = [
  { h: 48, s: 94, l: 67 },  // #F9DC5C - bright yellow
  { h: 48, s: 92, l: 75 },  // #FAE588 - light yellow
  { h: 48, s: 90, l: 85 },  // #FCEFB4 - pale yellow
  { h: 48, s: 88, l: 90 },  // #FDF4CB - very pale yellow
  { h: 48, s: 85, l: 93 }   // #FDF8E1 - almost white yellow
];

// ===== CREATE STRING OBJECTS =====
const strings = [];

for (let i = 0; i < NUM_STRINGS; i++) {
  const baseX = (i / NUM_STRINGS) * CURTAIN_WIDTH - CURTAIN_WIDTH / 2;
  
  // Select colors for gradient (top to bottom)
  const colorData1 = palette[Math.floor(Math.random() * palette.length)];
  const colorData2 = palette[Math.floor(Math.random() * palette.length)];
  
  // Create color with variation
  const topColor = new THREE.Color().setHSL(
    (colorData1.h + (Math.random() - 0.5) * 2) / 360,
    Math.max(0.8, Math.min(1.0, (colorData1.s + (Math.random() - 0.5) * 3) / 100)),
    Math.max(0.6, Math.min(0.95, (colorData1.l + (Math.random() - 0.5) * 3) / 100))
  );
  
  const bottomColor = new THREE.Color().setHSL(
    (colorData2.h + (Math.random() - 0.5) * 2) / 360,
    Math.max(0.8, Math.min(1.0, (colorData2.s + (Math.random() - 0.5) * 3) / 100)),
    Math.max(0.6, Math.min(0.95, (colorData2.l + (Math.random() - 0.5) * 3) / 100))
  );

  // Create line geometry
  const positions = [];
  const colors = [];
  
  for (let j = 0; j <= SEGMENTS_PER_STRING; j++) {
    const y = (j / SEGMENTS_PER_STRING) * CURTAIN_HEIGHT - CURTAIN_HEIGHT / 2;
    positions.push(baseX, y, 0);
    
    // Gradient color from top to bottom
    const t = j / SEGMENTS_PER_STRING;
    const color = new THREE.Color().lerpColors(topColor, bottomColor, t);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  geometry.setColors(colors);

  const material = new LineMaterial({
    color: 0xffffff,
    linewidth: 2, // Thickness in pixels
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
    transparent: true,
    opacity: 0.85
  });

  const line = new Line2(geometry, material);
  line.computeLineDistances();
  scene.add(line);

  // Store string data for physics
  strings.push({
    line: line,
    geometry: geometry,
    baseX: baseX,
    x: baseX,
    vx: 0,
    phase: Math.random() * 1000,
    wobble: 0.9 + Math.random() * 1.1,
    thickness: 0.8 + Math.random() * 0.6,
    waveSpeed: 0.7 + Math.random() * 0.4,
    waveFreq: 0.014 + Math.random() * 0.010,
    naturalSway: Math.random() * Math.PI * 2,
    mass: 0.4 + Math.random() * 0.25,
    curlAmount: 0.6 + Math.random() * 0.4,
    originalPositions: positions.slice()
  });
}

// ===== UPDATE LINE MATERIAL RESOLUTION =====
function updateMaterialResolution() {
  strings.forEach(s => {
    s.line.material.resolution.set(window.innerWidth, window.innerHeight);
  });
}
updateMaterialResolution();

// ===== MOUSE TRACKING =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  raycaster.ray.intersectPlane(plane, pointer.world);

  pointer.vx = event.clientX - pointer.x;
  pointer.vy = event.clientY - pointer.y;
  pointer.prevX = pointer.x;
  pointer.prevY = pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
}

window.addEventListener('mousemove', onMouseMove);

// ===== SECTION LOGIC =====
function sectionIndex(x) {
  const normalizedX = (x / window.innerWidth) * 4;
  return Math.min(3, Math.max(0, Math.floor(normalizedX)));
}

function sectionCenter(i) {
  return ((i + 0.5) / 4) * CURTAIN_WIDTH - CURTAIN_WIDTH / 2;
}

let currentSection = -1;

function updateSections() {
  if (!pointer.active) {
    sectionsEl.style.opacity = '0';
    sectionEls.forEach(el => el.style.opacity = '0');
    titleOverlayEls.forEach(el => {
      el.classList.remove('visible');
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    });
    currentSection = -1;
    return;
  }

  const idx = sectionIndex(pointer.x);
  currentSection = idx;

  sectionsEl.style.opacity = '1';
  sectionEls.forEach((el, i) => {
    el.style.opacity = i === idx ? '1' : '0';
  });

  titleOverlayEls.forEach((titleEl, i) => {
    if (i === idx) {
      titleEl.classList.add('visible');
      titleEl.style.opacity = '1';
      titleEl.style.visibility = 'visible';
    } else {
      titleEl.classList.remove('visible');
      titleEl.style.opacity = '0';
      titleEl.style.visibility = 'hidden';
    }
  });

  const targetSnap = sectionCenter(idx);
  snapX += (targetSnap - snapX) * SNAP_EASE;

  if (debugEl) {
    debugEl.innerHTML = `
      Section: ${idx}<br>
      Snap X: ${snapX.toFixed(2)}<br>
      Pointer: ${pointer.world.x.toFixed(2)}, ${pointer.world.y.toFixed(2)}<br>
      Active: ${pointer.active}<br>
      Strings: ${NUM_STRINGS}
    `;
  }
}

// ===== ANIMATION LOOP =====
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 1;

  updateSections();

  // Update each string
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    let targetX = s.baseX;

    // Apply opening effect based on proximity to snap point
    if (pointer.active) {
      const d = Math.abs(s.baseX - snapX);
      
      if (d < params.openRadius) {
        const f = 1 - d / params.openRadius;
        const eased = f * f * (3 - 2 * f);
        
        const brushDir = pointer.vx !== 0 ? (pointer.vx > 0 ? 1 : -1) : (s.baseX < snapX ? -1 : 1);
        const brushSpeed = Math.min(1, Math.abs(pointer.vx) / 50);
        
        const brushPull = params.openStrength * eased * (0.7 + brushSpeed * 0.3);
        const hairResistance = 1 - (params.brushResistance * (1 - f));
        
        targetX = s.baseX + brushDir * brushPull * hairResistance;
        
        const flowAftermath = Math.sin(time * 0.001 + s.phase) * 0.02 * eased * (1 - brushSpeed * 0.5);
        targetX += flowAftermath;
      }
    }

    // Apply physics
    const targetEase = pointer.active ? params.followEase : params.returnEase;
    const diff = targetX - s.x;
    
    const easeOut = 1 - Math.pow(1 - Math.min(1, Math.abs(diff) / 100), 3);
    const organicMove = diff * targetEase * (0.8 + easeOut * 0.2);
    
    const effectiveInertia = params.inertia / s.mass;
    s.vx += organicMove * effectiveInertia;
    
    const damping = params.damping + (s.mass - 0.4) * 0.012;
    s.vx *= damping;
    
    const maxVel = 4.5 + s.wobble * 1.0;
    s.vx = Math.max(-maxVel, Math.min(maxVel, s.vx));
    
    if (Math.abs(s.vx) < 0.08) {
      s.vx *= 0.92;
    }
    
    s.vx *= 0.99;
    s.x += s.vx;

    // Coupling with neighbors
    if (i > 0 && i < strings.length - 1) {
      const left = strings[i - 1];
      const right = strings[i + 1];
      
      const couplingStrength = pointer.active 
        ? params.coupling * 0.4 
        : params.coupling * 0.15;
      
      const avgNeighborX = (left.x + right.x) / 2;
      const neighborInfluence = (avgNeighborX - s.x) * couplingStrength;
      
      const avgNeighborVx = (left.vx + right.vx) / 2;
      const velocityInfluence = (avgNeighborVx - s.vx) * couplingStrength * 0.25;
      
      s.x += neighborInfluence;
      s.vx += velocityInfluence;
    }

    // Organic drift
    const drift = Math.sin(time * 0.00025 + s.phase * 0.025) * 0.018 +
                  Math.cos(time * 0.00012 + s.phase * 0.02) * 0.012 +
                  Math.sin(time * 0.00008 + s.phase * 0.015) * 0.008;
    s.x += drift;

    // Update line positions with waves
    const positions = [];
    
    for (let j = 0; j <= SEGMENTS_PER_STRING; j++) {
      const y = s.originalPositions[j * 3 + 1];
      const progress = j / SEGMENTS_PER_STRING;
      
      // Wave animation
      const waveTravel = (time * s.waveSpeed * 0.0008) + (y * s.waveFreq);
      const wave1 = Math.sin(waveTravel) * 0.08 * s.curlAmount;
      const wave2 = Math.sin(waveTravel * 1.3 + s.phase) * 0.04 * s.wobble;
      const wave3 = Math.cos(waveTravel * 0.7 + s.phase * 0.5) * 0.02;
      
      const waveX = (wave1 + wave2 + wave3) * Math.pow(progress, 1.2);
      
      // Depth variation (Z-axis)
      const waveZ = Math.sin(waveTravel * 0.5) * 0.05 * progress;
      
      positions.push(s.x + waveX, y, waveZ);
    }

    s.geometry.setPositions(positions);
    s.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

// ===== WINDOW RESIZE =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateMaterialResolution();
}

window.addEventListener('resize', onWindowResize);

// ===== START =====
animate();