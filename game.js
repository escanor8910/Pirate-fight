import * as THREE from 'three';

// =========================================================================
// SCENE
// =========================================================================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 90, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.0);
sun.position.set(40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

// =========================================================================
// OCEAN
// =========================================================================
const oceanGeo = new THREE.PlaneGeometry(500, 500, 50, 50);
const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1e6091, roughness: 0.6, flatShading: true });
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -2;
ocean.receiveShadow = true;
scene.add(ocean);
const oceanBase = oceanGeo.attributes.position.array.slice();

// =========================================================================
// SHIPS  (two big ships side by side)
// =========================================================================
const SHIP_WIDTH = 12;
const SHIP_LENGTH = 36;
const PLAYER_SHIP_X = -14;
const ENEMY_SHIP_X = 14;
const PLANK_HALF_LENGTH = 5;  // plank z extent (z from -5 to +5)

function buildShip({ hullColor, sailColor, flagColor, mirror = false }) {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: hullColor, flatShading: true });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(SHIP_WIDTH, 3, SHIP_LENGTH), hullMat);
  hull.position.y = -1.2;
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);

  // Pointy bow at front (+z)
  const bow = new THREE.Mesh(new THREE.ConeGeometry(SHIP_WIDTH / 2, 5, 4), hullMat);
  bow.position.set(0, -1, SHIP_LENGTH / 2 + 1.5);
  bow.rotation.x = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.castShadow = true;
  ship.add(bow);

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(SHIP_WIDTH - 1, 0.3, SHIP_LENGTH), deckMat);
  deck.position.y = 0.4;
  deck.receiveShadow = true;
  ship.add(deck);

  // Plank lines
  for (let i = -SHIP_LENGTH / 2 + 2; i < SHIP_LENGTH / 2; i += 2) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(SHIP_WIDTH - 1.2, 0.32, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x5a3a18, flatShading: true })
    );
    plank.position.set(0, 0.41, i);
    ship.add(plank);
  }

  // Outer rail (the side away from the plank)
  const railMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, flatShading: true });
  const outerX = mirror ? (SHIP_WIDTH / 2 - 0.3) : -(SHIP_WIDTH / 2 - 0.3);
  const outerRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, SHIP_LENGTH - 0.5), railMat);
  outerRail.position.set(outerX, 1, 0);
  outerRail.castShadow = true;
  ship.add(outerRail);

  // Front/back rails — leave a gap in the middle of the inner side for the plank
  const innerX = mirror ? -(SHIP_WIDTH / 2 - 0.3) : (SHIP_WIDTH / 2 - 0.3);
  // Inner rail front section
  const frontInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.9, SHIP_LENGTH / 2 - PLANK_HALF_LENGTH - 0.5), railMat
  );
  frontInner.position.set(innerX, 1, (SHIP_LENGTH / 2 + PLANK_HALF_LENGTH) / 2 + 0.5);
  ship.add(frontInner);
  const backInner = frontInner.clone();
  backInner.position.z = -frontInner.position.z;
  ship.add(backInner);

  // Front & back end rails
  const endRail = new THREE.Mesh(new THREE.BoxGeometry(SHIP_WIDTH - 1, 0.9, 0.3), railMat);
  endRail.position.set(0, 1, SHIP_LENGTH / 2 - 0.3);
  ship.add(endRail);
  const endRailB = endRail.clone();
  endRailB.position.z = -endRail.position.z;
  ship.add(endRailB);

  // Mast + sail
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 18, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4226, flatShading: true })
  );
  mast.position.set(0, 9, 4);
  mast.castShadow = true;
  ship.add(mast);

  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 10),
    new THREE.MeshStandardMaterial({ color: sailColor, side: THREE.DoubleSide, flatShading: true, roughness: 0.9 })
  );
  sail.position.set(0, 10, 4);
  sail.castShadow = true;
  ship.add(sail);

  // Flag symbol on sail
  const flag = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 16),
    new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide })
  );
  flag.position.set(0, 10.5, 4.02);
  ship.add(flag);

  return { group: ship, sail };
}

const playerShipObj = buildShip({ hullColor: 0x4a2c1a, sailColor: 0xfff8e7, flagColor: 0x1565c0, mirror: false });
playerShipObj.group.position.set(PLAYER_SHIP_X, 0, 0);
scene.add(playerShipObj.group);

const enemyShipObj = buildShip({ hullColor: 0x2c1810, sailColor: 0x3e0a0a, flagColor: 0xc62828, mirror: true });
enemyShipObj.group.position.set(ENEMY_SHIP_X, 0, 0);
scene.add(enemyShipObj.group);

// =========================================================================
// BOARDING PLANK (between ships)
// =========================================================================
const PLANK_X1 = PLAYER_SHIP_X + SHIP_WIDTH / 2 - 1;
const PLANK_X2 = ENEMY_SHIP_X - SHIP_WIDTH / 2 + 1;
const PLANK_WIDTH = PLANK_X2 - PLANK_X1;

const plank = new THREE.Mesh(
  new THREE.BoxGeometry(PLANK_WIDTH, 0.3, PLANK_HALF_LENGTH * 2),
  new THREE.MeshStandardMaterial({ color: 0x6b4226, flatShading: true })
);
plank.position.set((PLANK_X1 + PLANK_X2) / 2, 0.4, 0);
plank.receiveShadow = true;
scene.add(plank);

// Rope rails along plank sides
for (const z of [-PLANK_HALF_LENGTH, PLANK_HALF_LENGTH]) {
  for (let x = PLANK_X1; x <= PLANK_X2; x += 3) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2810 })
    );
    post.position.set(x, 0.95, z);
    scene.add(post);
  }
  const rope = new THREE.Mesh(
    new THREE.BoxGeometry(PLANK_WIDTH, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
  );
  rope.position.set((PLANK_X1 + PLANK_X2) / 2, 1.3, z);
  scene.add(rope);
}

// =========================================================================
// WALKABLE AREAS  (axis-aligned rectangles)
// =========================================================================
const walkable = [
  // Player ship deck (slight inset from edges)
  { x1: PLAYER_SHIP_X - SHIP_WIDTH / 2 + 0.7, x2: PLAYER_SHIP_X + SHIP_WIDTH / 2 - 0.7,
    z1: -SHIP_LENGTH / 2 + 0.7, z2: SHIP_LENGTH / 2 - 0.7 },
  // Enemy ship deck
  { x1: ENEMY_SHIP_X - SHIP_WIDTH / 2 + 0.7, x2: ENEMY_SHIP_X + SHIP_WIDTH / 2 - 0.7,
    z1: -SHIP_LENGTH / 2 + 0.7, z2: SHIP_LENGTH / 2 - 0.7 },
  // Plank
  { x1: PLANK_X1 - 0.5, x2: PLANK_X2 + 0.5, z1: -PLANK_HALF_LENGTH + 0.5, z2: PLANK_HALF_LENGTH - 0.5 },
];

function isWalkable(x, z) {
  for (const r of walkable) {
    if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return true;
  }
  return false;
}

function tryMove(obj, dx, dz) {
  if (isWalkable(obj.position.x + dx, obj.position.z)) obj.position.x += dx;
  if (isWalkable(obj.position.x, obj.position.z + dz)) obj.position.z += dz;
}

// =========================================================================
// TREASURE
// =========================================================================
const PLAYER_TREASURE_HOME = new THREE.Vector3(PLAYER_SHIP_X, 0.55, -SHIP_LENGTH / 2 + 3);
const ENEMY_BOX_POS = new THREE.Vector3(ENEMY_SHIP_X, 0.55, -SHIP_LENGTH / 2 + 3);
const PLAYER_SPAWN_POS = new THREE.Vector3(PLAYER_SHIP_X, 0.55, SHIP_LENGTH / 2 - 3);
const ENEMY_SPAWN_POS = new THREE.Vector3(ENEMY_SHIP_X, 0.55, SHIP_LENGTH / 2 - 3);

function buildBox(color, pos) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.2, 1.4),
    new THREE.MeshStandardMaterial({ color, flatShading: true })
  );
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.3, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xffc107, flatShading: true })
  );
  lid.position.y = 1.4;
  lid.castShadow = true;
  group.add(lid);
  group.position.copy(pos);
  group.position.y = 0.4;
  return group;
}

scene.add(buildBox(0x6b3a1a, PLAYER_TREASURE_HOME));   // player treasure pedestal
scene.add(buildBox(0x2c1810, ENEMY_BOX_POS));          // enemy deposit box
scene.add(buildBox(0x1565c0, PLAYER_SPAWN_POS));       // player respawn box
scene.add(buildBox(0xc62828, ENEMY_SPAWN_POS));        // enemy respawn box

// Treasure object
const treasureMesh = new THREE.Group();
const treasureBox = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.8, 0.9),
  new THREE.MeshStandardMaterial({ color: 0xb8860b, flatShading: true, metalness: 0.4, roughness: 0.5 })
);
treasureBox.position.y = 0.4;
treasureBox.castShadow = true;
treasureMesh.add(treasureBox);
const treasureLid = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.2, 0.9),
  new THREE.MeshStandardMaterial({ color: 0xffd54f, flatShading: true, metalness: 0.6, roughness: 0.3 })
);
treasureLid.position.y = 0.9;
treasureMesh.add(treasureLid);
// Gold glow
const glow = new THREE.PointLight(0xffd54f, 1.0, 6);
glow.position.y = 0.7;
treasureMesh.add(glow);
scene.add(treasureMesh);

const treasure = {
  mesh: treasureMesh,
  state: 'home',        // 'home' | 'free' | 'carried' | 'on_enemy_box'
  carrier: null,
  position: PLAYER_TREASURE_HOME.clone(),
  enemyHoldTime: 0,     // seconds delivered to enemy box (counts up)
};
treasureMesh.position.copy(treasure.position);
treasureMesh.position.y = 1.05;

// =========================================================================
// CANNON (on player ship)
// =========================================================================
const cannonGroup = new THREE.Group();
const carriage = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 2.4),
  new THREE.MeshStandardMaterial({ color: 0x5a3a18, flatShading: true })
);
carriage.position.y = 0.8;
carriage.castShadow = true;
cannonGroup.add(carriage);
// Wheels
for (const dz of [-1, 1]) {
  for (const dx of [-0.9, 0.9]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: 0x3e2723 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(dx, 0.5, dz);
    wheel.castShadow = true;
    cannonGroup.add(wheel);
  }
}
// Barrel — pointing toward enemy ship (+x)
const barrel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.55, 3, 12),
  new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 })
);
barrel.rotation.z = Math.PI / 2;
barrel.position.set(0.8, 1.5, 0);
barrel.castShadow = true;
cannonGroup.add(barrel);
// Cannon mouth
const muzzle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.55, 0.3, 12),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
muzzle.rotation.z = Math.PI / 2;
muzzle.position.set(2.3, 1.5, 0);
cannonGroup.add(muzzle);

const CANNON_POS = new THREE.Vector3(PLAYER_SHIP_X + SHIP_WIDTH / 2 - 2.5, 0.4, -8);
cannonGroup.position.copy(CANNON_POS);
scene.add(cannonGroup);

// Cannonball (created fresh each shot)
let cannonball = null;

const CANNON_RECHARGE = 40;  // ready in 40 seconds, then recharges
const cannon = {
  cooldown: CANNON_RECHARGE,
  ready: false,
};

// =========================================================================
// PIRATE FACTORY
// =========================================================================
function createPirate({ team, isPlayer = false, shirtTint = null }) {
  const baseShirt = team === 'player' ? 0x1565c0 : 0xc62828;
  let shirt = baseShirt;
  if (shirtTint) shirt = shirtTint;

  const hatColor = isPlayer ? 0xffd54f : (team === 'player' ? 0x0d47a1 : 0x4a0e0e);

  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.6, 0.7),
    new THREE.MeshStandardMaterial({ color: shirt, flatShading: true })
  );
  body.position.y = 1.4;
  body.castShadow = true;
  group.add(body);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.25, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true })
  );
  belt.position.y = 0.7;
  group.add(belt);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x37474f, flatShading: true });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.5), legMat);
  legL.position.set(-0.28, 0.05, 0);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.28;
  group.add(legR);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xffd9a5, flatShading: true })
  );
  head.position.y = 2.65;
  head.castShadow = true;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
  eyeL.position.set(-0.2, 2.75, 0.46);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;
  group.add(eyeR);

  const patch = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  patch.position.set(-0.2, 2.75, 0.47);
  group.add(patch);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x4e2a14 })
  );
  mouth.position.set(0.05, 2.5, 0.46);
  group.add(mouth);

  // Hat
  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: hatColor, flatShading: true })
  );
  hatBrim.position.y = 3.18;
  hatBrim.castShadow = true;
  group.add(hatBrim);
  const hatTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.7),
    new THREE.MeshStandardMaterial({ color: hatColor, flatShading: true })
  );
  hatTop.position.y = 3.45;
  hatTop.castShadow = true;
  group.add(hatTop);

  // Player marker — golden star above head
  let marker = null;
  if (isPlayer) {
    marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xffaa00, emissiveIntensity: 0.6 })
    );
    marker.position.y = 4.4;
    marker.rotation.x = Math.PI;
    group.add(marker);
  }

  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: shirt, flatShading: true });
  const armLPivot = new THREE.Group();
  armLPivot.position.set(-0.62, 2.05, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.4), armMat);
  armL.position.y = -0.55;
  armL.castShadow = true;
  armLPivot.add(armL);
  group.add(armLPivot);

  const armRPivot = new THREE.Group();
  armRPivot.position.set(0.62, 2.05, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.4), armMat);
  armR.position.y = -0.55;
  armR.castShadow = true;
  armRPivot.add(armR);
  group.add(armRPivot);

  // Sword in right hand
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.6, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.6, roughness: 0.3, flatShading: true })
  );
  blade.position.y = 0.8;
  blade.castShadow = true;
  sword.add(blade);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xffc107, flatShading: true })
  );
  sword.add(guard);
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x4e342e, flatShading: true })
  );
  handle.position.y = -0.25;
  sword.add(handle);
  sword.position.set(0, -1.1, 0);
  armRPivot.add(sword);

  group.userData = {
    team,
    isPlayer,
    state: 'idle',                 // idle | fallen | being_carried
    carrying: null,                // a pirate (fallen) or 'treasure'
    carriedBy: null,
    health: isPlayer ? 120 : 40,
    maxHealth: isPlayer ? 120 : 40,
    speed: isPlayer ? 6.8 : 3.4,
    walkPhase: Math.random() * Math.PI * 2,
    swingTimer: 0,
    attackCooldown: 0,
    flashTimer: 0,
    fallTimer: 0,
    aiThink: Math.random() * 0.5,
    body, head, armLPivot, armRPivot, legL, legR, sword, marker,
  };
  return group;
}

// =========================================================================
// TEAM SETUP
// =========================================================================
const allPirates = [];
let player = null;

function spawnTeam() {
  // Player team
  const allyTints = [0x1565c0, 0x1976d2, 0x0288d1, 0x42a5f5];
  player = createPirate({ team: 'player', isPlayer: true });
  player.position.set(PLAYER_SHIP_X, 0.55, 0);
  player.rotation.y = Math.PI / 2;  // face +x toward enemy ship
  scene.add(player);
  allPirates.push(player);

  for (let i = 0; i < 4; i++) {
    const ally = createPirate({ team: 'player', shirtTint: allyTints[i] });
    const z = -10 + i * 5;
    ally.position.set(PLAYER_SHIP_X + (i % 2 === 0 ? -2 : 2), 0.55, z);
    ally.rotation.y = Math.PI / 2;
    scene.add(ally);
    allPirates.push(ally);
  }

  // Enemy team
  const enemyTints = [0xc62828, 0xb71c1c, 0xd32f2f, 0xad1457, 0x7b1fa2];
  for (let i = 0; i < 5; i++) {
    const e = createPirate({ team: 'enemy', shirtTint: enemyTints[i] });
    const z = -10 + i * 5;
    e.position.set(ENEMY_SHIP_X + (i % 2 === 0 ? 2 : -2), 0.55, z);
    e.rotation.y = -Math.PI / 2;
    scene.add(e);
    allPirates.push(e);
  }
}

function clearTeam() {
  for (const p of allPirates) scene.remove(p);
  allPirates.length = 0;
  player = null;
}

// =========================================================================
// INPUT
// =========================================================================
const keys = {};
const input = { x: 0, y: 0, action: false, cannon: false };

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space') input.action = true;
  if (e.key.toLowerCase() === 'f') input.cannon = true;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const joyZone = document.getElementById('joystick-zone');
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
let joyActive = false, joyId = null;
let joyOrigin = { x: 0, y: 0 };
const JOY_RADIUS = 50;

function startJoy(x, y, id) {
  joyActive = true;
  joyId = id;
  joyOrigin = { x, y };
  joyBase.style.left = (x - 60) + 'px';
  joyBase.style.bottom = (window.innerHeight - y - 60) + 'px';
  joyBase.classList.add('active');
  updateJoyStick(0, 0);
}
function updateJoyStick(dx, dy) {
  joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function moveJoy(x, y) {
  let dx = x - joyOrigin.x;
  let dy = y - joyOrigin.y;
  const len = Math.hypot(dx, dy);
  if (len > JOY_RADIUS) { dx = dx / len * JOY_RADIUS; dy = dy / len * JOY_RADIUS; }
  updateJoyStick(dx, dy);
  input.x = dx / JOY_RADIUS;
  input.y = dy / JOY_RADIUS;
}
function endJoy() {
  joyActive = false; joyId = null;
  joyBase.classList.remove('active');
  input.x = 0; input.y = 0;
}
joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  startJoy(t.clientX, t.clientY, t.identifier);
}, { passive: false });
joyZone.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === joyId) moveJoy(t.clientX, t.clientY);
}, { passive: false });
joyZone.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) if (t.identifier === joyId) endJoy();
}, { passive: false });
joyZone.addEventListener('touchcancel', endJoy);

const actionBtn = document.getElementById('action-btn');
const cannonBtn = document.getElementById('cannon-btn');
function triggerAction() { input.action = true; }
function triggerCannon() { input.cannon = true; }
actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerAction(); }, { passive: false });
actionBtn.addEventListener('mousedown', (e) => { e.preventDefault(); triggerAction(); });
cannonBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerCannon(); }, { passive: false });
cannonBtn.addEventListener('mousedown', (e) => { e.preventDefault(); triggerCannon(); });

// =========================================================================
// HUD
// =========================================================================
const HUD = {
  health: document.getElementById('health-bar'),
  allies: document.getElementById('ally-count'),
  enemies: document.getElementById('enemy-count'),
  treasure: document.getElementById('treasure-status'),
  cannon: document.getElementById('cannon-status'),
};
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverSub = document.getElementById('game-over-sub');

let gameState = 'start';

function startGame() {
  clearTeam();
  spawnTeam();
  treasure.state = 'home';
  treasure.carrier = null;
  treasure.position.copy(PLAYER_TREASURE_HOME);
  treasure.enemyHoldTime = 0;
  cannon.cooldown = CANNON_RECHARGE;
  cannon.ready = false;
  if (cannonball) { scene.remove(cannonball); cannonball = null; }
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  HUD.health.style.width = '100%';
  gameState = 'playing';
}

function endGame(playerWon) {
  gameState = 'over';
  gameOverTitle.textContent = playerWon ? 'VICTORY, CAPTAIN!' : 'YE BE DEFEATED!';
  gameOverSub.textContent = playerWon
    ? 'You knocked out the whole enemy crew!'
    : 'The enemy sailed away with the treasure...';
  gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// =========================================================================
// HELPERS
// =========================================================================
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

function distance(a, b) { return a.position.distanceTo(b.position); }

function facePoint(pirate, point, dt) {
  const dx = point.x - pirate.position.x;
  const dz = point.z - pirate.position.z;
  if (dx === 0 && dz === 0) return;
  const target = Math.atan2(dx, dz);
  let diff = target - pirate.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  pirate.rotation.y += diff * Math.min(1, dt * 10);
}

function animatePirate(p, dt, isMoving) {
  const ud = p.userData;

  if (ud.state === 'fallen') {
    // Lie on the ground, rotated forward
    p.rotation.x = -Math.PI / 2;
    p.position.y = 0.5;
    return;
  } else {
    p.rotation.x = 0;
    p.position.y = 0.55;
  }

  if (isMoving) {
    ud.walkPhase += dt * 9;
    const swing = Math.sin(ud.walkPhase) * 0.6;
    ud.legL.rotation.x = swing;
    ud.legR.rotation.x = -swing;
    if (ud.swingTimer <= 0 && !ud.carrying) {
      ud.armLPivot.rotation.x = -swing * 0.6;
    }
    p.position.y = 0.55 + Math.abs(Math.sin(ud.walkPhase)) * 0.05;
  } else {
    ud.legL.rotation.x *= 0.85;
    ud.legR.rotation.x *= 0.85;
    if (ud.swingTimer <= 0 && !ud.carrying) ud.armLPivot.rotation.x *= 0.85;
  }

  if (ud.swingTimer > 0) {
    ud.swingTimer -= dt;
    const t = 1 - Math.max(0, ud.swingTimer) / 0.35;
    const angle = Math.sin(t * Math.PI) * 2.2;
    ud.armRPivot.rotation.x = -angle;
  } else {
    ud.armRPivot.rotation.x *= 0.85;
  }

  // Arms up when carrying
  if (ud.carrying) {
    ud.armLPivot.rotation.x = -1.6;
    ud.armRPivot.rotation.x = -1.6;
  }

  if (ud.flashTimer > 0) {
    ud.flashTimer -= dt;
    ud.body.material.emissive.setHex(0xff0000);
    ud.body.material.emissiveIntensity = ud.flashTimer * 3;
  } else {
    ud.body.material.emissive.setHex(0x000000);
  }

  if (ud.marker) ud.marker.position.y = 4.4 + Math.sin(performance.now() * 0.005) * 0.15;
}

function inSwordArc(attacker, target) {
  const d = distance(attacker, target);
  if (d > 2.6) return false;
  const forward = tmp.set(0, 0, 1).applyQuaternion(attacker.quaternion);
  const toTarget = tmp2.subVectors(target.position, attacker.position).normalize();
  return forward.dot(toTarget) > 0.2;
}

function knockOut(pirate) {
  const ud = pirate.userData;
  if (ud.state === 'fallen') return;
  // Drop whatever they were carrying
  if (ud.carrying === 'treasure') {
    treasure.state = 'free';
    treasure.carrier = null;
    treasure.position.copy(pirate.position);
    treasure.position.y = 0.55;
    ud.carrying = null;
  } else if (ud.carrying && ud.carrying.userData) {
    // Carrying a fallen pirate — drop them here
    ud.carrying.userData.carriedBy = null;
    ud.carrying.position.copy(pirate.position);
    ud.carrying.position.y = 0.5;
    ud.carrying = null;
  }
  ud.state = 'fallen';
  ud.health = 0;
  ud.fallTimer = 0;
}

function revive(pirate) {
  const ud = pirate.userData;
  ud.state = 'idle';
  ud.health = ud.maxHealth;
  ud.fallTimer = 0;
  ud.attackCooldown = 0;
  ud.swingTimer = 0;
}

function damagePirate(pirate, dmg) {
  const ud = pirate.userData;
  if (ud.state === 'fallen') return;
  ud.health -= dmg;
  ud.flashTimer = 0.25;
  if (ud.health <= 0) knockOut(pirate);
}

function attackSwing(pirate) {
  const ud = pirate.userData;
  if (ud.swingTimer > 0 || ud.attackCooldown > 0) return;
  if (ud.carrying) return;
  ud.swingTimer = 0.35;
  ud.attackCooldown = 0.6;
  // Hit anyone enemy in sword arc
  for (const other of allPirates) {
    if (other === pirate) continue;
    if (other.userData.team === ud.team) continue;
    if (other.userData.state === 'fallen') continue;
    if (inSwordArc(pirate, other)) {
      const dmg = ud.isPlayer ? 40 : (ud.team === 'player' ? 20 : 8);
      damagePirate(other, dmg);
      // Knockback
      tmp.subVectors(other.position, pirate.position).setY(0).normalize().multiplyScalar(0.4);
      tryMove(other, tmp.x, tmp.z);
    }
  }
}

function pickup(pirate, target) {
  // target is a pirate ref or 'treasure'
  if (pirate.userData.carrying) return;
  if (target === 'treasure') {
    if (treasure.state !== 'free' && treasure.state !== 'home' && treasure.state !== 'on_enemy_box') return;
    treasure.state = 'carried';
    treasure.carrier = pirate;
    pirate.userData.carrying = 'treasure';
  } else {
    if (target.userData.state !== 'fallen') return;
    if (target.userData.carriedBy) return;
    target.userData.carriedBy = pirate;
    target.userData.state = 'being_carried';
    pirate.userData.carrying = target;
  }
}

function dropAtSpawnBox(pirate) {
  const ud = pirate.userData;
  if (!ud.carrying) return;
  if (ud.carrying === 'treasure') {
    // Decide: which box are we at?
    const onEnemyBox = pirate.position.distanceTo(ENEMY_BOX_POS) < 2.5;
    const onPlayerHome = pirate.position.distanceTo(PLAYER_TREASURE_HOME) < 2.5;
    if (onEnemyBox && ud.team === 'enemy') {
      treasure.state = 'on_enemy_box';
      treasure.position.copy(ENEMY_BOX_POS);
      treasure.position.y = 1.4;
      treasure.carrier = null;
      ud.carrying = null;
    } else if (onPlayerHome && ud.team === 'player') {
      treasure.state = 'home';
      treasure.position.copy(PLAYER_TREASURE_HOME);
      treasure.position.y = 1.4;
      treasure.carrier = null;
      treasure.enemyHoldTime = 0;
      ud.carrying = null;
    } else {
      // Just drop it
      treasure.state = 'free';
      treasure.position.copy(pirate.position);
      treasure.position.y = 0.55;
      treasure.carrier = null;
      ud.carrying = null;
    }
  } else {
    // Carrying a fallen teammate
    const target = ud.carrying;
    const spawn = ud.team === 'player' ? PLAYER_SPAWN_POS : ENEMY_SPAWN_POS;
    const atBox = pirate.position.distanceTo(spawn) < 2.8;
    if (atBox) {
      // Revive!
      target.position.copy(spawn);
      target.position.y = 0.55;
      target.userData.carriedBy = null;
      revive(target);
    } else {
      // Just drop
      target.position.copy(pirate.position);
      target.position.y = 0.5;
      target.userData.carriedBy = null;
    }
    ud.carrying = null;
  }
}

// =========================================================================
// AI
// =========================================================================
function chooseEnemyAITarget(pirate) {
  const ud = pirate.userData;

  // Already carrying treasure: head to box
  if (ud.carrying === 'treasure') return { type: 'deliver_treasure', pos: ENEMY_BOX_POS };
  // Carrying teammate: revive
  if (ud.carrying && ud.carrying.userData) return { type: 'deliver_pirate', pos: ENEMY_SPAWN_POS };

  // Treasure available (on player ship or free)
  if (treasure.state === 'home' || treasure.state === 'free') {
    return { type: 'grab_treasure', pos: treasure.position };
  }

  // Treasure on enemy box and not held — guard it: attack closest player nearby
  // Otherwise attack the carrier or nearest enemy
  if (treasure.state === 'carried' && treasure.carrier && treasure.carrier.userData.team === 'player') {
    return { type: 'attack', target: treasure.carrier };
  }

  // Revive fallen teammate if treasure is safe on box
  if (treasure.state === 'on_enemy_box') {
    let needs = null;
    for (const p of allPirates) {
      if (p.userData.team === 'enemy' && p.userData.state === 'fallen' && !p.userData.carriedBy) {
        if (!needs || pirate.position.distanceTo(p.position) < pirate.position.distanceTo(needs.position)) needs = p;
      }
    }
    if (needs) return { type: 'pickup_pirate', target: needs };
  }

  // Default: attack nearest player pirate
  let best = null, bestDist = Infinity;
  for (const p of allPirates) {
    if (p.userData.team !== 'player') continue;
    if (p.userData.state === 'fallen') continue;
    const d = pirate.position.distanceTo(p.position);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  if (best) return { type: 'attack', target: best };
  return null;
}

function chooseAllyAITarget(pirate) {
  const ud = pirate.userData;

  if (ud.carrying === 'treasure') return { type: 'deliver_treasure', pos: PLAYER_TREASURE_HOME };
  if (ud.carrying && ud.carrying.userData) return { type: 'deliver_pirate', pos: PLAYER_SPAWN_POS };

  // If treasure is being carried by an enemy, attack the carrier
  if (treasure.state === 'carried' && treasure.carrier && treasure.carrier.userData.team === 'enemy') {
    return { type: 'attack', target: treasure.carrier };
  }
  // If treasure is on enemy box, go grab it back
  if (treasure.state === 'on_enemy_box') return { type: 'grab_treasure', pos: treasure.position };
  // If treasure is free (dropped), grab it
  if (treasure.state === 'free') return { type: 'grab_treasure', pos: treasure.position };

  // Pick up fallen teammate (closest one)
  let fallen = null;
  for (const p of allPirates) {
    if (p.userData.team === 'player' && p.userData.state === 'fallen' && !p.userData.carriedBy) {
      if (!fallen || pirate.position.distanceTo(p.position) < pirate.position.distanceTo(fallen.position)) fallen = p;
    }
  }
  if (fallen) return { type: 'pickup_pirate', target: fallen };

  // Attack nearest enemy
  let best = null, bestDist = Infinity;
  for (const p of allPirates) {
    if (p.userData.team !== 'enemy') continue;
    if (p.userData.state === 'fallen') continue;
    const d = pirate.position.distanceTo(p.position);
    if (d < bestDist) { bestDist = d; best = p; }
  }
  if (best) return { type: 'attack', target: best };
  return null;
}

function updateAI(pirate, dt) {
  const ud = pirate.userData;
  if (ud.state === 'fallen' || ud.state === 'being_carried') return;
  if (ud.isPlayer) return;

  ud.aiThink -= dt;
  if (!ud.aiTarget || ud.aiThink <= 0) {
    ud.aiThink = 0.3 + Math.random() * 0.3;
    ud.aiTarget = ud.team === 'enemy' ? chooseEnemyAITarget(pirate) : chooseAllyAITarget(pirate);
  }
  const goal = ud.aiTarget;
  if (!goal) { animatePirate(pirate, dt, false); return; }

  let dest = null;
  if (goal.pos) dest = goal.pos;
  else if (goal.target) dest = goal.target.position;
  if (!dest) { animatePirate(pirate, dt, false); return; }

  const dx = dest.x - pirate.position.x;
  const dz = dest.z - pirate.position.z;
  const distXZ = Math.hypot(dx, dz);

  const closeEnough = goal.type === 'attack' ? 1.8 : (goal.type === 'pickup_pirate' || goal.type === 'grab_treasure') ? 1.4 : 1.6;

  if (distXZ > closeEnough) {
    const speedMul = ud.carrying === 'treasure' ? 0.7 : (ud.carrying ? 0.55 : 1);
    const speed = ud.speed * speedMul;
    const mx = (dx / distXZ) * speed * dt;
    const mz = (dz / distXZ) * speed * dt;
    tryMove(pirate, mx, mz);
    facePoint(pirate, dest, dt);
    animatePirate(pirate, dt, true);
  } else {
    facePoint(pirate, dest, dt);
    animatePirate(pirate, dt, false);
    // Reached target — perform action
    if (goal.type === 'attack' && goal.target && goal.target.userData.state !== 'fallen') {
      attackSwing(pirate);
    } else if (goal.type === 'grab_treasure') {
      if (treasure.state === 'home' || treasure.state === 'free' || treasure.state === 'on_enemy_box') {
        pickup(pirate, 'treasure');
        ud.aiTarget = null;
      }
    } else if (goal.type === 'pickup_pirate' && goal.target) {
      pickup(pirate, goal.target);
      ud.aiTarget = null;
    } else if (goal.type === 'deliver_treasure' || goal.type === 'deliver_pirate') {
      dropAtSpawnBox(pirate);
      ud.aiTarget = null;
    }
  }

  ud.attackCooldown -= dt;
}

// =========================================================================
// PLAYER UPDATE
// =========================================================================
function getCameraVectors() {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() === 0) forward.set(0, 0, -1);
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  return { forward, right };
}

function updatePlayer(dt) {
  if (!player) return;
  const ud = player.userData;

  if (ud.state === 'fallen') {
    // Player knocked out — still rendered, but no input
    animatePirate(player, dt, false);
    ud.attackCooldown -= dt;
    ud.fallTimer += dt;
    return;
  }

  const { forward, right } = getCameraVectors();
  let mx = 0, mz = 0;
  // joystick: input.x = right, input.y = down on screen (so -input.y is forward)
  mx += right.x * input.x + forward.x * (-input.y);
  mz += right.z * input.x + forward.z * (-input.y);
  if (keys['w'] || keys['arrowup']) { mx += forward.x; mz += forward.z; }
  if (keys['s'] || keys['arrowdown']) { mx -= forward.x; mz -= forward.z; }
  if (keys['a'] || keys['arrowleft']) { mx -= right.x; mz -= right.z; }
  if (keys['d'] || keys['arrowright']) { mx += right.x; mz += right.z; }

  const mag = Math.hypot(mx, mz);
  if (mag > 1) { mx /= mag; mz /= mag; }
  const isMoving = mag > 0.05;

  if (isMoving) {
    const speedMul = ud.carrying === 'treasure' ? 0.7 : (ud.carrying ? 0.55 : 1);
    const speed = ud.speed * speedMul;
    tryMove(player, mx * speed * dt, mz * speed * dt);
    const targetYaw = Math.atan2(mx, mz);
    let diff = targetYaw - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * Math.min(1, dt * 12);
  }

  animatePirate(player, dt, isMoving);

  // Auto-pickup nearby fallen teammate or treasure
  if (!ud.carrying) {
    // Treasure
    const td = player.position.distanceTo(treasure.position);
    if ((treasure.state === 'home' || treasure.state === 'free' || treasure.state === 'on_enemy_box') && td < 1.6) {
      pickup(player, 'treasure');
    } else {
      // Fallen ally
      let closest = null, best = Infinity;
      for (const p of allPirates) {
        if (p === player) continue;
        if (p.userData.team !== 'player') continue;
        if (p.userData.state !== 'fallen') continue;
        if (p.userData.carriedBy) continue;
        const d = player.position.distanceTo(p.position);
        if (d < best) { best = d; closest = p; }
      }
      if (closest && best < 1.6) pickup(player, closest);
    }
  }

  // Cannon proximity
  const cannonDist = player.position.distanceTo(CANNON_POS);
  const nearCannon = cannonDist < 3.0;

  if (input.action) {
    if (ud.carrying) {
      dropAtSpawnBox(player);
    } else if (nearCannon && cannon.ready) {
      fireCannon();
    } else {
      attackSwing(player);
    }
  }
  if (input.cannon && nearCannon && cannon.ready) {
    fireCannon();
  }
  input.action = false;
  input.cannon = false;

  ud.attackCooldown -= dt;

  // Update action button label
  if (ud.carrying) {
    actionBtn.textContent = 'DROP';
    actionBtn.classList.add('drop');
  } else if (nearCannon && cannon.ready) {
    actionBtn.textContent = 'FIRE!';
    actionBtn.classList.add('drop');
  } else {
    actionBtn.textContent = 'ATTACK!';
    actionBtn.classList.remove('drop');
  }
}

// =========================================================================
// CANNON
// =========================================================================
function fireCannon() {
  if (!cannon.ready) return;
  cannon.ready = false;
  cannon.cooldown = CANNON_RECHARGE;

  // Visual cannonball
  cannonball = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  cannonball.castShadow = true;
  cannonball.position.set(CANNON_POS.x + 2.5, 1.5, CANNON_POS.z);
  cannonball.userData = {
    velocity: new THREE.Vector3(30, 4, 0),
    life: 2.0,
  };
  scene.add(cannonball);

  // Knock out all enemies on the enemy ship or plank
  for (const p of allPirates) {
    if (p.userData.team !== 'enemy') continue;
    if (p.userData.state === 'fallen') continue;
    if (p.position.x > 0) {
      // Slight delay for dramatic effect — just knock out now for simplicity
      knockOut(p);
    }
  }
}

function updateCannonball(dt) {
  if (!cannonball) return;
  const v = cannonball.userData.velocity;
  cannonball.position.x += v.x * dt;
  cannonball.position.y += v.y * dt;
  v.y -= 15 * dt;
  cannonball.userData.life -= dt;
  if (cannonball.userData.life <= 0 || cannonball.position.y < -3) {
    scene.remove(cannonball);
    cannonball = null;
  }
}

// =========================================================================
// CARRIED POSITION UPDATE
// =========================================================================
function updateCarriedItems() {
  // Treasure follows its carrier on their head
  if (treasure.state === 'carried' && treasure.carrier) {
    treasureMesh.position.copy(treasure.carrier.position);
    treasureMesh.position.y = 3.5;
  } else {
    treasureMesh.position.copy(treasure.position);
    if (treasure.state === 'home' || treasure.state === 'on_enemy_box') treasureMesh.position.y = 1.4;
    else treasureMesh.position.y = 0.55;
  }
  treasureMesh.rotation.y += 0.01;

  // Carried fallen pirate sits on carrier's back
  for (const p of allPirates) {
    if (p.userData.state === 'being_carried' && p.userData.carriedBy) {
      const c = p.userData.carriedBy;
      p.position.copy(c.position);
      p.position.y = 3.4;
      p.rotation.copy(c.rotation);
      p.rotation.x = -Math.PI / 2;
    }
  }
}

// =========================================================================
// GAME STATE UPDATE
// =========================================================================
function updateGameState(dt) {
  // Treasure win timer
  if (treasure.state === 'on_enemy_box') {
    treasure.enemyHoldTime += dt;
    HUD.treasure.textContent = `Enemy holds treasure: ${Math.ceil(60 - treasure.enemyHoldTime)}s`;
    HUD.treasure.classList.add('danger');
    if (treasure.enemyHoldTime >= 60) endGame(false);
  } else if (treasure.state === 'carried' && treasure.carrier?.userData.team === 'enemy') {
    HUD.treasure.textContent = 'Enemy has the treasure!';
    HUD.treasure.classList.add('danger');
  } else if (treasure.state === 'carried' && treasure.carrier?.userData.team === 'player') {
    HUD.treasure.textContent = 'You have the treasure!';
    HUD.treasure.classList.remove('danger');
  } else if (treasure.state === 'free') {
    HUD.treasure.textContent = 'Treasure on the deck!';
    HUD.treasure.classList.remove('danger');
  } else {
    HUD.treasure.textContent = 'Treasure: safe';
    HUD.treasure.classList.remove('danger');
  }

  // Auto-revive after 45s if no one came
  for (const p of allPirates) {
    if (p.userData.state === 'fallen' && !p.userData.carriedBy) {
      p.userData.fallTimer += dt;
      if (p.userData.fallTimer >= 45) {
        const spawn = p.userData.team === 'player' ? PLAYER_SPAWN_POS : ENEMY_SPAWN_POS;
        p.position.copy(spawn);
        p.position.y = 0.55;
        revive(p);
      }
    }
  }

  // Counts
  const allyAlive = allPirates.filter(p => p.userData.team === 'player' && p.userData.state !== 'fallen').length;
  const enemyAlive = allPirates.filter(p => p.userData.team === 'enemy' && p.userData.state !== 'fallen').length;
  HUD.allies.textContent = allyAlive;
  HUD.enemies.textContent = enemyAlive;

  // Player HP
  HUD.health.style.width = Math.max(0, player.userData.health) + '%';

  // Win condition: all enemies fallen at once
  if (enemyAlive === 0) endGame(true);

  // Cannon countdown
  if (!cannon.ready) {
    cannon.cooldown -= dt;
    if (cannon.cooldown <= 0) {
      cannon.ready = true;
      cannon.cooldown = 0;
    }
    const mm = Math.floor(cannon.cooldown / 60);
    const ss = Math.floor(cannon.cooldown % 60);
    HUD.cannon.textContent = `Cannon: ${mm}:${ss.toString().padStart(2, '0')}`;
    HUD.cannon.classList.remove('ready');
    cannonBtn.classList.add('hidden');
  } else {
    HUD.cannon.textContent = 'Cannon: READY!';
    HUD.cannon.classList.add('ready');
    // Show cannon button if player near
    if (player.position.distanceTo(CANNON_POS) < 3.0) cannonBtn.classList.remove('hidden');
    else cannonBtn.classList.add('hidden');
  }
}

// =========================================================================
// CAMERA
// =========================================================================
function updateCamera() {
  if (!player) return;
  // Pulled-back third-person view so the player can see the whole battle
  const desired = new THREE.Vector3(0, 10, -14).applyQuaternion(player.quaternion).add(player.position);
  camera.position.lerp(desired, 0.1);
  const look = new THREE.Vector3(0, 1.5, 5).applyQuaternion(player.quaternion).add(player.position);
  camera.lookAt(look);
}

// =========================================================================
// MAIN LOOP
// =========================================================================
const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (gameState === 'playing') {
    updatePlayer(dt);
    for (const p of allPirates) {
      if (p === player) continue;
      updateAI(p, dt);
    }
    updateCarriedItems();
    updateCannonball(dt);
    updateGameState(dt);
  }

  // Ocean wave animation (runs always for nice menu background)
  const positions = oceanGeo.attributes.position;
  const t = clock.getElapsedTime();
  for (let i = 0; i < positions.count; i++) {
    const ix = i * 3;
    const x = oceanBase[ix];
    const y = oceanBase[ix + 1];
    positions.array[ix + 2] = Math.sin(x * 0.1 + t * 1.5) * 0.4 + Math.cos(y * 0.12 + t * 1.2) * 0.4;
  }
  positions.needsUpdate = true;
  oceanGeo.computeVertexNormals();

  // Ship rocking
  playerShipObj.group.rotation.z = Math.sin(t * 0.6) * 0.03;
  playerShipObj.group.rotation.x = Math.cos(t * 0.5) * 0.02;
  enemyShipObj.group.rotation.z = Math.sin(t * 0.6 + 1) * 0.03;
  enemyShipObj.group.rotation.x = Math.cos(t * 0.5 + 1) * 0.02;
  playerShipObj.sail.rotation.y = Math.sin(t * 0.8) * 0.1;
  enemyShipObj.sail.rotation.y = Math.sin(t * 0.8 + 1) * 0.1;

  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

camera.position.set(PLAYER_SHIP_X - 14, 12, 0);
camera.lookAt(0, 2, 0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

frame();
