import * as THREE from 'three';
import { LocationDef } from '../data/locations';

export function createPitchTexture(loc: LocationDef, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;

  // Base surface fill
  ctx.fillStyle = loc.pitchColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Surface texture grain & street character
  if (loc.surfaceType === 'concrete' || loc.surfaceType === 'alley' || loc.surfaceType === 'rooftop') {
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 1 + Math.random() * 2.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, y, r, r);
    }
    // Subtle asphalt cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let c = 0; c < 12; c++) {
      ctx.beginPath();
      let cx = Math.random() * canvas.width;
      let cy = Math.random() * canvas.height;
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 90;
        cy += (Math.random() - 0.5) * 90;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  } else if (loc.surfaceType === 'desert') {
    // Wind-swept sand ripples
    for (let y = 0; y < canvas.height; y += 18) {
      ctx.fillStyle = y % 36 === 0 ? 'rgba(255,235,200,0.06)' : 'rgba(90,40,10,0.05)';
      ctx.fillRect(0, y, canvas.width, 8);
    }
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = 'rgba(255,245,220,0.05)';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  } else if (loc.surfaceType === 'forest' || loc.surfaceType === 'favela') {
    // Alternating turf stripes
    const stripes = 12;
    const sh = canvas.height / stripes;
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.fillRect(0, i * sh, canvas.width, sh);
      }
    }
  } else if (loc.surfaceType === 'coastal' || loc.surfaceType === 'neon') {
    // Geometric street court blocks
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(90, 90, canvas.width - 180, canvas.height - 180);
    if (loc.surfaceType === 'neon') {
      // Wet asphalt sheen bands
      const grad = ctx.createRadialGradient(512, 768, 60, 512, 768, 620);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Painted street accent center circle & penalty zones
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = loc.pitchAccent;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(canvas.width * 0.28, 36, canvas.width * 0.44, 180);
  ctx.fillRect(canvas.width * 0.28, canvas.height - 216, canvas.width * 0.44, 180);
  ctx.restore();

  // Crisp chalk / painted pitch lines
  ctx.strokeStyle = loc.lineColor;
  ctx.lineWidth = 10;
  ctx.globalAlpha = 0.88;

  // Outer boundary
  const pad = 36;
  ctx.strokeRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(pad, canvas.height / 2);
  ctx.lineTo(canvas.width - pad, canvas.height / 2);
  ctx.stroke();

  // Center circle + dot
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 130, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = loc.lineColor;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 14, 0, Math.PI * 2);
  ctx.fill();

  // Top & Bottom penalty boxes
  const boxW = canvas.width * 0.44;
  const boxX = (canvas.width - boxW) / 2;
  ctx.strokeRect(boxX, pad, boxW, 180);
  ctx.strokeRect(boxX, canvas.height - pad - 180, boxW, 180);

  // Penalty arcs
  ctx.beginPath();
  ctx.arc(canvas.width / 2, pad + 180, 75, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height - pad - 180, 75, Math.PI, Math.PI * 2);
  ctx.stroke();

  // VOLTA geometric street emblem at center
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.strokeStyle = loc.pitchAccent;
  ctx.lineWidth = 8;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-42, -32);
  ctx.lineTo(0, 42);
  ctx.lineTo(42, -32);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createFootballTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Street graffiti geometric panels
  ctx.fillStyle = '#18181b';
  const rows = 4;
  const cols = 8;
  const cw = canvas.width / cols;
  const ch = canvas.height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.beginPath();
        const cx = c * cw + cw / 2;
        const cy = r * ch + ch / 2;
        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(ang) * 18;
          const py = cy + Math.sin(ang) * 18;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Amber street accent stripe
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createChainLinkTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(210, 220, 232, 0.72)';
  ctx.lineWidth = 3;
  const step = 16;
  for (let i = -128; i < 256; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 128);
    ctx.lineTo(i + 128, 0);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createBoardGraffitiTexture(accent: string, wallColor: string, maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 512, 128);

  // Diagonal street chevrons
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.85;
  for (let x = -40; x < 540; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 28, 128);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x + 32, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#090b10';
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 114, 512, 14);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createTargetTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  const rings = [
    { r: 120, color: '#ef4444' },
    { r: 90, color: '#f8fafc' },
    { r: 60, color: '#ef4444' },
    { r: 30, color: '#f59e0b' },
  ];
  rings.forEach((ring) => {
    ctx.fillStyle = ring.color;
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
