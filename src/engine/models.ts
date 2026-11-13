import * as THREE from 'three';
import { LocationDef } from '../data/locations';
import { AvatarConfig } from '../types/game';
import {
  createBoardGraffitiTexture,
  createChainLinkTexture,
  createContactShadowTexture,
  createFootballTexture,
  createPitchTexture,
  createTargetTexture,
} from './textures';

export interface PlayerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  selectionRing: THREE.Mesh;
  staminaArc?: THREE.Mesh;
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
function getShadowTex(): THREE.CanvasTexture {
  if (!sharedShadowTex) sharedShadowTex = createContactShadowTexture();
  return sharedShadowTex;
}

/**
 * Builds an articulated 10-part composite street footballer grounded at y = 0.
 */
export function createStreetPlayerModel(
  avatar: Pick<AvatarConfig, 'skinTone' | 'hairStyle' | 'hairColor' | 'topStyle' | 'topColor' | 'accentColor' | 'shortsColor' | 'sneakerColor' | 'hasTattoo'>,
  teamOverrideColor?: string,
  isGoalie = false
): PlayerRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const kitColor = isGoalie ? '#10b981' : teamOverrideColor || avatar.topColor;
  const accentCol = avatar.accentColor || '#f8fafc';

  const matKit = new THREE.MeshStandardMaterial({ color: kitColor, roughness: 0.72, metalness: 0.05 });
  const matAccent = new THREE.MeshStandardMaterial({ color: accentCol, roughness: 0.4, metalness: 0.25 });
  const matShorts = new THREE.MeshStandardMaterial({ color: avatar.shortsColor, roughness: 0.78, metalness: 0.04 });
  const matSkin = new THREE.MeshStandardMaterial({ color: avatar.skinTone, roughness: 0.62, metalness: 0.02 });
  const matHair = new THREE.MeshStandardMaterial({ color: avatar.hairColor, roughness: 0.85, metalness: 0.05 });
  const matSneaker = new THREE.MeshStandardMaterial({ color: avatar.sneakerColor, roughness: 0.35, metalness: 0.18 });
  const matSole = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9, metalness: 0.05 });
  const matTattoo = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.55, metalness: 0.1 });

  // Contact shadow disc grounded just above pitch
  const shadowGeo = new THREE.PlaneGeometry(1.15, 1.15);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getShadowTex(),
    transparent: true,
    depthWrite: false,
    opacity: 0.52,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  root.add(shadowDisc);

  // Active player selection ring
  const ringGeo = new THREE.RingGeometry(0.46, 0.58, 28);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const selectionRing = new THREE.Mesh(ringGeo, ringMat);
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = 0.024;
  selectionRing.visible = false;
  root.add(selectionRing);

  // 1. Torso (jacket / hoodie / jersey)
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.28), matKit);
  torsoMesh.position.y = 1.05;
  torsoMesh.castShadow = true;
  bodyGroup.add(torsoMesh);

  // 2. Chest stripe / streetwear trim
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.515, 0.11, 0.295), matAccent);
  stripe.position.y = 1.12;
  bodyGroup.add(stripe);

  // Hoodie hood or collar
  if (avatar.topStyle === 'hoodie') {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.22), matKit);
    hood.position.set(0, 1.32, -0.1);
    hood.rotation.x = -0.3;
    bodyGroup.add(hood);
  } else if (avatar.topStyle === 'jacket') {
    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, 0.295), matAccent);
    zip.position.y = 1.05;
    bodyGroup.add(zip);
  }

  // 3. Pelvis / Shorts waist
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.27), matShorts);
  pelvis.position.y = 0.68;
  pelvis.castShadow = true;
  bodyGroup.add(pelvis);

  // 4-5. Articulated Legs (pivot at hip y = 0.68)
  const buildLeg = (xOffset: number): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.68, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 0.3, 10), matShorts);
    thigh.position.y = -0.15;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.06, 0.28, 10), matSkin);
    shin.position.y = -0.42;
    shin.castShadow = true;
    legPivot.add(shin);

    // Streetwear sneaker + sole
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), matSneaker);
    shoe.position.set(0, -0.61, 0.05);
    shoe.castShadow = true;
    legPivot.add(shoe);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.29), matSole);
    sole.position.set(0, -0.665, 0.05);
    legPivot.add(sole);

    return legPivot;
  };

  const leftLeg = buildLeg(-0.14);
  const rightLeg = buildLeg(0.14);
  bodyGroup.add(leftLeg, rightLeg);

  // 6-7. Articulated Arms (pivot at shoulder y = 1.28)
  const buildArm = (xOffset: number, isLeft: boolean): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 1.28, 0);

    const sleeveLen = avatar.topStyle === 'jersey' ? 0.2 : 0.44;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, sleeveLen, 10), matKit);
    sleeve.position.y = -sleeveLen / 2;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    if (avatar.topStyle === 'jersey') {
      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.26, 10),
        isLeft && avatar.hasTattoo ? matTattoo : matSkin
      );
      forearm.position.y = -0.32;
      forearm.castShadow = true;
      armPivot.add(forearm);
    }

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), isGoalie ? matAccent : matSkin);
    hand.position.y = -0.47;
    armPivot.add(hand);

    return armPivot;
  };

  const leftArm = buildArm(-0.32, true);
  const rightArm = buildArm(0.32, false);
  bodyGroup.add(leftArm, rightArm);

  // 8-10. Head + Hairstyle / Cap
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.5, 0);
  bodyGroup.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 14), matSkin);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  if (avatar.hairStyle === 'fade') {
    const topHair = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.24), matHair);
    topHair.position.set(0, 0.13, -0.01);
    headGroup.add(topHair);
  } else if (avatar.hairStyle === 'afro') {
    const afro = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), matHair);
    afro.position.set(0, 0.09, -0.02);
    headGroup.add(afro);
  } else if (avatar.hairStyle === 'braids') {
    for (let i = -2; i <= 2; i++) {
      const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.28, 6), matHair);
      braid.position.set(i * 0.055, 0.04, -0.14);
      braid.rotation.x = 0.25;
      headGroup.add(braid);
    }
  } else if (avatar.hairStyle === 'buzz') {
    const buzz = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matHair);
    buzz.position.y = 0.01;
    headGroup.add(buzz);
  } else if (avatar.hairStyle === 'cap') {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matAccent);
    crown.position.y = 0.03;
    headGroup.add(crown);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.18), matAccent);
    brim.position.set(0, 0.05, 0.15);
    headGroup.add(brim);
  }

  return { root, bodyGroup, leftLeg, rightLeg, leftArm, rightArm, headGroup, selectionRing };
}

export interface BallRig {
  root: THREE.Group;
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  chargeHalo: THREE.Mesh;
}

export function createBallModel(maxAniso: number): BallRig {
  const root = new THREE.Group();
  const ballTex = createFootballTexture(maxAniso);
  const mat = new THREE.MeshStandardMaterial({
    map: ballTex,
    roughness: 0.38,
    metalness: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 18), mat);
  mesh.castShadow = true;
  root.add(mesh);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.68),
    new THREE.MeshBasicMaterial({
      map: getShadowTex(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.016;
  root.add(shadow);

  const chargeHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.26, 0.36, 24),
    new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  chargeHalo.rotation.x = -Math.PI / 2;
  chargeHalo.position.y = 0.025;
  root.add(chargeHalo);

  return { root, mesh, shadow, chargeHalo };
}

export interface ArenaHandles {
  group: THREE.Group;
  crowdHeads: THREE.InstancedMesh | null;
  crowdBaseMatrices: THREE.Matrix4[];
  targetMeshes: THREE.Mesh[];
  reboundWalls: THREE.Mesh[];
  dispose: () => void;
}

export function createEnvironmentArena(loc: LocationDef, maxAniso: number): ArenaHandles {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const W = loc.pitchWidth;
  const L = loc.pitchLength;
  const halfW = W / 2;
  const halfL = L / 2;

  // Extended surrounding ground terrain (prevents floating box in empty void)
  const surroundGeo = track(new THREE.PlaneGeometry(240, 240));
  const surroundColor =
    loc.surfaceType === 'desert'
      ? '#b37a43'
      : loc.surfaceType === 'forest'
      ? '#1d3c27'
      : loc.surfaceType === 'coastal'
      ? '#0f3f6b'
      : '#13161f';
  const surroundMat = track(
    new THREE.MeshStandardMaterial({
      color: surroundColor,
      roughness: loc.surfaceType === 'coastal' ? 0.18 : 0.92,
      metalness: loc.surfaceType === 'coastal' ? 0.35 : 0.02,
    })
  );
  const surroundGround = new THREE.Mesh(surroundGeo, surroundMat);
  surroundGround.rotation.x = -Math.PI / 2;
  surroundGround.position.y = -0.02;
  surroundGround.receiveShadow = true;
  group.add(surroundGround);

  // Playable pitch plane
  const pitchTex = track(createPitchTexture(loc, maxAniso));
  const pitchGeo = track(new THREE.PlaneGeometry(W, L));
  const pitchMat = track(
    new THREE.MeshStandardMaterial({
      map: pitchTex,
      roughness: loc.surfaceType === 'neon' ? 0.32 : 0.8,
      metalness: loc.surfaceType === 'neon' ? 0.2 : 0.05,
    })
  );
  const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
  pitchMesh.rotation.x = -Math.PI / 2;
  pitchMesh.receiveShadow = true;
  group.add(pitchMesh);

  // Rebound boards around perimeter (with goal openings at z = -halfL and +halfL)
  const reboundWalls: THREE.Mesh[] = [];
  const boardTex = track(createBoardGraffitiTexture(loc.pitchAccent, loc.wallColor, maxAniso));
  const boardMat = track(
    new THREE.MeshStandardMaterial({
      map: boardTex,
      roughness: 0.6,
      metalness: 0.15,
    })
  );
  const boardH = 0.85;
  const boardThick = 0.18;

  const addBoard = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const geo = track(new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geo, boardMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    reboundWalls.push(mesh);
  };

  // Left & Right full-length rebound boards
  addBoard(boardThick, boardH, L + 0.4, -halfW - boardThick / 2, boardH / 2, 0);
  addBoard(boardThick, boardH, L + 0.4, halfW + boardThick / 2, boardH / 2, 0);

  // End-line boards beside goals
  const wingW = (W - loc.goalWidth) / 2;
  if (wingW > 0.2) {
    addBoard(wingW, boardH, boardThick, -halfW + wingW / 2, boardH / 2, -halfL - boardThick / 2);
    addBoard(wingW, boardH, boardThick, halfW - wingW / 2, boardH / 2, -halfL - boardThick / 2);
    addBoard(wingW, boardH, boardThick, -halfW + wingW / 2, boardH / 2, halfL + boardThick / 2);
    addBoard(wingW, boardH, boardThick, halfW - wingW / 2, boardH / 2, halfL + boardThick / 2);
  }

  // Chain-link cage upper fencing & steel posts
  const fenceH = loc.wallHeight - boardH;
  if (fenceH > 0.2) {
    const fenceTex = track(createChainLinkTexture(maxAniso));
    const fenceMat = track(
      new THREE.MeshStandardMaterial({
        map: fenceTex,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.75,
        depthWrite: false,
      })
    );

    const addFence = (w: number, x: number, z: number, rotY: number) => {
      const geo = track(new THREE.PlaneGeometry(w, fenceH));
      const mesh = new THREE.Mesh(geo, fenceMat);
      mesh.position.set(x, boardH + fenceH / 2, z);
      mesh.rotation.y = rotY;
      group.add(mesh);
    };

    addFence(L, -halfW - 0.05, 0, Math.PI / 2);
    addFence(L, halfW + 0.05, 0, Math.PI / 2);
    addFence(W, 0, -halfL - 0.05, 0);
    addFence(W, 0, halfL + 0.05, 0);

    // Steel perimeter posts (instanced)
    const postGeo = track(new THREE.CylinderGeometry(0.06, 0.07, loc.wallHeight, 8));
    const postMat = track(new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.85 }));
    const postCoords: Array<[number, number]> = [];
    for (let z = -halfL; z <= halfL + 0.01; z += L / 6) {
      postCoords.push([-halfW - 0.1, z], [halfW + 0.1, z]);
    }
    for (let x = -halfW + W / 4; x < halfW - 0.1; x += W / 4) {
      postCoords.push([x, -halfL - 0.1], [x, halfL + 0.1]);
    }
    const posts = new THREE.InstancedMesh(postGeo, postMat, postCoords.length);
    const dummy = new THREE.Object3D();
    postCoords.forEach(([px, pz], idx) => {
      dummy.position.set(px, loc.wallHeight / 2, pz);
      dummy.updateMatrix();
      posts.setMatrixAt(idx, dummy.matrix);
    });
    posts.instanceMatrix.needsUpdate = true;
    posts.computeBoundingSphere();
    group.add(posts);
  }

  // Build Goals (Composite 5-part goal frame + net at -halfL and +halfL)
  const buildGoal = (zSign: number, frameColor: string) => {
    const goalGroup = new THREE.Group();
    const gw = loc.goalWidth;
    const gh = 1.65;
    const gd = 1.15;
    const frameMat = track(new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.3, metalness: 0.7 }));
    const netMat = track(
      new THREE.MeshBasicMaterial({
        color: '#e2e8f0',
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      })
    );

    const postGeo = track(new THREE.CylinderGeometry(0.055, 0.055, gh, 10));
    const leftPost = new THREE.Mesh(postGeo, frameMat);
    leftPost.position.set(-gw / 2, gh / 2, 0);
    leftPost.castShadow = true;

    const rightPost = new THREE.Mesh(postGeo, frameMat);
    rightPost.position.set(gw / 2, gh / 2, 0);
    rightPost.castShadow = true;

    const barGeo = track(new THREE.CylinderGeometry(0.055, 0.055, gw + 0.1, 10));
    const crossbar = new THREE.Mesh(barGeo, frameMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, gh, 0);
    crossbar.castShadow = true;

    const netGeo = track(new THREE.BoxGeometry(gw, gh, gd, 6, 4, 3));
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, gh / 2, (zSign * gd) / 2);

    goalGroup.add(leftPost, rightPost, crossbar, net);
    goalGroup.position.set(0, 0, zSign * halfL);
    group.add(goalGroup);
  };

  buildGoal(-1, '#fbbf24'); // Away goal (North, -Z, where player attacks)
  buildGoal(1, '#38bdf8'); // Home goal (South, +Z)

  // Floodlight Towers at corners (composite 4-part)
  const poleMat = track(new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.8 }));
  const lampMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: loc.keyLightColor,
      emissiveIntensity: loc.isNight ? 2.2 : 0.4,
      roughness: 0.2,
    })
  );
  const corners: Array<[number, number]> = [
    [-halfW - 1.4, -halfL - 1.4],
    [halfW + 1.4, -halfL - 1.4],
    [-halfW - 1.4, halfL + 1.4],
    [halfW + 1.4, halfL + 1.4],
  ];
  corners.forEach(([cx, cz]) => {
    const tower = new THREE.Group();
    const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.15, 7.5, 8)), poleMat);
    pole.position.y = 3.75;
    const head = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.45, 0.35)), poleMat);
    head.position.y = 7.5;
    head.lookAt(0, 0, 0);
    const bulb = new THREE.Mesh(track(new THREE.BoxGeometry(0.9, 0.3, 0.1)), lampMat);
    bulb.position.set(0, 7.45, 0.15);
    tower.add(pole, head, bulb);
    tower.position.set(cx, 0, cz);
    tower.lookAt(0, 0, 0);
    group.add(tower);
  });

  // Location-specific 3D environment landmarks (outside the cage)
  addLocationScenery(group, loc, halfW, halfL, track);

  // Reactive crowd spectators leaning against the fence (InstancedMesh)
  let crowdHeads: THREE.InstancedMesh | null = null;
  const crowdBaseMatrices: THREE.Matrix4[] = [];
  const spectatorCount = 34;
  const specGeo = track(new THREE.CapsuleGeometry(0.22, 0.72, 4, 8));
  const specMat = track(new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 }));
  crowdHeads = new THREE.InstancedMesh(specGeo, specMat, spectatorCount);
  const dummy = new THREE.Object3D();
  const crowdPalette = ['#f59e0b', '#ef4444', '#38bdf8', '#f8fafc', '#10b981', '#e879f9'];

  for (let i = 0; i < spectatorCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = Math.floor(i / 2) / (spectatorCount / 2);
    const zPos = -halfL * 0.85 + t * L * 0.85;
    const xPos = side * (halfW + 0.85 + (i % 3) * 0.35);
    const scaleY = 0.88 + (i % 5) * 0.06;
    dummy.position.set(xPos, 0.62 * scaleY, zPos);
    dummy.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
    dummy.scale.set(1, scaleY, 1);
    dummy.updateMatrix();
    crowdHeads.setMatrixAt(i, dummy.matrix);
    crowdHeads.setColorAt(i, new THREE.Color(crowdPalette[i % crowdPalette.length]));
    crowdBaseMatrices.push(dummy.matrix.clone());
  }
  crowdHeads.instanceMatrix.needsUpdate = true;
  if (crowdHeads.instanceColor) crowdHeads.instanceColor.needsUpdate = true;
  crowdHeads.computeBoundingSphere();
  group.add(crowdHeads);

  // Arcade target meshes (hidden by default, shown in Target Shooting mode)
  const targetMeshes: THREE.Mesh[] = [];
  const targetTex = track(createTargetTexture(maxAniso));
  const targetGeo = track(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 20));
  targetGeo.rotateX(Math.PI / 2);
  const targetMat = track(
    new THREE.MeshStandardMaterial({
      map: targetTex,
      emissive: '#f59e0b',
      emissiveIntensity: 0.45,
      roughness: 0.3,
    })
  );
  for (let i = 0; i < 4; i++) {
    const tMesh = new THREE.Mesh(targetGeo, targetMat);
    tMesh.visible = false;
    group.add(tMesh);
    targetMeshes.push(tMesh);
  }

  return {
    group,
    crowdHeads,
    crowdBaseMatrices,
    targetMeshes,
    reboundWalls,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}

function addLocationScenery(
  group: THREE.Group,
  loc: LocationDef,
  halfW: number,
  halfL: number,
  track: <T extends { dispose: () => void }>(item: T) => T
) {
  const type = loc.surfaceType;

  if (type === 'concrete' || type === 'alley' || type === 'neon' || type === 'rooftop' || type === 'favela') {
    // Multi-part urban apartment blocks / favela houses / neon buildings
    const count = 20;
    const bGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const bMat = track(new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 }));
    const buildings = new THREE.InstancedMesh(bGeo, bMat, count);
    const dummy = new THREE.Object3D();

    const palette =
      type === 'favela'
        ? ['#ef4444', '#eab308', '#3b82f6', '#10b981', '#f97316']
        : type === 'alley'
        ? ['#e7e5e4', '#d6d3d1', '#fcd34d', '#cbd5e1']
        : type === 'neon'
        ? ['#0f172a', '#1e293b', '#164e63', '#31102f']
        : ['#1e293b', '#334155', '#27272a'];

    for (let i = 0; i < count; i++) {
      const side = i < 10 ? -1 : 1;
      const idx = i % 10;
      const bw = 4 + (i % 3) * 1.5;
      const bh = type === 'rooftop' ? 4 + (i % 4) * 2.5 : 7 + (i % 5) * 3;
      const bd = 4.5 + (i % 2) * 1.5;
      const x = side * (halfW + 6.5 + (i % 2) * 3.5);
      const z = -halfL - 4 + idx * ((halfL * 2 + 8) / 9);
      const y = type === 'rooftop' ? -2 : bh / 2;

      dummy.position.set(x, y, z);
      dummy.scale.set(bw, bh, bd);
      dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix);
      buildings.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    }
    buildings.instanceMatrix.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
    buildings.computeBoundingSphere();
    group.add(buildings);

    // Neon lantern strips for Tokyo or Tunisian arched medina doors for Ettadhamen
    if (type === 'neon') {
      const neonMat = track(
        new THREE.MeshStandardMaterial({
          color: '#06b6d4',
          emissive: '#06b6d4',
          emissiveIntensity: 2.5,
        })
      );
      const pinkMat = track(
        new THREE.MeshStandardMaterial({
          color: '#f43f5e',
          emissive: '#f43f5e',
          emissiveIntensity: 2.5,
        })
      );
      for (let i = 0; i < 8; i++) {
        const sign = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.3, 1.8, 0.8)),
          i % 2 === 0 ? neonMat : pinkMat
        );
        sign.position.set((i % 2 === 0 ? -1 : 1) * (halfW + 3.4), 3.6 + (i % 3), -halfL + i * 3.2);
        group.add(sign);
      }
    }
  } else if (type === 'forest') {
    // Ain Draham Cork-Oak Trees (instanced trunks + canopies)
    const treeCount = 32;
    const trunkGeo = track(new THREE.CylinderGeometry(0.22, 0.34, 3.2, 7));
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 }));
    const crownGeo = track(new THREE.ConeGeometry(1.9, 4.5, 8));
    const crownMat = track(new THREE.MeshStandardMaterial({ color: '#1e4620', roughness: 0.85 }));

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const ang = (i / treeCount) * Math.PI * 2;
      const rad = Math.max(halfW, halfL) + 4.5 + (i % 4) * 3.5;
      const tx = Math.cos(ang) * rad * 0.85;
      const tz = Math.sin(ang) * rad * 1.15;
      const sc = 0.85 + (i % 5) * 0.15;

      dummy.position.set(tx, 1.6 * sc, tz);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tx, 4.5 * sc, tz);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
      crowns.setColorAt(i, new THREE.Color(i % 2 === 0 ? '#1b4332' : '#2d6a4f'));
    }
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crowns.computeBoundingSphere();
    group.add(trunks, crowns);
  } else if (type === 'desert') {
    // Tataouine Desert Dunes & Berber Ksar Earthen Arches
    const duneGeo = track(new THREE.SphereGeometry(12, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5));
    const duneMat = track(new THREE.MeshStandardMaterial({ color: '#c88d55', roughness: 0.95 }));
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const dune = new THREE.Mesh(duneGeo, duneMat);
      dune.position.set(Math.cos(ang) * 32, -1.5, Math.sin(ang) * 38);
      dune.scale.set(1.8, 0.55 + (i % 3) * 0.15, 1.2);
      group.add(dune);
    }

    // Ksar earthen arch towers along the back
    const ksarMat = track(new THREE.MeshStandardMaterial({ color: '#b47449', roughness: 0.9 }));
    for (let i = -2; i <= 2; i++) {
      const ksar = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 4.5 + Math.abs(i) * 0.5, 2.6)), ksarMat);
      ksar.position.set(i * 4.2, 2.2, -halfL - 5.2);
      group.add(ksar);
    }
  } else if (type === 'coastal') {
    // Bizerte Palm Trees & Mediterranean Seafront Promenade
    const palmCount = 14;
    const trunkGeo = track(new THREE.CylinderGeometry(0.14, 0.24, 5.2, 7));
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#78553a', roughness: 0.88 }));
    const leafGeo = track(new THREE.ConeGeometry(1.6, 1.1, 6));
    const leafMat = track(new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.72 }));

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, palmCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < palmCount; i++) {
      const side = i < 7 ? -1 : 1;
      const idx = i % 7;
      const px = side * (halfW + 3.8);
      const pz = -halfL + idx * (loc.pitchLength / 6);

      dummy.position.set(px, 2.6, pz);
      dummy.rotation.set(0, 0, side * -0.08);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      dummy.position.set(px + side * 0.2, 5.3, pz);
      dummy.rotation.set(0, idx * 0.6, 0);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
    trunks.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    trunks.computeBoundingSphere();
    leaves.computeBoundingSphere();
    group.add(trunks, leaves);
  }
}
