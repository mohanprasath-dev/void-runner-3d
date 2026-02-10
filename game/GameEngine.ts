import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { CONFIG, GameStats } from './types';
import { AudioManager } from './AudioManager';

// --- Sub-classes defined here for single-file import convenience in the generated output ---

// 1. PARTICLES
class ParticleSystem {
  private particles: { mesh: THREE.Mesh; life: number; velocity: THREE.Vector3 }[] = [];
  private scene: THREE.Scene;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  }

  spawn(pos: THREE.Vector3, count: number, color: number = 0x00ffff, speed: number = 10) {
    const mat = this.material.clone();
    mat.color.setHex(color);
    
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geometry, mat);
      mesh.position.copy(pos);
      // Random spread
      mesh.position.x += (Math.random() - 0.5) * 2;
      mesh.position.y += (Math.random() - 0.5) * 2;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      );
      
      this.scene.add(mesh);
      this.particles.push({ mesh, life: 1.0, velocity });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += dt * 5;
      p.mesh.scale.setScalar(p.life);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}

// 2. OBSTACLE & WORLD MANAGER
class ObstacleManager {
  private scene: THREE.Scene;
  public obstacles: { mesh: THREE.Group; type: 'CUBE' | 'WALL' | 'COIN'; collider: THREE.Box3; active: boolean }[] = [];
  private spawnZ: number = 0;
  private poolSize: number = 50;
  
  // Geometries/Materials reuse
  private cubeGeo = new THREE.BoxGeometry(4, 4, 4);
  private coinGeo = new THREE.OctahedronGeometry(1.5);
  private wallGeo = new THREE.BoxGeometry(10, 20, 2);
  
  private neonMat = new THREE.MeshStandardMaterial({ 
    color: 0xff0055, 
    emissive: 0xff0055, 
    emissiveIntensity: 2,
    roughness: 0.2,
    metalness: 0.8
  });
  private coinMat = new THREE.MeshStandardMaterial({ 
    color: 0xffdd00, 
    emissive: 0xffaa00, 
    emissiveIntensity: 1.5 
  });
  private wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x0055ff, 
    emissive: 0x0022aa, 
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.9
  });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnInitial(startZ: number) {
    this.spawnZ = startZ;
    for(let i=0; i<10; i++) {
        this.spawnSequence();
    }
  }

  spawnSequence() {
    this.spawnZ -= 40; // Spacing
    const rand = Math.random();
    
    // 20% Chance for coins
    if (Math.random() > 0.7) {
      this.createObstacle(this.spawnZ, 'COIN');
      return;
    }

    // Obstacles
    if (rand < 0.5) {
      this.createObstacle(this.spawnZ, 'CUBE');
    } else {
      this.createObstacle(this.spawnZ, 'WALL');
    }
  }

  createObstacle(z: number, type: 'CUBE' | 'WALL' | 'COIN') {
    const group = new THREE.Group();
    let mesh;
    let collider = new THREE.Box3();

    // Random X position (-15 to 15)
    const xPos = (Math.random() - 0.5) * 30;
    const yPos = (Math.random() - 0.5) * 10; // Vertical variation

    if (type === 'CUBE') {
      mesh = new THREE.Mesh(this.cubeGeo, this.neonMat);
      mesh.position.set(xPos, yPos, 0);
      group.add(mesh);
    } else if (type === 'WALL') {
      mesh = new THREE.Mesh(this.wallGeo, this.wallMat);
      // Walls sometimes block left, right, or center
      const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      mesh.position.set(lane * 12, 0, 0);
      group.add(mesh);
    } else {
      mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
      mesh.position.set(xPos, yPos, 0);
      group.add(mesh);
    }

    group.position.z = z;
    this.scene.add(group);
    
    // Initial collider update
    collider.setFromObject(group);

    this.obstacles.push({ mesh: group, type, collider, active: true });
  }

  update(dt: number, playerZ: number) {
    // Rotate items
    this.obstacles.forEach(o => {
      if (!o.active) return;
      if (o.type === 'CUBE') {
        o.mesh.rotation.x += dt;
        o.mesh.rotation.y += dt;
      } else if (o.type === 'COIN') {
        o.mesh.rotation.y += dt * 3;
      }
      // Update collider world position
      o.collider.setFromObject(o.mesh);
    });

    // Cleanup behind player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].mesh.position.z > playerZ + 20) {
        this.scene.remove(this.obstacles[i].mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new if needed
    if (this.spawnZ > playerZ - 300) {
      this.spawnSequence();
    }
  }

  reset() {
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.obstacles = [];
    this.spawnZ = 0;
  }
}

// 3. MAIN GAME CLASS
export class Game {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  
  private particles: ParticleSystem;
  private obstacleManager: ObstacleManager;
  private audio: AudioManager;
  
  private player: THREE.Group;
  private playerMesh: THREE.Mesh;
  private playerShieldMesh: THREE.Mesh;
  
  // Game State
  private stats: GameStats;
  private onStatsUpdate: (stats: GameStats) => void;
  private onGameOver: (finalStats: GameStats) => void;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  
  // Input
  private input = { x: 0, y: 0, shield: false, boost: false };
  private targetPosition = new THREE.Vector3();
  
  private corridorLines: THREE.LineSegments;

  constructor(
    container: HTMLElement, 
    onStatsUpdate: (s: GameStats) => void,
    onGameOver: (s: GameStats) => void
  ) {
    this.container = container;
    this.onStatsUpdate = onStatsUpdate;
    this.onGameOver = onGameOver;
    this.audio = new AudioManager();

    this.stats = {
      score: 0,
      highScore: parseInt(localStorage.getItem('void_high') || '0'),
      speed: CONFIG.baseSpeed,
      distance: 0,
      lives: 3,
      shieldActive: false,
      shieldCooldown: 0,
      combo: 1,
      multiplier: 1
    };

    // Setup Three.js
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.003);
    
    this.camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Post Processing
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 2.0;
    bloomPass.radius = 0.5;
    
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222222);
    this.scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 10, 10);
    this.scene.add(pointLight);

    // Initialize Subsystems
    this.particles = new ParticleSystem(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    
    // Create Player
    this.player = new THREE.Group();
    const shipGeo = new THREE.ConeGeometry(1, 3, 4);
    shipGeo.rotateX(Math.PI / 2);
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088ff, emissiveIntensity: 0.5, roughness: 0.4 });
    this.playerMesh = new THREE.Mesh(shipGeo, shipMat);
    
    // Engine Trail
    const engineGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const engineMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 1.5;
    this.playerMesh.add(engine);

    // Shield Visual
    const shieldGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, wireframe: true });
    this.playerShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.player.add(this.playerShieldMesh);

    this.player.add(this.playerMesh);
    this.scene.add(this.player);

    // Infinite Grid/Corridor
    const gridGeo = new THREE.BufferGeometry();
    const gridPoints = [];
    // Create a long tube-like grid
    for(let i=0; i<400; i++) {
        const z = -i * 10;
        // A square tunnel
        gridPoints.push(-20, -20, z, 20, -20, z);
        gridPoints.push(20, -20, z, 20, 20, z);
        gridPoints.push(20, 20, z, -20, 20, z);
        gridPoints.push(-20, 20, z, -20, -20, z);
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const gridMat = new THREE.LineBasicMaterial({ color: 0x4400aa, opacity: 0.3, transparent: true });
    this.corridorLines = new THREE.LineSegments(gridGeo, gridMat);
    this.scene.add(this.corridorLines);

    // Starfield
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = [];
    for(let i=0; i<2000; i++) {
      starsPos.push((Math.random()-0.5)*400, (Math.random()-0.5)*400, (Math.random()-0.5)*1000);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.5}));
    this.scene.add(stars);

    // Bind Input
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);

    // Initial Loop
    this.obstacleManager.spawnInitial(-50);
  }

  start() {
    this.audio.init();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  restart() {
    this.stats = {
        score: 0,
        highScore: this.stats.highScore,
        speed: CONFIG.baseSpeed,
        distance: 0,
        lives: 3,
        shieldActive: false,
        shieldCooldown: 0,
        combo: 0,
        multiplier: 1
    };
    this.player.position.set(0,0,0);
    this.obstacleManager.reset();
    this.obstacleManager.spawnInitial(-50);
    this.start();
  }

  dispose() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    this.audio.stop();
    this.container.innerHTML = '';
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch(e.key.toLowerCase()) {
      case 'w': case 'arrowup': this.input.y = 1; break;
      case 's': case 'arrowdown': this.input.y = -1; break;
      case 'a': case 'arrowleft': this.input.x = -1; break;
      case 'd': case 'arrowright': this.input.x = 1; break;
      case ' ': this.activateShield(); break;
      case 'shift': this.input.boost = true; break;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch(e.key.toLowerCase()) {
      case 'w': case 'arrowup': if (this.input.y > 0) this.input.y = 0; break;
      case 's': case 'arrowdown': if (this.input.y < 0) this.input.y = 0; break;
      case 'a': case 'arrowleft': if (this.input.x < 0) this.input.x = 0; break;
      case 'd': case 'arrowright': if (this.input.x > 0) this.input.x = 0; break;
      case 'shift': this.input.boost = false; break;
    }
  }

  private handleMouseMove(e: MouseEvent) {
    // Normalize mouse to -1 to 1
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetPosition.x = x * 15;
    this.targetPosition.y = y * 10;
  }

  private handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  private activateShield() {
    if (this.stats.shieldCooldown <= 0) {
      this.stats.shieldActive = true;
      this.stats.shieldCooldown = 5; // 5s active time
      this.playerShieldMesh.material.opacity = 0.5;
      this.audio.playShieldUp();
    }
  }

  private update(dt: number) {
    const time = performance.now() * 0.001;
    
    // Difficulty Scaling
    const speedMultiplier = this.input.boost ? 1.5 : 1.0;
    this.stats.speed = Math.min(CONFIG.maxSpeed, CONFIG.baseSpeed + (this.stats.distance * 0.01)) * speedMultiplier;
    
    // Player Movement
    const moveSpeed = 30 * dt;
    
    // Use Keyboard if pressed, otherwise drift to mouse target
    if (this.input.x !== 0 || this.input.y !== 0) {
      this.targetPosition.x += this.input.x * moveSpeed * 2;
      this.targetPosition.y += this.input.y * moveSpeed * 2;
    }

    // Clamp
    this.targetPosition.x = Math.max(-18, Math.min(18, this.targetPosition.x));
    this.targetPosition.y = Math.max(-12, Math.min(12, this.targetPosition.y));

    // Smooth Lerp
    this.player.position.x += (this.targetPosition.x - this.player.position.x) * 5 * dt;
    this.player.position.y += (this.targetPosition.y - this.player.position.y) * 5 * dt;
    
    // Forward Movement
    const distStep = this.stats.speed * dt;
    this.player.position.z -= distStep;
    this.stats.distance += distStep;

    // Banking
    this.playerMesh.rotation.z = - (this.player.position.x - this.targetPosition.x) * 0.1;
    this.playerMesh.rotation.x = (this.player.position.y - this.targetPosition.y) * 0.05;

    // Camera follow
    this.camera.position.x = this.player.position.x * 0.3;
    this.camera.position.y = this.player.position.y * 0.3 + 3;
    this.camera.position.z = this.player.position.z + 10;
    this.camera.lookAt(this.player.position.x * 0.1, this.player.position.y * 0.1, this.player.position.z - 20);

    // Shield Logic
    if (this.stats.shieldActive) {
      this.stats.shieldCooldown -= dt;
      this.playerShieldMesh.rotation.y += dt * 5;
      if (this.stats.shieldCooldown <= 0) {
        this.stats.shieldActive = false;
        this.stats.shieldCooldown = 5; // Cooldown start
        this.playerShieldMesh.material.opacity = 0;
      }
    } else if (this.stats.shieldCooldown > 0) {
        // Cooldown recovery
       this.stats.shieldCooldown -= dt;
    }

    // Managers
    this.obstacleManager.update(dt, this.player.position.z);
    this.particles.update(dt);
    this.audio.updateEnginePitch(this.stats.speed / CONFIG.maxSpeed);

    // Collision Detection
    const playerBox = new THREE.Box3().setFromObject(this.playerMesh);
    
    for (const obs of this.obstacleManager.obstacles) {
      if (!obs.active) continue;
      
      if (playerBox.intersectsBox(obs.collider)) {
        if (obs.type === 'COIN') {
           // Collect
           obs.active = false;
           obs.mesh.visible = false;
           this.stats.score += 100 * this.stats.multiplier;
           this.stats.combo++;
           if (this.stats.combo % 5 === 0) this.stats.multiplier++;
           this.audio.playCollect();
           this.particles.spawn(obs.mesh.position, 10, 0xffff00);
        } else {
           // Crash
           if (this.stats.shieldActive) {
             // Shield hit
             obs.active = false;
             this.particles.spawn(obs.mesh.position, 20, 0x00ff00);
             this.audio.playCrash();
             this.stats.shieldActive = false; // Break shield
             this.stats.shieldCooldown = 5;
           } else {
             // Damage
             this.handleCrash();
             if (this.stats.lives <= 0) return; // Stop update if game over
             // If not dead, maybe push back or invincibility?
             // Simple: remove obstacle so we don't hit it next frame
             obs.active = false;
           }
        }
      }
    }

    // Stats Update
    this.stats.score += Math.floor(distStep * 0.1 * this.stats.multiplier);
    this.onStatsUpdate({...this.stats});

    // Infinite Corridor Illusion: Move Corridor grid with player to fake infinity
    // Snap grid to z every 10 units
    this.corridorLines.position.z = Math.floor(this.player.position.z / 10) * 10;
  }

  private handleCrash() {
    this.stats.lives--;
    this.stats.combo = 0;
    this.stats.multiplier = 1;
    this.audio.playCrash();
    
    // Screen shake
    this.camera.position.x += (Math.random()-0.5) * 2;
    this.camera.position.y += (Math.random()-0.5) * 2;

    this.particles.spawn(this.player.position, 50, 0xff0000, 20);

    if (this.stats.lives <= 0) {
      this.isRunning = false;
      if (this.stats.score > this.stats.highScore) {
        localStorage.setItem('void_high', this.stats.score.toString());
      }
      this.onGameOver(this.stats);
    }
  }

  private animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) * 0.001, 0.1); // Cap dt
    this.lastTime = now;

    this.update(dt);
    this.composer.render();
  }
}