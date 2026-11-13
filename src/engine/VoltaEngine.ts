import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import { LOCATIONS, LocationDef } from '../data/locations';
import { computePlayerAttributes } from '../data/progression';
import {
  AvatarConfig,
  CalloutEvent,
  LocationId,
  MatchConfig,
  MatchSnapshot,
  MatchStats,
  SaveProgress,
} from '../types/game';
import {
  ArenaHandles,
  BallRig,
  PlayerRig,
  createBallModel,
  createEnvironmentArena,
  createStreetPlayerModel,
} from './models';

// Pre-allocated math helpers (zero GC inside animation loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();

interface SimPlayer {
  id: string;
  name: string;
  team: 'home' | 'away';
  isGoalie: boolean;
  rig: PlayerRig;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  stamina: number;
  stridePhase: number;
  skillTimer: number;
  tackleTimer: number;
  stunTimer: number;
  kickAnimTimer: number;
  homeX: number;
  homeZ: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export type EngineMode = 'title' | 'avatar' | 'match';

export interface EngineCallbacks {
  onSnapshot: (snap: MatchSnapshot) => void;
  onMatchEnd: (stats: MatchStats) => void;
}

export class VoltaEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private isSoftwareGl: boolean;
  private maxAniso: number;

  private arena: ArenaHandles | null = null;
  private currentLocation: LocationDef = LOCATIONS.mellassine;
  private ballRig: BallRig;

  // Ball physics
  private ballX = 0;
  private ballY = 0.22;
  private ballZ = 0;
  private ballVx = 0;
  private ballVy = 0;
  private ballVz = 0;
  private ownerId: string | null = null;
  private lastTouchTeam: 'home' | 'away' | null = null;
  private lastWallBounceAge = 99;
  private pickupCooldown = 0;

  // Players & Avatar preview
  private players: SimPlayer[] = [];
  private controlledId: string | null = null;
  private previewRig: PlayerRig | null = null;

  // Particle pool
  private particles: Particle[] = [];
  private particleGroup = new THREE.Group();

  // Simulation state
  private engineMode: EngineMode = 'title';
  private paused = false;
  private matchConfig: MatchConfig | null = null;
  private saveProgress: SaveProgress;
  private homeScore = 0;
  private awayScore = 0;
  private timeRemaining = 90;
  private arcadeScore = 0;
  private styleCombo = 1;
  private comboTimer = 0;
  private goalResetTimer = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private crowdCheerTimer = 0;
  private titleCamAngle = 0;
  private calloutSeq = 0;
  private pendingCallout: CalloutEvent | null = null;

  // Match telemetry stats
  private statsGoals = 0;
  private statsNutmegs = 0;
  private statsWallPasses = 0;
  private statsSkills = 0;
  private statsTackles = 0;

  // Arcade targets state
  private targetsActive: Array<{ x: number; y: number; z: number; alive: boolean; respawn: number }> = [];

  // Input state
  private heldKeys = new Set<string>();
  private virtualAxis = { x: 0, z: 0 };
  private isChargingShot = false;
  private shotCharge = 0;
  private bufferedPass = false;
  private bufferedSkill = false;
  private bufferedSwitch = false;
  private bufferedShootRelease = false;

  // Loop & lifecycle
  private frameId = 0;
  private lastTime = 0;
  private hudThrottle = 0;
  private disposed = false;

  constructor(container: HTMLElement, saveProgress: SaveProgress, callbacks: EngineCallbacks) {
    this.container = container;
    this.saveProgress = saveProgress;
    this.callbacks = callbacks;

    // 1. Software WebGL probe (exact directive pattern)
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // 3. Scene & Studio RoomEnvironment
    this.scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.2, 260);
    this.camera.position.set(0, 14, 18);
    this.camera.lookAt(0, 0, 0);

    // 5. 3-Point / Outdoor Floodlight Rig
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x334155, 0.75);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffedd5, 2.3);
    this.keyLight.position.set(14, 24, 16);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 70;
    this.keyLight.shadow.camera.left = -20;
    this.keyLight.shadow.camera.right = 20;
    this.keyLight.shadow.camera.top = 20;
    this.keyLight.shadow.camera.bottom = -20;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    this.rimLight.position.set(-16, 12, -18);
    this.scene.add(this.rimLight);

    // 6. Ball & Particle pool
    this.ballRig = createBallModel(this.maxAniso);
    this.scene.add(this.ballRig.root);
    this.scene.add(this.particleGroup);
    this.initParticlePool();

    // 7. Build initial Title Scrimmage arena
    this.loadLocation('mellassine');
    this.setupTitleScrimmage();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 8. Listeners
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);

    this.lastTime = performance.now();
    this.scheduleNextTick();
  }

  private initParticlePool(): void {
    const geo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    for (let i = 0; i < 42; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particles.push({ mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.5 });
    }
  }

  private spawnBurst(x: number, y: number, z: number, color: string, count = 10, speed = 5): void {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (p.life <= 0) {
        p.mesh.position.set(x, y, z);
        (p.mesh.material as THREE.MeshBasicMaterial).color.set(color);
        p.mesh.visible = true;
        const ang = Math.random() * Math.PI * 2;
        const spd = speed * (0.4 + Math.random() * 0.8);
        p.vx = Math.cos(ang) * spd;
        p.vy = 2.2 + Math.random() * 3.5;
        p.vz = Math.sin(ang) * spd;
        p.maxLife = 0.35 + Math.random() * 0.25;
        p.life = p.maxLife;
        spawned++;
      }
    }
  }

  public loadLocation(locId: LocationId): void {
    const loc = LOCATIONS[locId];
    this.currentLocation = loc;

    if (this.arena) {
      this.scene.remove(this.arena.group);
      this.arena.dispose();
    }

    this.arena = createEnvironmentArena(loc, this.maxAniso);
    this.scene.add(this.arena.group);

    this.scene.background = new THREE.Color(loc.skyColor);
    this.scene.fog = new THREE.FogExp2(loc.fogColor, loc.fogDensity);
    this.keyLight.color.set(loc.keyLightColor);
    this.keyLight.intensity = loc.keyLightIntensity;
    this.hemiLight.color.set(loc.hemiSky);
    this.hemiLight.groundColor.set(loc.hemiGround);
  }

  public updateSaveProgress(save: SaveProgress): void {
    this.saveProgress = save;
    if (this.engineMode === 'avatar') {
      this.refreshAvatarPreview(save.avatar);
    }
  }

  public setTitleScreenMode(locId?: LocationId): void {
    this.engineMode = 'title';
    this.paused = false;
    if (locId && locId !== this.currentLocation.id) {
      this.loadLocation(locId);
    }
    this.setupTitleScrimmage();
  }

  public setAvatarPreviewMode(avatar: AvatarConfig): void {
    this.engineMode = 'avatar';
    this.paused = false;
    this.clearPlayers();
    this.ballRig.root.visible = false;
    this.refreshAvatarPreview(avatar);
  }

  private refreshAvatarPreview(avatar: AvatarConfig): void {
    if (this.previewRig) {
      this.scene.remove(this.previewRig.root);
    }
    this.previewRig = createStreetPlayerModel(avatar);
    this.previewRig.root.position.set(0, 0, 0);
    this.previewRig.selectionRing.visible = true;
    this.scene.add(this.previewRig.root);
  }

  private clearPlayers(): void {
    this.players.forEach((p) => this.scene.remove(p.rig.root));
    this.players = [];
    if (this.previewRig) {
      this.scene.remove(this.previewRig.root);
      this.previewRig = null;
    }
  }

  private setupTitleScrimmage(): void {
    this.clearPlayers();
    this.ballRig.root.visible = true;
    this.arena?.targetMeshes.forEach((m) => (m.visible = false));

    // Spawn a lively 3v3 AI warm-up scrimmage
    const homeColor = this.saveProgress.squad.primaryColor || '#f59e0b';
    const awayColor = '#38bdf8';
    const slots: Array<{ x: number; z: number }> = [
      { x: -3.2, z: 3.5 },
      { x: 3.2, z: 3.5 },
      { x: 0, z: 7.2 },
    ];
    slots.forEach((s, i) => {
      this.spawnSimPlayer(`th${i}`, 'STREET', 'home', false, s.x, s.z, homeColor, this.saveProgress.avatar);
      this.spawnSimPlayer(`ta${i}`, 'RIVAL', 'away', false, -s.x, -s.z, awayColor);
    });
    this.controlledId = null;
    this.resetBallCenter();
  }

  public startMatch(config: MatchConfig): void {
    this.matchConfig = config;
    this.engineMode = 'match';
    this.paused = false;
    this.loadLocation(config.location);
    this.clearPlayers();
    this.ballRig.root.visible = true;

    this.homeScore = 0;
    this.awayScore = 0;
    this.arcadeScore = 0;
    this.timeRemaining = config.durationSec;
    this.styleCombo = 1;
    this.comboTimer = 0;
    this.goalResetTimer = 0;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.statsGoals = 0;
    this.statsNutmegs = 0;
    this.statsWallPasses = 0;
    this.statsSkills = 0;
    this.statsTackles = 0;
    this.isChargingShot = false;
    this.shotCharge = 0;

    // Hide targets unless in Target Shooting arcade
    this.arena?.targetMeshes.forEach((m) => (m.visible = false));
    this.targetsActive = [];

    if (config.mode === 'arcade' && config.arcadeGame === 'targets') {
      // 1 player vs targets
      this.spawnSimPlayer(
        'hero',
        this.saveProgress.avatar.name,
        'home',
        false,
        0,
        4.5,
        this.saveProgress.avatar.topColor,
        this.saveProgress.avatar
      );
      this.controlledId = 'hero';
      this.spawnArcadeTargets();
    } else if (config.mode === 'arcade' && config.arcadeGame === 'king') {
      // 1v1 King of the Cage
      this.spawnSimPlayer(
        'hero',
        this.saveProgress.avatar.name,
        'home',
        false,
        0,
        4.5,
        this.saveProgress.avatar.topColor,
        this.saveProgress.avatar
      );
      this.spawnSimPlayer('rival0', 'KING CHALLENGER', 'away', false, 0, -5.5, config.opponentColor);
      this.controlledId = 'hero';
    } else if (config.mode === 'arcade' && config.arcadeGame === 'wallvolley') {
      // 1 player + AI keeper
      this.spawnSimPlayer(
        'hero',
        this.saveProgress.avatar.name,
        'home',
        false,
        0,
        4.5,
        this.saveProgress.avatar.topColor,
        this.saveProgress.avatar
      );
      this.spawnSimPlayer('gkAway', 'KEEPER', 'away', true, 0, -this.currentLocation.pitchLength / 2 + 1.2, config.opponentColor);
      this.controlledId = 'hero';
    } else {
      // Standard 3v3 / 4v4 / 5v5
      const count = config.format === '3v3' ? 3 : config.format === '4v4' ? 4 : 5;
      const halfL = this.currentLocation.pitchLength / 2;
      const homeSlots = this.getFormationSlots(count, halfL, 1);
      const awaySlots = this.getFormationSlots(count, halfL, -1);

      homeSlots.forEach((slot, idx) => {
        const isHero = idx === 0;
        const isGk = !config.noGoalkeeper && idx === count - 1;
        const crewM = this.saveProgress.squad.roster[idx - 1];
        const avatarOverride = isHero
          ? this.saveProgress.avatar
          : crewM
          ? {
              ...this.saveProgress.avatar,
              skinTone: crewM.skinTone,
              hairStyle: crewM.hairStyle,
              hairColor: crewM.hairColor,
              topStyle: crewM.topStyle,
            }
          : undefined;
        const pName = isHero ? this.saveProgress.avatar.name : crewM ? crewM.name : `CREW ${idx + 1}`;
        this.spawnSimPlayer(
          `h${idx}`,
          pName,
          'home',
          isGk,
          slot.x,
          slot.z,
          this.saveProgress.avatar.topColor,
          avatarOverride
        );
      });

      awaySlots.forEach((slot, idx) => {
        const isGk = !config.noGoalkeeper && idx === count - 1;
        this.spawnSimPlayer(`a${idx}`, `${config.opponentName} ${idx + 1}`, 'away', isGk, slot.x, slot.z, config.opponentColor);
      });

      this.controlledId = 'h0';
    }

    this.resetBallCenter();
    soundEngine.playWhistle(false);
    this.emitHudSnapshot();
  }

  private getFormationSlots(count: number, halfL: number, zSign: number): Array<{ x: number; z: number }> {
    if (count === 3) {
      return [
        { x: 0, z: zSign * 3.2 },
        { x: -3.5, z: zSign * 6.2 },
        { x: 3.5, z: zSign * (halfL - 2.2) },
      ];
    }
    if (count === 4) {
      return [
        { x: 0, z: zSign * 2.8 },
        { x: -4.0, z: zSign * 5.6 },
        { x: 4.0, z: zSign * 5.6 },
        { x: 0, z: zSign * (halfL - 1.5) },
      ];
    }
    return [
      { x: 0, z: zSign * 2.6 },
      { x: -4.2, z: zSign * 5.2 },
      { x: 4.2, z: zSign * 5.2 },
      { x: 0, z: zSign * 8.4 },
      { x: 0, z: zSign * (halfL - 1.4) },
    ];
  }

  private spawnSimPlayer(
    id: string,
    name: string,
    team: 'home' | 'away',
    isGoalie: boolean,
    x: number,
    z: number,
    kitColor: string,
    customAvatar?: AvatarConfig
  ): void {
    const baseAvatar: AvatarConfig = customAvatar || {
      name,
      skinTone: ['#c68b59', '#8d5524', '#e0ac69', '#a5694f'][Math.floor(Math.random() * 4)],
      hairStyle: (['fade', 'afro', 'braids', 'buzz', 'cap'] as const)[Math.floor(Math.random() * 5)],
      hairColor: '#18181b',
      topStyle: (['hoodie', 'jersey', 'jacket'] as const)[Math.floor(Math.random() * 3)],
      topColor: kitColor,
      accentColor: '#f8fafc',
      shortsColor: '#0f172a',
      sneakerColor: '#f8fafc',
      hasTattoo: Math.random() > 0.5,
      role: 'striker',
    };

    const rig = createStreetPlayerModel(baseAvatar, kitColor, isGoalie);
    rig.root.position.set(x, 0, z);
    rig.root.rotation.y = team === 'home' ? Math.PI : 0;
    this.scene.add(rig.root);

    this.players.push({
      id,
      name,
      team,
      isGoalie,
      rig,
      x,
      z,
      vx: 0,
      vz: 0,
      facing: team === 'home' ? Math.PI : 0,
      stamina: 1,
      stridePhase: Math.random() * Math.PI * 2,
      skillTimer: 0,
      tackleTimer: 0,
      stunTimer: 0,
      kickAnimTimer: 0,
      homeX: x,
      homeZ: z,
    });
  }

  private spawnArcadeTargets(): void {
    if (!this.arena) return;
    const halfW = this.currentLocation.pitchWidth / 2;
    const halfL = this.currentLocation.pitchLength / 2;
    const spots = [
      { x: -halfW * 0.45, y: 1.0, z: -halfL + 0.35 },
      { x: halfW * 0.45, y: 1.0, z: -halfL + 0.35 },
      { x: 0, y: 1.25, z: -halfL + 0.35 },
      { x: -halfW + 0.35, y: 0.85, z: -halfL * 0.35 },
    ];
    this.targetsActive = spots.map((s, idx) => {
      const m = this.arena!.targetMeshes[idx];
      m.position.set(s.x, s.y, s.z);
      m.rotation.y = idx === 3 ? Math.PI / 2 : 0;
      m.visible = true;
      return { ...s, alive: true, respawn: 0 };
    });
  }

  private resetBallCenter(): void {
    this.ballX = 0;
    this.ballY = 0.22;
    this.ballZ = 0;
    this.ballVx = 0;
    this.ballVy = 0;
    this.ballVz = 0;
    this.ownerId = null;
    this.pickupCooldown = 0.25;
    this.lastWallBounceAge = 99;

    this.players.forEach((p) => {
      p.x = p.homeX;
      p.z = p.homeZ;
      p.vx = 0;
      p.vz = 0;
      p.stunTimer = 0;
    });
  }

  public setPaused(p: boolean): void {
    this.paused = p;
  }

  public setVirtualAxis(x: number, z: number): void {
    this.virtualAxis.x = x;
    this.virtualAxis.z = z;
  }

  public triggerAction(action: 'shootStart' | 'shootEnd' | 'pass' | 'skill' | 'switch'): void {
    if (this.engineMode !== 'match' || this.paused) return;
    if (action === 'shootStart') {
      const ctrl = this.players.find((p) => p.id === this.controlledId);
      if (ctrl && this.ownerId === ctrl.id) {
        this.isChargingShot = true;
      } else {
        this.bufferedShootRelease = true;
      }
    } else if (action === 'shootEnd') {
      this.bufferedShootRelease = true;
      this.isChargingShot = false;
    } else if (action === 'pass') {
      this.bufferedPass = true;
    } else if (action === 'skill') {
      this.bufferedSkill = true;
    } else if (action === 'switch') {
      this.bufferedSwitch = true;
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (this.engineMode !== 'match' || this.paused) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
    this.heldKeys.add(code);

    if (code === 'Space' && !e.repeat) {
      const ctrl = this.players.find((p) => p.id === this.controlledId);
      if (ctrl && this.ownerId === ctrl.id) {
        this.isChargingShot = true;
      } else {
        this.bufferedShootRelease = true;
      }
    } else if ((code === 'KeyJ' || code === 'KeyX') && !e.repeat) {
      this.bufferedPass = true;
    } else if ((code === 'KeyE' || code === 'KeyC') && !e.repeat) {
      this.bufferedSkill = true;
    } else if ((code === 'KeyQ' || code === 'KeyF') && !e.repeat) {
      this.bufferedSwitch = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
    if (e.code === 'Space') {
      if (this.isChargingShot) {
        this.bufferedShootRelease = true;
      }
      this.isChargingShot = false;
    }
  };

  private handleWindowBlur = () => {
    this.heldKeys.clear();
    this.isChargingShot = false;
    this.shotCharge = 0;
    this.virtualAxis.x = 0;
    this.virtualAxis.z = 0;
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextTick();
  };

  private triggerCallout(key: CalloutEvent['key'], playerName?: string): void {
    this.calloutSeq++;
    this.pendingCallout = { id: this.calloutSeq, key, playerName };
  }

  private update(dt: number): void {
    if (this.engineMode === 'avatar') {
      if (this.previewRig) {
        this.previewRig.root.rotation.y += dt * 0.65;
        this.previewRig.bodyGroup.position.y = Math.sin(performance.now() * 0.003) * 0.03;
      }
      _v1.set(0, 1.85, 4.2);
      this.camera.position.lerp(_v1, 1 - Math.exp(-6 * dt));
      _v2.set(0, 1.05, 0);
      this.camera.lookAt(_v2);
      return;
    }

    if (this.paused) return;

    // Hitstop pause for heavy impacts (nutmegs, power shots, goals)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt * 0.25);
      return;
    }

    // Crowd cheer jump animation
    if (this.crowdCheerTimer > 0) {
      this.crowdCheerTimer -= dt;
    }
    this.updateCrowd(dt);
    this.updateParticles(dt);

    if (this.engineMode === 'match') {
      // Combo decay
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.styleCombo = 1;
      }

      if (this.goalResetTimer > 0) {
        this.goalResetTimer -= dt;
        if (this.goalResetTimer <= 0) {
          this.resetBallCenter();
        }
      } else {
        // Match countdown
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.finishMatch();
          return;
        }
      }
    }

    // Update players & ball physics
    if (this.goalResetTimer <= 0) {
      this.stepGameplay(dt);
    } else {
      this.stepBallPhysics(dt, false);
    }

    // Camera choreography
    this.updateCamera(dt);

    // Emit HUD state at ~20Hz
    if (this.engineMode === 'match') {
      this.hudThrottle += dt;
      if (this.hudThrottle >= 0.05) {
        this.hudThrottle = 0;
        this.emitHudSnapshot();
      }
    }
  }

  private stepGameplay(dt: number): void {
    const attrs = computePlayerAttributes(this.saveProgress.avatar.role, this.saveProgress.skills);
    const halfW = this.currentLocation.pitchWidth / 2;
    const halfL = this.currentLocation.pitchLength / 2;

    if (this.pickupCooldown > 0) this.pickupCooldown -= dt;
    this.lastWallBounceAge += dt;

    // Manual player switch
    if (this.bufferedSwitch && this.engineMode === 'match') {
      this.bufferedSwitch = false;
      this.switchToNearestHomePlayer();
    }

    // Shot charge accumulation
    const ctrlPlayer = this.players.find((p) => p.id === this.controlledId);
    if (this.isChargingShot && ctrlPlayer && this.ownerId === ctrlPlayer.id) {
      this.shotCharge = Math.min(1, this.shotCharge + dt * 1.45);
    } else if (!this.isChargingShot && !this.bufferedShootRelease) {
      this.shotCharge = Math.max(0, this.shotCharge - dt * 4);
    }

    // Update Arcade targets
    if (this.matchConfig?.mode === 'arcade' && this.matchConfig.arcadeGame === 'targets') {
      this.targetsActive.forEach((t, idx) => {
        if (!t.alive) {
          t.respawn -= dt;
          if (t.respawn <= 0) {
            t.alive = true;
            if (this.arena) this.arena.targetMeshes[idx].visible = true;
          }
        } else if (this.arena) {
          const tm = this.arena.targetMeshes[idx];
          tm.position.y = t.y + Math.sin(performance.now() * 0.004 + idx) * 0.16;
          // Check ball hit
          const dist = Math.hypot(this.ballX - tm.position.x, this.ballY - tm.position.y, this.ballZ - tm.position.z);
          if (dist < 0.85 && this.ownerId === null) {
            t.alive = false;
            t.respawn = 3.2;
            tm.visible = false;
            this.arcadeScore += 100 * this.styleCombo;
            this.styleCombo = Math.min(5, this.styleCombo + 1);
            this.comboTimer = 5;
            this.hitstopTimer = 0.04;
            this.shakeIntensity = 0.35;
            this.spawnBurst(tm.position.x, tm.position.y, tm.position.z, '#f59e0b', 14, 7);
            soundEngine.playNutmeg();
            this.triggerCallout('target');
          }
        }
      });
    }

    // Step each player
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[i];
      p.rig.selectionRing.visible = p.id === this.controlledId;

      if (p.skillTimer > 0) p.skillTimer -= dt;
      if (p.tackleTimer > 0) p.tackleTimer -= dt;
      if (p.stunTimer > 0) p.stunTimer -= dt;
      if (p.kickAnimTimer > 0) p.kickAnimTimer -= dt;

      let moveX = 0;
      let moveZ = 0;
      let sprinting = false;

      const isHuman = this.engineMode === 'match' && p.id === this.controlledId;

      if (p.stunTimer <= 0) {
        if (isHuman) {
          if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
          if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;
          if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveZ -= 1;
          if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveZ += 1;
          moveX += this.virtualAxis.x;
          moveZ += this.virtualAxis.z;
          sprinting = (this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight')) && p.stamina > 0.08;
        } else {
          // AI decision
          const ai = this.computeAiMove(p, halfW, halfL);
          moveX = ai.mx;
          moveZ = ai.mz;
          sprinting = ai.sprint && p.stamina > 0.2;
        }
      }

      const len = Math.hypot(moveX, moveZ);
      if (len > 0.01) {
        moveX /= Math.max(1, len);
        moveZ /= Math.max(1, len);
      }

      // Stamina & speed
      if (sprinting && len > 0.1) {
        p.stamina = Math.max(0, p.stamina - dt * 0.32);
      } else {
        p.stamina = Math.min(1, p.stamina + dt * 0.22);
      }

      const baseSpeed = p.team === 'home' && isHuman ? 6.4 * attrs.speedMult : p.isGoalie ? 5.2 : 5.7;
      const skillBurst = p.skillTimer > 0 ? 1.35 : 1;
      const sprintMult = sprinting ? 1.32 : 1;
      const carryPenalty = this.ownerId === p.id ? 0.93 : 1;
      const targetVx = moveX * baseSpeed * sprintMult * skillBurst * carryPenalty;
      const targetVz = moveZ * baseSpeed * sprintMult * skillBurst * carryPenalty;

      const accel = 1 - Math.exp(-12 * dt);
      p.vx += (targetVx - p.vx) * accel;
      p.vz += (targetVz - p.vz) * accel;

      p.x += p.vx * dt;
      p.z += p.vz * dt;

      // Keep inside cage walls
      p.x = THREE.MathUtils.clamp(p.x, -halfW + 0.55, halfW - 0.55);
      p.z = THREE.MathUtils.clamp(p.z, -halfL + 0.55, halfL - 0.55);

      const spd = Math.hypot(p.vx, p.vz);
      if (spd > 0.25) {
        const targetAngle = Math.atan2(p.vx, p.vz);
        let diff = targetAngle - p.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.facing += diff * (1 - Math.exp(-14 * dt));
      }

      // Human Actions
      if (isHuman && p.stunTimer <= 0) {
        if (this.ownerId === p.id) {
          // Skill Move / Nutmeg
          if (this.bufferedSkill) {
            this.bufferedSkill = false;
            this.performSkillMove(p, attrs.skillWindowMult);
          }
          // Pass
          if (this.bufferedPass) {
            this.bufferedPass = false;
            this.performPass(p, attrs.passSpeedMult);
          }
          // Shoot
          if (this.bufferedShootRelease) {
            this.bufferedShootRelease = false;
            this.performShot(p, Math.max(0.35, this.shotCharge), attrs.shotPowerMult);
            this.shotCharge = 0;
          }
        } else {
          // Off-ball tackle
          if (this.bufferedShootRelease) {
            this.bufferedShootRelease = false;
            this.performTackle(p, attrs.tackleReachMult);
          }
          this.bufferedPass = false;
          this.bufferedSkill = false;
        }
      }

      // Animate articulated limbs
      this.animatePlayerRig(p, spd, dt);
    }

    // Player-to-player soft separation
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i];
        const b = this.players[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.001 && d < 0.85) {
          const push = (0.85 - d) * 0.5;
          const nx = dx / d;
          const nz = dz / d;
          a.x -= nx * push;
          a.z -= nz * push;
          b.x += nx * push;
          b.z += nz * push;
        }
      }
    }

    // Ball carrying vs free ball physics
    this.stepBallPhysics(dt, true);
  }

  private computeAiMove(p: SimPlayer, halfW: number, halfL: number): { mx: number; mz: number; sprint: boolean } {
    const attackDir = p.team === 'home' ? -1 : 1; // Home attacks -Z, Away attacks +Z
    const goalZ = attackDir * halfL;
    const ownGoalZ = -attackDir * halfL;

    if (p.isGoalie) {
      const targetX = THREE.MathUtils.clamp(this.ballX * 0.55, -this.currentLocation.goalWidth * 0.42, this.currentLocation.goalWidth * 0.42);
      const targetZ = ownGoalZ - attackDir * 1.1;
      const dx = targetX - p.x;
      const dz = targetZ - p.z;
      const d = Math.hypot(dx, dz);
      if (this.ownerId === p.id) {
        // Keeper clears / passes forward
        this.performPass(p, 1.0);
      }
      return d > 0.2 ? { mx: dx / d, mz: dz / d, sprint: Math.abs(this.ballZ - ownGoalZ) < 6 } : { mx: 0, mz: 0, sprint: false };
    }

    if (this.ownerId === p.id) {
      // AI has the ball: dribble toward opponent goal, pass or shoot
      const distToGoal = Math.hypot(0 - p.x, goalZ - p.z);
      if (distToGoal < 8.8) {
        this.performShot(p, 0.55 + Math.random() * 0.35, 1.0);
        return { mx: 0, mz: attackDir, sprint: false };
      }
      // Check if pressured closely -> 35% chance to pass to open teammate
      const pressured = this.players.some((o) => o.team !== p.team && Math.hypot(o.x - p.x, o.z - p.z) < 2.2);
      if (pressured && Math.random() < 0.06) {
        this.performPass(p, 1.0);
      }
      const tx = Math.sin(performance.now() * 0.002 + p.homeX) * (halfW * 0.45);
      const dx = tx - p.x;
      const dz = goalZ - p.z;
      const d = Math.hypot(dx, dz) || 1;
      return { mx: dx / d, mz: dz / d, sprint: true };
    }

    // AI does not have ball
    const owner = this.players.find((o) => o.id === this.ownerId);
    const teamHasBall = owner && owner.team === p.team;

    if (teamHasBall) {
      // Support run into space
      const supportZ = THREE.MathUtils.clamp(owner!.z + attackDir * 4.5, -halfL + 2, halfL - 2);
      const supportX = p.homeX * 0.8;
      const dx = supportX - p.x;
      const dz = supportZ - p.z;
      const d = Math.hypot(dx, dz);
      return d > 0.5 ? { mx: dx / d, mz: dz / d, sprint: false } : { mx: 0, mz: 0, sprint: false };
    }

    // Defend / chase ball if closest on team
    const teammates = this.players.filter((t) => t.team === p.team && !t.isGoalie);
    let closest = teammates[0];
    let minD = Infinity;
    teammates.forEach((t) => {
      const dist = Math.hypot(this.ballX - t.x, this.ballZ - t.z);
      if (dist < minD) {
        minD = dist;
        closest = t;
      }
    });

    if (closest && closest.id === p.id) {
      const dx = this.ballX - p.x;
      const dz = this.ballZ - p.z;
      const d = Math.hypot(dx, dz) || 1;
      if (owner && d < 1.25 && Math.random() < 0.04) {
        this.performTackle(p, 1.0);
      }
      return { mx: dx / d, mz: dz / d, sprint: d > 3.5 };
    }

    // Hold zonal position
    const zoneZ = THREE.MathUtils.lerp(p.homeZ, this.ballZ, 0.35);
    const dx = p.homeX * 0.7 - p.x;
    const dz = zoneZ - p.z;
    const d = Math.hypot(dx, dz);
    return d > 0.6 ? { mx: dx / d, mz: dz / d, sprint: false } : { mx: 0, mz: 0, sprint: false };
  }

  private performSkillMove(p: SimPlayer, skillMult: number): void {
    if (p.stamina < 0.12) return;
    p.stamina = Math.max(0, p.stamina - 0.14);
    p.skillTimer = 0.38;
    soundEngine.playSkill();

    const dirX = Math.sin(p.facing);
    const dirZ = Math.cos(p.facing);
    p.vx += dirX * 5.2;
    p.vz += dirZ * 5.2;
    this.statsSkills++;

    // Nutmeg check: opponent within 2.6m in front cone
    const range = 2.65 * skillMult;
    for (const opp of this.players) {
      if (opp.team === p.team || opp.stunTimer > 0) continue;
      const dx = opp.x - p.x;
      const dz = opp.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < range) {
        const dot = (dx * dirX + dz * dirZ) / (dist || 1);
        if (dot > 0.35) {
          // Nutmeg landed!
          opp.stunTimer = 1.15;
          p.x = opp.x + dirX * 1.1;
          p.z = opp.z + dirZ * 1.1;
          this.statsNutmegs++;
          this.styleCombo = Math.min(5, this.styleCombo + 1);
          this.comboTimer = 6;
          this.arcadeScore += 75 * this.styleCombo;
          this.hitstopTimer = 0.045;
          this.shakeIntensity = 0.28;
          this.crowdCheerTimer = 1.6;
          this.spawnBurst(opp.x, 0.6, opp.z, '#fbbf24', 14, 6);
          soundEngine.playNutmeg();
          this.triggerCallout('nutmeg', p.name);
          return;
        }
      }
    }

    this.spawnBurst(p.x, 0.25, p.z, '#38bdf8', 6, 3.5);
    this.triggerCallout('skill', p.name);
  }

  private performPass(p: SimPlayer, passMult: number): void {
    const dirX = Math.sin(p.facing);
    const dirZ = Math.cos(p.facing);

    // Find best teammate in rough facing cone
    let bestMate: SimPlayer | null = null;
    let bestScore = -Infinity;
    for (const m of this.players) {
      if (m.team !== p.team || m.id === p.id) continue;
      const dx = m.x - p.x;
      const dz = m.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.5) continue;
      const dot = (dx * dirX + dz * dirZ) / dist;
      const score = dot * 2 - dist * 0.04;
      if (score > bestScore && dot > 0.1) {
        bestScore = score;
        bestMate = m;
      }
    }

    let vx = dirX;
    let vz = dirZ;
    let speed = 13.5 * passMult;

    if (bestMate) {
      const dx = bestMate.x - p.x;
      const dz = bestMate.z - p.z;
      const dist = Math.hypot(dx, dz) || 1;
      vx = dx / dist;
      vz = dz / dist;
      speed = THREE.MathUtils.clamp(9 + dist * 0.75, 10, 17) * passMult;
      p.facing = Math.atan2(vx, vz);
    }

    this.ownerId = null;
    this.pickupCooldown = 0.18;
    this.lastTouchTeam = p.team;
    this.ballVx = vx * speed;
    this.ballVz = vz * speed;
    this.ballVy = 0.6;
    p.kickAnimTimer = 0.22;
    soundEngine.playKick(0.42);
  }

  private performShot(p: SimPlayer, power: number, shotMult: number): void {
    const halfL = this.currentLocation.pitchLength / 2;
    const targetGoalZ = p.team === 'home' ? -halfL : halfL;

    // Blend player facing direction with aim toward goal
    const toGoalX = 0 - p.x + (Math.random() - 0.5) * 1.4;
    const toGoalZ = targetGoalZ - p.z;
    const gLen = Math.hypot(toGoalX, toGoalZ) || 1;

    const dirX = Math.sin(p.facing);
    const dirZ = Math.cos(p.facing);

    // If player is generally facing the opponent half, assist slightly toward goal corners
    const forwardDot = (dirX * toGoalX + dirZ * toGoalZ) / gLen;
    let shotX = dirX;
    let shotZ = dirZ;
    if (forwardDot > 0.25) {
      shotX = THREE.MathUtils.lerp(dirX, toGoalX / gLen, 0.55);
      shotZ = THREE.MathUtils.lerp(dirZ, toGoalZ / gLen, 0.55);
      const sLen = Math.hypot(shotX, shotZ) || 1;
      shotX /= sLen;
      shotZ /= sLen;
    }

    const speed = (15.5 + power * 11.5) * shotMult;
    this.ownerId = null;
    this.pickupCooldown = 0.22;
    this.lastTouchTeam = p.team;
    this.ballVx = shotX * speed;
    this.ballVz = shotZ * speed;
    this.ballVy = 1.6 + power * 3.4;
    p.kickAnimTimer = 0.28;
    p.facing = Math.atan2(shotX, shotZ);

    if (power > 0.65) {
      this.shakeIntensity = 0.22;
      this.spawnBurst(this.ballX, this.ballY, this.ballZ, '#f59e0b', 10, 5);
    }
    soundEngine.playKick(0.5 + power * 0.5);
  }

  private performTackle(p: SimPlayer, reachMult: number): void {
    if (p.tackleTimer > 0) return;
    p.tackleTimer = 0.55;
    const dirX = Math.sin(p.facing);
    const dirZ = Math.cos(p.facing);
    p.vx += dirX * 6.5;
    p.vz += dirZ * 6.5;

    const owner = this.players.find((o) => o.id === this.ownerId);
    if (owner && owner.team !== p.team) {
      const dist = Math.hypot(owner.x - p.x, owner.z - p.z);
      if (dist < 1.65 * reachMult) {
        this.ownerId = p.id;
        owner.stunTimer = 0.7;
        this.pickupCooldown = 0.2;
        this.statsTackles++;
        this.spawnBurst(owner.x, 0.4, owner.z, '#38bdf8', 8, 4.5);
        soundEngine.playKick(0.35);
      }
    }
  }

  private switchToNearestHomePlayer(): void {
    const homeOutfield = this.players.filter((p) => p.team === 'home' && !p.isGoalie);
    if (homeOutfield.length <= 1) return;
    let best: SimPlayer | null = null;
    let bestD = Infinity;
    for (const p of homeOutfield) {
      if (p.id === this.controlledId) continue;
      const d = Math.hypot(this.ballX - p.x, this.ballZ - p.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) this.controlledId = best.id;
  }

  private stepBallPhysics(dt: number, allowPickup: boolean): void {
    const halfW = this.currentLocation.pitchWidth / 2;
    const halfL = this.currentLocation.pitchLength / 2;
    const halfGoal = this.currentLocation.goalWidth / 2;
    const wallBounce = this.matchConfig ? this.matchConfig.wallBounce : true;

    const owner = this.players.find((p) => p.id === this.ownerId);
    if (owner) {
      const dribbleDist = 0.52 + Math.sin(performance.now() * 0.015) * 0.06;
      this.ballX = owner.x + Math.sin(owner.facing) * dribbleDist;
      this.ballZ = owner.z + Math.cos(owner.facing) * dribbleDist;
      this.ballY = 0.22;
      this.ballVx = owner.vx;
      this.ballVz = owner.vz;
      this.ballVy = 0;

      // Award wall-pass if teammate picked up ball right after a wall bounce!
      if (this.lastTouchTeam === owner.team && this.lastWallBounceAge < 2.2 && owner.team === 'home') {
        this.lastWallBounceAge = 99;
        this.statsWallPasses++;
        this.styleCombo = Math.min(5, this.styleCombo + 1);
        this.comboTimer = 6;
        this.arcadeScore += 60 * this.styleCombo;
        this.triggerCallout('wallpass', owner.name);
      }
      this.lastTouchTeam = owner.team;
    } else {
      // Free ball physics
      this.ballVy -= 18 * dt;
      this.ballX += this.ballVx * dt;
      this.ballY += this.ballVy * dt;
      this.ballZ += this.ballVz * dt;

      // Ground bounce
      if (this.ballY < 0.22) {
        this.ballY = 0.22;
        if (Math.abs(this.ballVy) > 1.5) {
          this.ballVy = -this.ballVy * 0.56;
        } else {
          this.ballVy = 0;
        }
        const drag = Math.exp(-1.75 * dt);
        this.ballVx *= drag;
        this.ballVz *= drag;
      } else {
        const airDrag = Math.exp(-0.35 * dt);
        this.ballVx *= airDrag;
        this.ballVz *= airDrag;
      }

      // Check Goal Scoring (Z beyond +/- halfL inside goalWidth and below crossbar y < 1.65)
      if (this.goalResetTimer <= 0 && Math.abs(this.ballX) < halfGoal - 0.12 && this.ballY < 1.65) {
        if (this.ballZ < -halfL - 0.1) {
          // Home scored!
          this.handleGoal('home');
          return;
        } else if (this.ballZ > halfL + 0.1) {
          // Away scored!
          this.handleGoal('away');
          return;
        }
      }

      // Side Wall Collisions
      const rest = wallBounce ? this.currentLocation.restitution : 0.45;
      if (this.ballX < -halfW + 0.22) {
        this.ballX = -halfW + 0.22;
        this.ballVx = Math.abs(this.ballVx) * rest;
        this.onBallWallHit(-halfW, this.ballY, this.ballZ);
      } else if (this.ballX > halfW - 0.22) {
        this.ballX = halfW - 0.22;
        this.ballVx = -Math.abs(this.ballVx) * rest;
        this.onBallWallHit(halfW, this.ballY, this.ballZ);
      }

      // End Wall Collisions (outside goal mouth)
      if (Math.abs(this.ballX) >= halfGoal - 0.12 || this.ballY >= 1.65) {
        if (this.ballZ < -halfL + 0.22) {
          this.ballZ = -halfL + 0.22;
          this.ballVz = Math.abs(this.ballVz) * rest;
          this.onBallWallHit(this.ballX, this.ballY, -halfL);
        } else if (this.ballZ > halfL - 0.22) {
          this.ballZ = halfL - 0.22;
          this.ballVz = -Math.abs(this.ballVz) * rest;
          this.onBallWallHit(this.ballX, this.ballY, halfL);
        }
      }

      // Ball pickup by nearest eligible player
      if (allowPickup && this.pickupCooldown <= 0 && this.ballY < 1.15) {
        for (const p of this.players) {
          if (p.stunTimer > 0) continue;
          const dist = Math.hypot(this.ballX - p.x, this.ballZ - p.z);
          const pickupRad = p.isGoalie ? 0.92 : 0.68;
          if (dist < pickupRad) {
            if (p.isGoalie && Math.hypot(this.ballVx, this.ballVz) > 10) {
              // Goalkeeper save!
              soundEngine.playKick(0.6);
              this.triggerCallout('save', p.name);
              this.spawnBurst(this.ballX, 0.7, this.ballZ, '#10b981', 10, 5);
            }
            this.ownerId = p.id;
            if (this.engineMode === 'match' && p.team === 'home' && !p.isGoalie) {
              this.controlledId = p.id;
            }
            break;
          }
        }
      }
    }

    // Update Ball 3D Mesh & Spin
    this.ballRig.root.position.set(this.ballX, 0, this.ballZ);
    this.ballRig.mesh.position.y = this.ballY;
    const bSpd = Math.hypot(this.ballVx, this.ballVz);
    if (bSpd > 0.2) {
      this.ballRig.mesh.rotation.x += (this.ballVz * dt) / 0.22;
      this.ballRig.mesh.rotation.z -= (this.ballVx * dt) / 0.22;
    }
    const shadowScale = Math.max(0.5, 1 - (this.ballY - 0.22) * 0.25);
    this.ballRig.shadow.scale.setScalar(shadowScale);

    // Charge Halo visual
    const haloMat = this.ballRig.chargeHalo.material as THREE.MeshBasicMaterial;
    haloMat.opacity = this.shotCharge > 0.05 ? 0.4 + this.shotCharge * 0.55 : 0;
    this.ballRig.chargeHalo.scale.setScalar(1 + this.shotCharge * 0.75);
  }

  private onBallWallHit(x: number, y: number, z: number): void {
    const spd = Math.hypot(this.ballVx, this.ballVz);
    if (spd > 3.5) {
      this.lastWallBounceAge = 0;
      soundEngine.playWallBounce(spd);
      this.spawnBurst(x, Math.max(0.3, y), z, this.currentLocation.pitchAccent, 6, 3.5);
    }
  }

  private handleGoal(scoringTeam: 'home' | 'away'): void {
    this.goalResetTimer = 1.9;
    this.hitstopTimer = 0.055;
    this.shakeIntensity = 0.55;
    this.crowdCheerTimer = 2.6;
    soundEngine.playGoal(scoringTeam === 'home');

    const burstCol = scoringTeam === 'home' ? '#fbbf24' : '#38bdf8';
    this.spawnBurst(this.ballX, 0.9, this.ballZ, burstCol, 28, 9);

    if (this.engineMode === 'title') {
      return;
    }

    if (scoringTeam === 'home') {
      this.homeScore++;
      this.statsGoals++;
      if (this.matchConfig?.mode === 'arcade' && this.matchConfig.arcadeGame === 'wallvolley') {
        const bonus = this.lastWallBounceAge < 3.5 ? 2 : 1;
        this.arcadeScore += 150 * bonus * this.styleCombo;
        this.triggerCallout(bonus > 1 ? 'wallpass' : 'goal');
      } else if (this.matchConfig?.mode === 'arcade' && this.matchConfig.arcadeGame === 'king') {
        this.arcadeScore += 100 * this.styleCombo;
        this.styleCombo = Math.min(5, this.styleCombo + 1);
        this.comboTimer = 10;
        this.triggerCallout('king');
      } else {
        this.triggerCallout('goal');
      }
    } else {
      this.awayScore++;
      this.styleCombo = 1;
      this.triggerCallout('conceded');
    }

    this.emitHudSnapshot();
  }

  private animatePlayerRig(p: SimPlayer, speed: number, dt: number): void {
    p.rig.root.position.set(p.x, 0, p.z);
    p.rig.root.rotation.y = p.facing;

    if (speed > 0.3) {
      p.stridePhase += speed * dt * 2.2;
      const swing = Math.sin(p.stridePhase) * 0.65;
      p.rig.leftLeg.rotation.x = swing;
      p.rig.rightLeg.rotation.x = -swing;
      p.rig.leftArm.rotation.x = -swing * 0.7;
      p.rig.rightArm.rotation.x = swing * 0.7;
      p.rig.bodyGroup.position.y = Math.abs(Math.cos(p.stridePhase)) * 0.06;
    } else {
      const damp = 1 - Math.exp(-10 * dt);
      p.rig.leftLeg.rotation.x *= 1 - damp;
      p.rig.rightLeg.rotation.x *= 1 - damp;
      p.rig.leftArm.rotation.x *= 1 - damp;
      p.rig.rightArm.rotation.x *= 1 - damp;
      p.rig.bodyGroup.position.y *= 1 - damp;
    }

    if (p.kickAnimTimer > 0) {
      p.rig.rightLeg.rotation.x = -0.95 * (p.kickAnimTimer / 0.28);
    }

    if (p.skillTimer > 0) {
      p.rig.bodyGroup.rotation.y = (p.skillTimer / 0.38) * Math.PI * 2;
    } else {
      p.rig.bodyGroup.rotation.y = 0;
    }

    if (p.stunTimer > 0) {
      p.rig.bodyGroup.rotation.z = Math.sin(performance.now() * 0.03) * 0.18;
    } else {
      p.rig.bodyGroup.rotation.z = 0;
    }
  }

  private updateCrowd(dt: number): void {
    if (!this.arena?.crowdHeads) return;
    const isCheering = this.crowdCheerTimer > 0;
    const now = performance.now() * 0.008;
    const count = this.arena.crowdBaseMatrices.length;

    for (let i = 0; i < count; i++) {
      this.arena.crowdBaseMatrices[i].decompose(_pos, _quat, _scale);
      const jump = isCheering ? Math.abs(Math.sin(now * 1.8 + i)) * 0.42 : Math.sin(now * 0.35 + i) * 0.04;
      _pos.y += jump;
      _mat.compose(_pos, _quat, _scale);
      this.arena.crowdHeads.setMatrixAt(i, _mat);
    }
    this.arena.crowdHeads.instanceMatrix.needsUpdate = true;
    void dt;
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 14 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
        p.mesh.position.z += p.vz * dt;
        const t = Math.max(0, p.life / p.maxLife);
        p.mesh.scale.setScalar(t);
        if (p.life <= 0) p.mesh.visible = false;
      }
    }
  }

  private updateCamera(dt: number): void {
    if (this.engineMode === 'title') {
      this.titleCamAngle += dt * 0.16;
      const rad = 20.5;
      _v1.set(Math.sin(this.titleCamAngle) * rad, 10.5, Math.cos(this.titleCamAngle) * rad);
      this.camera.position.lerp(_v1, 1 - Math.exp(-3 * dt));
      _v2.set(this.ballX * 0.25, 0.8, this.ballZ * 0.25);
      this.camera.lookAt(_v2);
      return;
    }

    // Dynamic third-person broadcast street camera following ball + player
    const ctrl = this.players.find((p) => p.id === this.controlledId);
    const focusX = ctrl ? THREE.MathUtils.lerp(this.ballX, ctrl.x, 0.35) : this.ballX;
    const focusZ = ctrl ? THREE.MathUtils.lerp(this.ballZ, ctrl.z, 0.35) : this.ballZ;

    _v1.set(focusX * 0.65, 12.2, focusZ * 0.65 + 14.5);

    if (this.shakeIntensity > 0.01) {
      _v1.x += (Math.random() - 0.5) * this.shakeIntensity;
      _v1.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.exp(-9 * dt);
    } else {
      this.shakeIntensity = 0;
    }

    this.camera.position.lerp(_v1, 1 - Math.exp(-6.5 * dt));
    _v2.set(focusX * 0.72, 0.5, focusZ * 0.72 - 1.2);
    this.camera.lookAt(_v2);
  }

  private emitHudSnapshot(): void {
    const ctrl = this.players.find((p) => p.id === this.controlledId);
    const callout = this.pendingCallout;
    this.pendingCallout = null;

    this.callbacks.onSnapshot({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      timeRemaining: Math.ceil(this.timeRemaining),
      stamina: ctrl ? ctrl.stamina : 1,
      shotCharge: this.shotCharge,
      styleCombo: this.styleCombo,
      arcadeScore: this.arcadeScore,
      hasBall: Boolean(ctrl && this.ownerId === ctrl.id),
      isControllingOnBall: Boolean(ctrl && this.ownerId === ctrl.id),
      callout,
      activePlayerName: ctrl ? ctrl.name : this.saveProgress.avatar.name,
    });
  }

  private finishMatch(): void {
    soundEngine.playWhistle(true);
    const isArcade = this.matchConfig?.mode === 'arcade';
    const won = isArcade ? this.arcadeScore > 0 : this.homeScore > this.awayScore;
    const repEarned = isArcade
      ? Math.max(40, Math.round(this.arcadeScore * 0.25))
      : (won ? 140 : this.homeScore === this.awayScore ? 85 : 55) +
        this.statsGoals * 25 +
        this.statsNutmegs * 35 +
        this.statsWallPasses * 20;

    this.engineMode = 'title';
    this.callbacks.onMatchEnd({
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      goals: this.statsGoals,
      nutmegs: this.statsNutmegs,
      wallPasses: this.statsWallPasses,
      skillsLanded: this.statsSkills,
      tackles: this.statsTackles,
      arcadeScore: this.arcadeScore,
      repEarned,
      won,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    this.clearPlayers();
    if (this.arena) this.arena.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
