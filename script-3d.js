import * as THREE from 'three';

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
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near plane
  1000 // Far plane
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// ===== LIGHTING FOR 3D DEPTH =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const rimLight = new THREE.DirectionalLight(0xF9DC5C, 0.4);
rimLight.position.set(-5, 5, -5);
scene.add(rimLight);

// ===== CURTAIN PARAMETERS =====
const CURTAIN_WIDTH = 20;
const CURTAIN_HEIGHT = 12;
const SEGMENTS_X = 120; // High resolution for smooth cloth
const SEGMENTS_Y = 80;

// Physics parameters (matching original 2D version)
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

// ===== CREATE CURTAIN GEOMETRY =====
const geometry = new THREE.PlaneGeometry(CURTAIN_WIDTH, CURTAIN_HEIGHT, SEGMENTS_X, SEGMENTS_Y);

// Custom color palette for vertices (matching original yellow palette)
const palette = [
  { h: 48, s: 94, l: 67 },  // #F9DC5C - bright yellow
  { h: 48, s: 92, l: 75 },  // #FAE588 - light yellow
  { h: 48, s: 90, l: 85 },  // #FCEFB4 - pale yellow
  { h: 48, s: 88, l: 90 },  // #FDF4CB - very pale yellow
  { h: 48, s: 85, l: 93 }   // #FDF8E1 - almost white yellow
];

// Add vertex colors with natural variation
const colors = [];
const positionAttribute = geometry.attributes.position;

for (let i = 0; i < positionAttribute.count; i++) {
  const colorData = palette[Math.floor(Math.random() * palette.length)];
  const hue = colorData.h + (Math.random() - 0.5) * 2;
  const sat = Math.max(80, Math.min(100, colorData.s + (Math.random() - 0.5) * 3)) / 100;
  const light = Math.max(60, Math.min(95, colorData.l + (Math.random() - 0.5) * 3)) / 100;
  
  const color = new THREE.Color().setHSL(hue / 360, sat, light);
  colors.push(color.r, color.g, color.b);
}

geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

// ===== MATERIAL =====
const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.95,
  roughness: 0.8,
  metalness: 0.1,
  emissive: 0xF9DC5C,
  emissiveIntensity: 0.1
});

const curtain = new THREE.Mesh(geometry, material);
curtain.castShadow = true;
curtain.receiveShadow = true;
scene.add(curtain);

// ===== PHYSICS STORAGE =====
// Store original positions and create velocity arrays
const originalPositions = geometry.attributes.position.array.slice();
const velocities = new Float32Array(positionAttribute.count * 3);
const phases = new Float32Array(positionAttribute.count).map(() => Math.random() * 1000);

// ===== MOUSE TRACKING =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Calculate pointer world position
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  raycaster.ray.intersectPlane(plane, pointer.world);

  // Store velocity for brush effect
  pointer.vx = event.clientX - pointer.x;
  pointer.vy = event.clientY - pointer.y;
  pointer.prevX = pointer.x;
  pointer.prevY = pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
}

window.addEventListener('mousemove', onMouseMove);

// ===== SECTION LOGIC (4-section snap) =====
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

  // Update sections visibility
  sectionsEl.style.opacity = '1';
  sectionEls.forEach((el, i) => {
    el.style.opacity = i === idx ? '1' : '0';
  });

  // Update titles
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

  // Update snap target (smooth magnetic snap)
  const targetSnap = sectionCenter(idx);
  snapX += (targetSnap - snapX) * SNAP_EASE;

  // Debug info
  if (debugEl) {
    debugEl.innerHTML = `
      Section: ${idx}<br>
      Snap X: ${snapX.toFixed(2)}<br>
      Pointer: ${pointer.world.x.toFixed(2)}, ${pointer.world.y.toFixed(2)}<br>
      Active: ${pointer.active}
    `;
  }
}

// ===== ANIMATION LOOP =====
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 1;

  updateSections();

  // ===== UPDATE CURTAIN PHYSICS =====
  const positions = geometry.attributes.position;
  
  for (let i = 0; i < positions.count; i++) {
    const i3 = i * 3;
    const x = originalPositions[i3];
    const y = originalPositions[i3 + 1];
    const z = originalPositions[i3 + 2];

    let targetX = x;
    let targetZ = z;

    // Apply opening effect based on proximity to snap point
    if (pointer.active) {
      const d = Math.abs(x - snapX);
      
      if (d < params.openRadius) {
        const f = 1 - d / params.openRadius;
        const eased = f * f * (3 - 2 * f); // smoothstep for organic opening
        
        // Brush direction (matching original 2D behavior)
        const brushDir = pointer.vx !== 0 ? (pointer.vx > 0 ? 1 : -1) : (x < snapX ? -1 : 1);
        const brushSpeed = Math.min(1, Math.abs(pointer.vx) / 50);
        
        // Calculate opening displacement
        const brushPull = params.openStrength * eased * (0.7 + brushSpeed * 0.3);
        const hairResistance = 1 - (params.brushResistance * (1 - f));
        
        targetX = x + brushDir * brushPull * hairResistance;
        
        // Add depth displacement (Z-axis) for 3D effect - curtain opens away from camera
        targetZ = z + eased * 0.8;
        
        // Flow aftermath - gentle wave motion
        const flowAftermath = Math.sin(time * 0.001 + phases[i]) * 0.02 * eased * (1 - brushSpeed * 0.5);
        targetX += flowAftermath;
      }
    }

    // Organic wave motion (matching original gentle waves)
    const waveX = Math.sin(time * 0.001 + x * 0.3 + phases[i]) * 0.02;
    const waveY = Math.cos(time * 0.0008 + y * 0.3 + phases[i]) * 0.015;
    const waveZ = Math.sin(time * 0.0012 + x * 0.2 + y * 0.2) * 0.01;
    
    targetX += waveX;
    targetZ += waveZ;

    // Apply physics (matching original cloth-like behavior)
    const targetEase = pointer.active ? params.followEase : params.returnEase;
    const diffX = targetX - positions.array[i3];
    const diffZ = targetZ - positions.array[i3 + 2];
    
    // Velocity updates with inertia
    velocities[i3] += diffX * params.inertia;
    velocities[i3 + 2] += diffZ * params.inertia;
    
    // Apply damping
    velocities[i3] *= params.damping;
    velocities[i3 + 2] *= params.damping;
    
    // Update positions
    positions.array[i3] += velocities[i3];
    positions.array[i3 + 2] += velocities[i3 + 2];
    
    // Add subtle wave to Y
    positions.array[i3 + 1] = y + waveY;
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals(); // Update normals for proper lighting

  renderer.render(scene, camera);
}

// ===== WINDOW RESIZE HANDLER =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// ===== START ANIMATION =====
animate();