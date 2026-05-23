import * as THREE from 'three';

// ---------- Scene, camera, renderer ----------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 180);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// ---------- Lights ----------
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.0);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
scene.add(sun);

// ---------- Ocean ----------
const oceanGeo = new THREE.PlaneGeometry(400, 400, 40, 40);
const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1e6091, roughness: 0.6, metalness: 0.1, flatShading: true });
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -2;
ocean.receiveShadow = true;
scene.add(ocean);
const oceanBasePositions = oceanGeo.attributes.position.array.slice();

// ---------- Build pirate ship ----------
const ship = new THREE.Group();
scene.add(ship);

const shipLength = 24;
const shipWidth = 10;

// Hull (a chunky low-poly boat shape made of boxes)
const hullMat = new THREE.MeshStandardMaterial({ color: 0x6b3a1a, flatShading: true });
const hullTopMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });

const hullBottom = new THREE.Mesh(new THREE.BoxGeometry(shipWidth, 2.5, shipLength), hullMat);
hullBottom.position.y = -1;
hullBottom.castShadow = true;
hullBottom.receiveShadow = true;
ship.add(hullBottom);

// Bow (front pointy bit)
const bowGeo = new THREE.ConeGeometry(shipWidth / 2, 4, 4);
const bow = new THREE.Mesh(bowGeo, hullMat);
bow.position.set(0, -1, shipLength / 2 + 1);
bow.rotation.x = Math.PI / 2;
bow.rotation.y = Math.PI / 4;
bow.castShadow = true;
ship.add(bow);

// Deck (where you walk)
const deckGeo = new THREE.BoxGeometry(shipWidth - 1, 0.3, shipLength);
const deck = new THREE.Mesh(deckGeo, hullTopMat);
deck.position.y = 0.4;
deck.receiveShadow = true;
ship.add(deck);

// Wood plank lines on deck
for (let i = -shipLength / 2 + 2; i < shipLength / 2; i += 2) {
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(shipWidth - 1.2, 0.32, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x5a3a18, flatShading: true })
  );
  plank.position.set(0, 0.41, i);
  ship.add(plank);
}

// Railings around deck
const railMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, flatShading: true });
function addRail(x, z, w, d) {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), railMat);
  rail.position.set(x, 1, z);
  rail.castShadow = true;
  ship.add(rail);
}
addRail(-(shipWidth / 2) + 0.3, 0, 0.3, shipLength - 0.5);
addRail((shipWidth / 2) - 0.3, 0, 0.3, shipLength - 0.5);
addRail(0, -(shipLength / 2) + 0.3, shipWidth - 1, 0.3);

// Mast and sail
const mast = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.4, 14, 8),
  new THREE.MeshStandardMaterial({ color: 0x6b4226, flatShading: true })
);
mast.position.set(0, 7, 2);
mast.castShadow = true;
ship.add(mast);

const sail = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 8),
  new THREE.MeshStandardMaterial({ color: 0xfff8e7, side: THREE.DoubleSide, flatShading: true, roughness: 0.9 })
);
sail.position.set(0, 8, 2);
sail.castShadow = true;
ship.add(sail);

// Skull-and-crossbones-ish circle on the sail (just a black circle for cartoony charm)
const flag = new THREE.Mesh(
  new THREE.CircleGeometry(1.4, 16),
  new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
);
flag.position.set(0, 8.4, 2.02);
ship.add(flag);

// Treasure chest at the back
const chest = new THREE.Group();
const chestBody = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1.2, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true })
);
chestBody.position.y = 0.6;
chestBody.castShadow = true;
chest.add(chestBody);
const chestLid = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0xffc107, flatShading: true })
);
chestLid.position.y = 1.4;
chestLid.castShadow = true;
chest.add(chestLid);
chest.position.set(0, 0.6, -shipLength / 2 + 1.5);
ship.add(chest);

// ---------- Pirate factory ----------
function createPirate({ shirt = 0xc62828, hat = 0x111111, isPlayer = false } = {}) {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.6, 0.7),
    new THREE.MeshStandardMaterial({ color: shirt, flatShading: true })
  );
  body.position.y = 1.4;
  body.castShadow = true;
  group.add(body);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.25, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, flatShading: true })
  );
  belt.position.y = 0.7;
  group.add(belt);

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x37474f, flatShading: true });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.5), legMat);
  legL.position.set(-0.28, 0.05, 0);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.28;
  group.add(legR);

  // Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xffd9a5, flatShading: true })
  );
  head.position.y = 2.65;
  head.castShadow = true;
  group.add(head);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
  eyeL.position.set(-0.2, 2.75, 0.46);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;
  group.add(eyeR);

  // Eye patch (left eye)
  const patch = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  patch.position.set(-0.2, 2.75, 0.47);
  group.add(patch);

  // Mouth
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x4e2a14 })
  );
  mouth.position.set(0.05, 2.5, 0.46);
  group.add(mouth);

  // Hat (cylinder base + cone-ish top -> use a chunky tricorn approximation)
  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: hat, flatShading: true })
  );
  hatBrim.position.y = 3.18;
  hatBrim.castShadow = true;
  group.add(hatBrim);
  const hatTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.7),
    new THREE.MeshStandardMaterial({ color: hat, flatShading: true })
  );
  hatTop.position.y = 3.45;
  hatTop.castShadow = true;
  group.add(hatTop);

  // Arms (pivot point at shoulder)
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

  // Store handles for animation
  group.userData = {
    armLPivot,
    armRPivot,
    legL,
    legR,
    body,
    head,
    sword,
    isPlayer,
    walkPhase: Math.random() * Math.PI * 2,
    swingTimer: 0,
    flashTimer: 0,
    health: isPlayer ? 100 : 30,
    speed: isPlayer ? 6 : 2 + Math.random() * 1.5,
    attackCooldown: 0,
  };

  return group;
}

// Player pirate
const player = createPirate({ shirt: 0x1565c0, hat: 0x111111, isPlayer: true });
player.position.set(0, 0.55, 0);
scene.add(player);

// Enemies live in this array
const enemies = [];

function spawnEnemy() {
  const colors = [0x6a1b9a, 0xd84315, 0x2e7d32, 0xb71c1c, 0x4527a0];
  const enemy = createPirate({
    shirt: colors[Math.floor(Math.random() * colors.length)],
    hat: 0x222222,
  });
  // Spawn at edge of deck
  const side = Math.random() < 0.5 ? -1 : 1;
  const z = (Math.random() - 0.5) * (shipLength - 4);
  enemy.position.set(side * (shipWidth / 2 - 1), 0.55, z);
  scene.add(enemy);
  enemies.push(enemy);
}

// ---------- Input ----------
const keys = {};
const input = { x: 0, y: 0, attack: false };

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space') input.attack = true;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Joystick (left half of screen)
const joyZone = document.getElementById('joystick-zone');
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');

let joyActive = false;
let joyId = null;
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
  if (len > JOY_RADIUS) {
    dx = (dx / len) * JOY_RADIUS;
    dy = (dy / len) * JOY_RADIUS;
  }
  updateJoyStick(dx, dy);
  input.x = dx / JOY_RADIUS;
  input.y = dy / JOY_RADIUS;
}
function endJoy() {
  joyActive = false;
  joyId = null;
  joyBase.classList.remove('active');
  input.x = 0;
  input.y = 0;
}

joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  startJoy(t.clientX, t.clientY, t.identifier);
}, { passive: false });

joyZone.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) moveJoy(t.clientX, t.clientY);
  }
}, { passive: false });

joyZone.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) endJoy();
  }
}, { passive: false });
joyZone.addEventListener('touchcancel', endJoy);

// Attack button
const attackBtn = document.getElementById('attack-btn');
function triggerAttack() { input.attack = true; }
attackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerAttack(); }, { passive: false });
attackBtn.addEventListener('mousedown', (e) => { e.preventDefault(); triggerAttack(); });

// ---------- Game state ----------
let gameState = 'start'; // 'start' | 'playing' | 'over'
let kills = 0;
let spawnTimer = 0;
let waveTimer = 0;
const HUD = {
  health: document.getElementById('health-bar'),
  kills: document.getElementById('kills'),
};

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalKills = document.getElementById('final-kills');
const gameOverTitle = document.getElementById('game-over-title');

function startGame() {
  kills = 0;
  spawnTimer = 0;
  waveTimer = 0;
  // remove existing enemies
  for (const e of enemies) scene.remove(e);
  enemies.length = 0;
  // reset player
  player.position.set(0, 0.55, 0);
  player.rotation.y = 0;
  player.userData.health = 100;
  HUD.kills.textContent = '0';
  HUD.health.style.width = '100%';
  // spawn initial enemies
  for (let i = 0; i < 2; i++) spawnEnemy();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  gameState = 'playing';
}

function endGame(won) {
  gameState = 'over';
  finalKills.textContent = kills;
  gameOverTitle.textContent = won ? 'VICTORY, CAPTAIN!' : 'YE BE DEFEATED!';
  gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// ---------- Helpers ----------
const tmpVec = new THREE.Vector3();

function clampToShip(obj) {
  const halfW = shipWidth / 2 - 0.8;
  const halfL = shipLength / 2 - 0.8;
  obj.position.x = Math.max(-halfW, Math.min(halfW, obj.position.x));
  obj.position.z = Math.max(-halfL, Math.min(halfL, obj.position.z));
}

function animatePirate(p, dt, isMoving) {
  const ud = p.userData;
  if (isMoving) {
    ud.walkPhase += dt * 10;
    const swing = Math.sin(ud.walkPhase) * 0.6;
    ud.legL.rotation.x = swing;
    ud.legR.rotation.x = -swing;
    if (ud.swingTimer <= 0) ud.armLPivot.rotation.x = -swing * 0.6;
    p.position.y = 0.55 + Math.abs(Math.sin(ud.walkPhase * 1.0)) * 0.05;
  } else {
    ud.legL.rotation.x *= 0.85;
    ud.legR.rotation.x *= 0.85;
    if (ud.swingTimer <= 0) ud.armLPivot.rotation.x *= 0.85;
    p.position.y = 0.55;
  }

  // Sword swing animation
  if (ud.swingTimer > 0) {
    ud.swingTimer -= dt;
    const t = 1 - Math.max(0, ud.swingTimer) / 0.35;
    // swing forward then back
    const angle = Math.sin(t * Math.PI) * 2.2;
    ud.armRPivot.rotation.x = -angle;
  } else {
    ud.armRPivot.rotation.x *= 0.85;
  }

  // Flash red when hit
  if (ud.flashTimer > 0) {
    ud.flashTimer -= dt;
    ud.body.material.emissive.setHex(0xff0000);
    ud.body.material.emissiveIntensity = ud.flashTimer * 3;
  } else {
    ud.body.material.emissive.setHex(0x000000);
  }
}

function swingHits(attacker, target) {
  // Hit if target is within 2.5 units in front of attacker
  const forward = tmpVec.set(0, 0, 1).applyQuaternion(attacker.quaternion);
  const toTarget = new THREE.Vector3().subVectors(target.position, attacker.position);
  const dist = toTarget.length();
  if (dist > 2.5) return false;
  toTarget.normalize();
  const dot = forward.dot(toTarget);
  return dot > 0.3;
}

// ---------- Main loop ----------
const clock = new THREE.Clock();

function update(dt) {
  if (gameState !== 'playing') return;

  // Keyboard input merged with joystick
  let moveX = input.x;
  let moveZ = input.y;
  if (keys['w'] || keys['arrowup']) moveZ -= 1;
  if (keys['s'] || keys['arrowdown']) moveZ += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;
  const mag = Math.hypot(moveX, moveZ);
  if (mag > 1) { moveX /= mag; moveZ /= mag; }

  // Joystick Y is screen-down, but in world we want -Z = forward (into screen)
  // Camera is behind player looking forward, so screen-up = world -Z = forward.
  // joystick dy positive = down on screen = move backward = +Z
  const worldX = moveX;
  const worldZ = moveZ; // joystick down -> +z (backwards), which is fine

  const isMoving = Math.hypot(worldX, worldZ) > 0.05;
  if (isMoving) {
    const speed = player.userData.speed;
    player.position.x += worldX * speed * dt;
    player.position.z += worldZ * speed * dt;
    // Face movement direction
    const targetYaw = Math.atan2(worldX, worldZ);
    // Smoothly turn
    let diff = targetYaw - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * Math.min(1, dt * 12);
  }
  clampToShip(player);
  animatePirate(player, dt, isMoving);

  // Attack
  if (input.attack && player.userData.swingTimer <= 0) {
    player.userData.swingTimer = 0.35;
    // Check hits
    for (const enemy of enemies) {
      if (enemy.userData.health <= 0) continue;
      if (swingHits(player, enemy)) {
        enemy.userData.health -= 20;
        enemy.userData.flashTimer = 0.25;
        // Knockback
        const back = new THREE.Vector3().subVectors(enemy.position, player.position).normalize().multiplyScalar(0.4);
        enemy.position.add(back);
        if (enemy.userData.health <= 0) {
          kills++;
          HUD.kills.textContent = kills;
        }
      }
    }
  }
  input.attack = false;

  // Enemies update
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const ud = e.userData;

    if (ud.health <= 0) {
      // Death animation: fall and shrink
      e.rotation.x += dt * 3;
      e.scale.multiplyScalar(0.96);
      e.position.y -= dt * 1.5;
      if (e.scale.x < 0.1) {
        scene.remove(e);
        enemies.splice(i, 1);
      }
      continue;
    }

    // Move toward player
    const toPlayer = new THREE.Vector3().subVectors(player.position, e.position);
    const dist = toPlayer.length();
    toPlayer.normalize();

    if (dist > 1.6) {
      e.position.x += toPlayer.x * ud.speed * dt;
      e.position.z += toPlayer.z * ud.speed * dt;
      animatePirate(e, dt, true);
    } else {
      animatePirate(e, dt, false);
      // Attack player
      if (ud.attackCooldown <= 0) {
        ud.attackCooldown = 1.2;
        ud.swingTimer = 0.35;
        player.userData.health -= 8;
        player.userData.flashTimer = 0.25;
        HUD.health.style.width = Math.max(0, player.userData.health) + '%';
        if (player.userData.health <= 0) {
          endGame(false);
        }
      }
    }
    ud.attackCooldown -= dt;

    // Face player
    const targetYaw = Math.atan2(toPlayer.x, toPlayer.z);
    let diff = targetYaw - e.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    e.rotation.y += diff * Math.min(1, dt * 8);

    clampToShip(e);
  }

  // Spawn more enemies over time (waves get harder)
  spawnTimer -= dt;
  waveTimer += dt;
  const targetCount = Math.min(2 + Math.floor(waveTimer / 15), 7);
  if (spawnTimer <= 0 && enemies.filter(e => e.userData.health > 0).length < targetCount) {
    spawnTimer = 2.5;
    spawnEnemy();
  }

  // Ocean wave animation
  const positions = oceanGeo.attributes.position;
  const t = clock.getElapsedTime();
  for (let i = 0; i < positions.count; i++) {
    const ix = i * 3;
    const x = oceanBasePositions[ix];
    const y = oceanBasePositions[ix + 1];
    positions.array[ix + 2] = Math.sin(x * 0.1 + t * 1.5) * 0.4 + Math.cos(y * 0.12 + t * 1.2) * 0.4;
  }
  positions.needsUpdate = true;
  oceanGeo.computeVertexNormals();

  // Gentle ship rocking
  ship.rotation.z = Math.sin(t * 0.6) * 0.03;
  ship.rotation.x = Math.cos(t * 0.5) * 0.02;
  // Flag/sail wave (simple)
  sail.rotation.y = Math.sin(t * 0.8) * 0.1;
}

function updateCamera() {
  // Third-person follow
  const desired = new THREE.Vector3(0, 4.5, -7).applyQuaternion(player.quaternion).add(player.position);
  camera.position.lerp(desired, 0.12);
  const lookTarget = new THREE.Vector3(0, 1.5, 4).applyQuaternion(player.quaternion).add(player.position);
  camera.lookAt(lookTarget);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// Initial camera position
camera.position.set(0, 6, -10);
camera.lookAt(0, 1, 4);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loop();
