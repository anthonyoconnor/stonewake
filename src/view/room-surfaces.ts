import { DynamicTexture, type Scene } from '@babylonjs/core';
import { roomFloors } from '../content/room-visuals';

/** One quiet, readable motif per actual floor tile; no shared generic paving override. */
export function roomSurface(scene: Scene, id: string, ruined = false) {
  const look = roomFloors[id];
  if (!look) return undefined;
  const tex = new DynamicTexture(`room ${id} patterned floor`, { width: 256, height: 256 }, scene, false);
  const c = tex.getContext() as CanvasRenderingContext2D;
  c.fillStyle = look.base;
  c.fillRect(0, 0, 256, 256);
  let seed = 61;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Broad translucent veins and fine stone grain keep patterns legible at playing zoom.
  for (let i = 0; i < 20; i++) {
    const x = random() * 256,
      y = random() * 256;
    c.strokeStyle = i % 2 ? '#ebddc013' : '#0c15201a';
    c.lineWidth = 1 + random() * 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 24, y + 13);
    c.lineTo(x + 42, y + 9);
    c.stroke();
  }
  for (let i = 0; i < 1400; i++) {
    c.fillStyle = i % 2 ? '#f3e9d510' : '#11151c12';
    c.fillRect(random() * 256, random() * 256, 1 + random() * 2, 1 + random() * 2);
  }
  c.strokeStyle = '#1b2228';
  c.lineWidth = 5;
  c.strokeRect(1, 1, 254, 254);
  c.strokeStyle = '#ffe2be30';
  c.lineWidth = 2;
  c.strokeRect(5, 5, 246, 246);
  c.strokeStyle = look.trim;
  c.fillStyle = look.trim;
  c.lineWidth = 3;
  c.globalAlpha = 0.72;
  const diamond = (x: number, y: number, r: number) => {
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    c.stroke();
  };
  if (id === 'treasure') {
    diamond(128, 128, 34);
    for (const x of [17, 239])
      for (const y of [17, 239]) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (x < 128 ? 18 : -18), y);
        c.lineTo(x, y + (y < 128 ? 18 : -18));
        c.closePath();
        c.fill();
      }
  } else if (id === 'dormitory') {
    c.globalAlpha = 0.45;
    c.fillStyle = '#b77a56';
    c.fillRect(8, 8, 240, 15);
    c.fillRect(8, 233, 240, 15);
    c.globalAlpha = 0.65;
    c.strokeStyle = look.trim;
    c.lineWidth = 3;
    for (const y of [16, 240])
      for (let x = 16; x < 246; x += 24) {
        c.beginPath();
        c.moveTo(x - 5, y - 4);
        c.lineTo(x + 5, y + 4);
        c.stroke();
      }
    diamond(128, 128, 16);
  } else if (id === 'kitchen') {
    c.globalAlpha = 0.72;
    c.fillStyle = look.trim;
    c.fillRect(7, 7, 118, 118);
    c.fillRect(131, 131, 118, 118);
    c.strokeStyle = '#9e6d4a';
    c.lineWidth = 2;
    c.strokeRect(15, 15, 102, 102);
    c.strokeRect(139, 139, 102, 102);
  } else if (id === 'workshop') {
    c.globalAlpha = 0.7;
    c.fillRect(21, 7, 8, 242);
    c.fillRect(7, 21, 242, 8);
    c.globalAlpha = 0.5;
    diamond(153, 153, 19);
    c.fillRect(148, 148, 10, 10);
  } else if (id === 'training') {
    c.globalAlpha = 0.45;
    c.lineWidth = 8;
    c.beginPath();
    c.arc(128, 128, 79, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 0.7;
    for (const [x, y] of [
      [27, 27],
      [229, 27],
      [27, 229],
      [229, 229],
    ])
      diamond(x, y, 6);
  } else if (id === 'library') {
    c.globalAlpha = 0.5;
    c.lineWidth = 3;
    c.strokeRect(19, 19, 218, 218);
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        r = i % 2 ? 12 : 36,
        x = 128 + Math.cos(a) * r,
        y = 128 + Math.sin(a) * r;
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.closePath();
    c.stroke();
    for (const x of [42, 214]) {
      c.beginPath();
      c.moveTo(x - 7, 119);
      c.lineTo(x, 130);
      c.lineTo(x + 7, 119);
      c.moveTo(x, 112);
      c.lineTo(x, 143);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
  if (ruined) {
    c.fillStyle = '#272d3044';
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#20252c';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, 41);
    c.lineTo(78, 95);
    c.lineTo(96, 164);
    c.lineTo(256, 210);
    c.stroke();
  }
  tex.update();
  return tex;
}
