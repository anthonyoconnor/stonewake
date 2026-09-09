import { DynamicTexture, type Scene } from '@babylonjs/core';
import { roomFloors } from '../content/room-visuals';

export interface RoomSurfaceDetail {
  /** Exposed edges in texture space: top=1, right=2, bottom=4, left=8. */
  edgeMask?: number;
  /** Missing diagonals with both adjoining room tiles present: TL=1, TR=2, BR=4, BL=8. */
  cornerMask?: number;
  /** Two stone variations break repeated grain without unbounded material variants. */
  variant?: number;
  /** An offset clips a broad centerpiece across the surrounding 3×3 floor tiles. */
  motif?: boolean | { x: number; y: number };
}

/** Weathered stone with decoration concentrated on actual room boundaries. */
export function roomSurface(scene: Scene, id: string, ruined = false, detail: RoomSurfaceDetail = {}) {
  const look = roomFloors[id];
  if (!look) return undefined;
  const tex = new DynamicTexture(`room ${id} patterned floor`, { width: 256, height: 256 }, scene, false);
  const c = tex.getContext() as CanvasRenderingContext2D;
  const variant = (detail.variant ?? 0) & 1,
    edges = (detail.edgeMask ?? 0) & 15;
  let seed = 61 + variant * 327;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const diamond = (x: number, y: number, r: number, fill = false) => {
    c.beginPath();
    c.moveTo(x, y - r);
    c.lineTo(x + r, y);
    c.lineTo(x, y + r);
    c.lineTo(x - r, y);
    c.closePath();
    if (fill) c.fill();
    c.stroke();
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  };
  const stone = (base: string, x: number, y: number, w: number, h: number) => {
    c.fillStyle = base;
    c.fillRect(x, y, w, h);
    // Mineral patches provide broad variation, with low contrast grain for normal camera zoom.
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    for (let i = 0; i < 105; i++) {
      const px = x + random() * w,
        py = y + random() * h,
        radius = 8 + random() * 39;
      c.fillStyle = i % 3 ? '#090d1209' : '#e6d4b50c';
      c.beginPath();
      for (let j = 0; j < 7; j++) {
        const a = (j * Math.PI) / 3.5,
          r = radius * (0.45 + random() * 0.55);
        const xx = px + Math.cos(a) * r,
          yy = py + Math.sin(a) * r * 0.55;
        if (!j) c.moveTo(xx, yy);
        else c.lineTo(xx, yy);
      }
      c.closePath();
      c.fill();
    }
    for (let i = 0; i < 13; i++) {
      const px = x + random() * w,
        py = y + random() * h;
      c.strokeStyle = i % 3 ? '#e7d5b511' : '#10131520';
      c.lineWidth = 0.45 + random() * 1.1;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + 13, py + 8);
      c.lineTo(px + 24, py + 6);
      c.lineTo(px + 40, py + 17);
      c.stroke();
    }
    c.restore();
  };
  stone(look.base, 0, 0, 256, 256);
  if (id === 'kitchen') {
    // Broad terracotta pavers with occasional cream squares, rather than a dense checkerboard.
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 2; col++) {
        const x = col * 128,
          y = row * 128;
        stone(col === variant && row === 1 - variant ? look.trim : look.base, x + 2, y + 2, 124, 124);
        c.strokeStyle = '#392e2566';
        c.lineWidth = 1.8;
        c.strokeRect(x + 1, y + 1, 126, 126);
        c.strokeStyle = '#f5ddb45a';
        c.lineWidth = 1.4;
        line(x + 4, y + 125, x + 4, y + 4);
        line(x + 4, y + 4, x + 125, y + 4);
      }
  }
  // Narrow inset shadows and worn bevels replace the thick black grid.
  c.strokeStyle = '#1113168c';
  c.lineWidth = 2.4;
  c.strokeRect(1.2, 1.2, 253.6, 253.6);
  c.strokeStyle = '#dac6a843';
  c.lineWidth = 1.3;
  line(4, 252, 4, 4);
  line(4, 4, 252, 4);
  c.strokeStyle = '#10131750';
  line(252, 4, 252, 252);
  line(252, 252, 4, 252);

  if (id === 'treasure') {
    // The vault concept retains large diamond inlays and clipped brass corners on each slab.
    c.strokeStyle = '#161a20';
    c.lineWidth = 7;
    diamond(128, 128, 38);
    c.strokeStyle = look.trim;
    c.lineWidth = 2.2;
    diamond(128, 126, 38);
    c.fillStyle = look.trim;
    for (const x of [8, 248])
      for (const y of [8, 248]) {
        const sx = x < 128 ? 1 : -1,
          sy = y < 128 ? 1 : -1;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + sx * 29, y);
        c.lineTo(x, y + sy * 29);
        c.closePath();
        c.globalAlpha = 0.77;
        c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = '#e1bd7c88';
        c.lineWidth = 1;
        c.stroke();
      }
  } else if (id === 'training') {
    c.strokeStyle = look.trim;
    c.fillStyle = look.trim;
    c.lineWidth = 10;
    c.globalAlpha = 0.43;
    c.beginPath();
    c.arc(128, 128, 84, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1;
    for (const x of [16, 240]) for (const y of [16, 240]) diamond(x, y, 7, true);
    c.globalAlpha = 1;
  } else if (id === 'workshop') {
    // Partial junction inlays form one small brass fitting where neighboring slabs meet.
    c.strokeStyle = '#161c24';
    c.fillStyle = look.trim;
    c.lineWidth = 2;
    for (const x of [0, 256])
      for (const y of [0, 256]) {
        diamond(x, y, 16, true);
        c.fillStyle = look.base;
        diamond(x, y, 7, true);
        c.fillStyle = look.trim;
      }
  }

  // Only exposed boundaries carry these bands. Rotations reuse matching endpoints at joins.
  for (let side = 0; side < 4; side++) {
    if (!(edges & (1 << side))) continue;
    c.save();
    c.translate(128, 128);
    c.rotate((side * Math.PI) / 2);
    c.translate(-128, -128);
    if (id === 'dormitory') {
      stone('#8f5137', 3, 4, 250, 43);
      c.strokeStyle = '#b77b5155';
      c.lineWidth = 1.1;
      for (let x = -8; x < 264; x += 10)
        for (let y = 11; y < 44; y += 9) diamond(x + (Math.round(y / 9) % 2) * 5, y, 4);
      c.strokeStyle = look.trim;
      c.lineWidth = 2.4;
      line(0, 7, 256, 7);
      line(0, 44, 256, 44);
      c.strokeStyle = '#30231d';
      c.lineWidth = 1.5;
      line(0, 49, 256, 49);
    } else if (id === 'kitchen') {
      stone(look.trim, 3, 3, 250, 39);
      c.strokeStyle = '#7b5b406e';
      c.lineWidth = 1.4;
      line(0, 41, 256, 41);
      for (const x of [0, 64, 128, 192, 256]) line(x, 3, x, 41);
      c.strokeStyle = '#ead4ad80';
      line(0, 6, 256, 6);
      line(0, 38, 256, 38);
    } else if (id === 'workshop' || id === 'treasure') {
      const width = id === 'workshop' ? 13 : 6;
      c.fillStyle = look.trim;
      c.globalAlpha = 0.85;
      c.fillRect(0, 18, 256, width);
      c.globalAlpha = 1;
      c.strokeStyle = '#e4c89099';
      c.lineWidth = 1.2;
      line(0, 18, 256, 18);
      c.strokeStyle = '#171d25';
      c.lineWidth = 2;
      line(0, 18 + width, 256, 18 + width);
    } else if (id === 'training') {
      stone('#423e3d', 3, 3, 250, 29);
      c.strokeStyle = '#b9a78c55';
      c.lineWidth = 1.3;
      line(0, 5, 256, 5);
      line(0, 30, 256, 30);
      c.strokeStyle = '#211d1e';
      for (const x of [0, 128, 256]) line(x, 3, x, 32);
    } else if (id === 'library') {
      stone('#303e50', 3, 3, 250, 43);
      c.strokeStyle = look.trim;
      c.lineWidth = 1.8;
      line(0, 6, 256, 6);
      line(0, 42, 256, 42);
      c.lineWidth = 3.1;
      c.globalAlpha = 0.76;
      // Carved abstract strokes belong to the perimeter, leaving the reading area calm.
      for (let x = 32; x < 245; x += 38) {
        line(x - 7, 13, x + 8, 34);
        line(x + 8, 13, x - 7, 34);
        line(x - 10, 25, x, 15);
        if (Math.round(x / 38) % 2) line(x + 10, 25, x, 35);
      }
      c.globalAlpha = 1;
    }
    c.restore();
  }
  // Corner blocks cover intersecting strips and make convex corners intentional.
  for (const [a, b, x, y] of [
    [1, 8, 24, 24],
    [1, 2, 232, 24],
    [4, 2, 232, 232],
    [4, 8, 24, 232],
  ]) {
    if (!(edges & a) || !(edges & b)) continue;
    if (id === 'dormitory') {
      c.fillStyle = '#8f5137';
      c.fillRect(x - 20, y - 20, 40, 40);
      c.strokeStyle = look.trim;
      c.lineWidth = 3.2;
      diamond(x - 6, y, 11);
      diamond(x + 6, y, 11);
    } else if (id === 'library' || id === 'workshop' || id === 'training') {
      c.fillStyle = id === 'training' ? '#423e3d' : look.base;
      c.fillRect(x - 20, y - 20, 40, 40);
      c.strokeStyle = look.trim;
      c.lineWidth = 1.8;
      c.strokeRect(x - 17, y - 17, 34, 34);
      diamond(x, y, id === 'training' ? 10 : 9);
      if (id === 'training') diamond(x, y, 5);
    } else if (id === 'kitchen') {
      c.fillStyle = look.base;
      c.fillRect(x - 11, y - 11, 22, 22);
      c.strokeStyle = '#f1d8b0aa';
      c.lineWidth = 1;
      c.strokeRect(x - 10, y - 10, 20, 20);
    }
  }

  // Inset borders turn inside the diagonal tile at concave corners of bends and retained terrain.
  for (let corner = 0; corner < 4; corner++) {
    if (!((detail.cornerMask ?? 0) & (1 << corner))) continue;
    c.save();
    c.translate(128, 128);
    c.rotate((corner * Math.PI) / 2);
    c.translate(-128, -128);
    const elbow = (inset: number) => {
      c.beginPath();
      c.moveTo(inset, 0);
      c.lineTo(inset, inset);
      c.lineTo(0, inset);
      c.stroke();
    };
    if (id === 'treasure' || id === 'workshop') {
      const width = id === 'workshop' ? 13 : 6;
      stone(look.base, 0, 0, 38, 38);
      c.strokeStyle = look.trim;
      c.lineWidth = width;
      c.globalAlpha = 0.85;
      elbow(18 + width / 2);
      c.globalAlpha = 1;
      c.strokeStyle = '#e4c89099';
      c.lineWidth = 1.2;
      elbow(18);
      c.strokeStyle = '#171d25';
      c.lineWidth = 2;
      elbow(18 + width);
    } else {
      const size = id === 'dormitory' ? 49 : id === 'kitchen' ? 42 : id === 'library' ? 46 : 32;
      stone(
        id === 'dormitory'
          ? '#8f5137'
          : id === 'kitchen'
            ? look.trim
            : id === 'library'
              ? '#303e50'
              : '#423e3d',
        0,
        0,
        size,
        size,
      );
      c.strokeStyle = id === 'kitchen' ? '#ead4ad80' : id === 'training' ? '#b9a78c55' : look.trim;
      c.lineWidth = id === 'dormitory' ? 2.4 : 1.8;
      elbow(id === 'dormitory' ? 7 : id === 'training' ? 5 : 6);
      elbow(id === 'dormitory' ? 44 : id === 'kitchen' ? 38 : id === 'library' ? 42 : 30);
      if (id === 'dormitory') {
        c.strokeStyle = '#b77b5155';
        c.lineWidth = 1.1;
        for (let x = 12; x < 43; x += 10) for (let y = 12; y < 43; y += 10) diamond(x, y, 4);
        c.strokeStyle = '#30231d';
        c.lineWidth = 1.5;
        elbow(49);
      } else if (id === 'library') {
        c.strokeStyle = look.trim;
        c.lineWidth = 2;
        c.globalAlpha = 0.76;
        diamond(24, 24, 8);
      } else if (id === 'kitchen') {
        c.strokeStyle = '#7b5b406e';
        c.lineWidth = 1.4;
        elbow(41);
      }
    }
    c.restore();
  }

  const motif = detail.motif;
  if (motif && (id === 'library' || id === 'kitchen')) {
    c.save();
    const offset = typeof motif === 'object' ? motif : undefined;
    c.translate(128 - (offset?.x ?? 0) * 256, 128 - (offset?.y ?? 0) * 256);
    c.scale(offset ? 2.6 : 1, offset ? 2.6 : 1);
    c.strokeStyle = look.trim;
    c.fillStyle = look.trim;
    c.globalAlpha = 0.67;
    if (id === 'library') {
      c.lineWidth = 1.4;
      // One compass stretches across the open floor, instead of a star on every square.
      for (let i = 0; i < 8; i++) {
        c.save();
        c.rotate((i * Math.PI) / 4);
        const r = i % 2 ? 41 : 70;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-7, -r * 0.44);
        c.lineTo(0, -r);
        c.lineTo(7, -r * 0.44);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.moveTo(0, -5);
        c.lineTo(-5, -r * 0.45);
        c.lineTo(0, -r + 4);
        c.closePath();
        c.fill();
        if (!(i % 2)) {
          line(0, -r, 0, -90);
          diamond(0, -98, 7);
        }
        c.restore();
      }
    } else {
      c.lineWidth = 3;
      diamond(0, 0, 80);
      c.lineWidth = 1.3;
      diamond(0, 0, 69);
      c.beginPath();
      c.moveTo(-8, 33);
      c.bezierCurveTo(-43, 21, -34, -7, -14, -23);
      c.lineTo(-15, -3);
      c.bezierCurveTo(1, -10, 4, -29, 15, -40);
      c.bezierCurveTo(12, -14, 39, -6, 26, 21);
      c.bezierCurveTo(20, 30, 8, 36, -8, 33);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = look.base;
      c.beginPath();
      c.moveTo(-9, 26);
      c.lineTo(-10, 8);
      c.lineTo(0, 17);
      c.lineTo(11, -4);
      c.lineTo(11, 25);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  // Worn pits cross stone and metal, tying the decoration to the same aged surface.
  for (let i = 0; i < 2400; i++) {
    c.fillStyle = i % 3 ? '#11151c10' : '#f5e6c913';
    c.fillRect(random() * 256, random() * 256, 0.5 + random() * 1.7, 0.5 + random() * 1.2);
  }
  if (ruined) {
    c.fillStyle = '#272d3044';
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#20252c';
    c.lineWidth = 3;
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
