import { roomLook } from '../content/rooms';
import { DynamicTexture, type Scene } from '@babylonjs/core';
import { hazardSurface } from './hazard-surfaces';

// Small generated material sheets keep visual iteration independent of an asset pipeline.
export function surfaceTexture(scene: Scene, name: string) {
  if (name === 'water' || name === 'lava') return hazardSurface(scene, name === 'lava');
  const tex = new DynamicTexture(`${name}-surface`, { width: 256, height: 256 }, scene, false);
  const ruined = name.startsWith('ruin-');
  name = name.replace(/^biome-[^-]+-/, '').replace(/^ruin-/, '');
  const c = tex.getContext() as CanvasRenderingContext2D;
  let seed = 31;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (name === 'water' || name === 'lava') {
    const lava = name === 'lava';
    c.fillStyle = lava ? '#ff9a43' : '#426f7d';
    c.fillRect(0, 0, 256, 256);
    // Interlocking cooled crust or overlapping water caustics. One shared sheet per hazard.
    for (let row = -1; row < 9; row++)
      for (let col = -1; col < 9; col++) {
        const x = col * 35 + (row % 2) * 17,
          y = row * 31,
          r = 13 + random() * 7;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3,
            px = x + Math.cos(a) * r,
            py = y + Math.sin(a) * r * 0.75;
          if (i) c.lineTo(px, py);
          else c.moveTo(px, py);
        }
        c.closePath();
        if (lava) {
          c.fillStyle = ['#46332b', '#604034', '#774b35'][Math.floor(random() * 3)];
          c.fill();
          c.strokeStyle = '#ef743a';
          c.lineWidth = 2;
          c.stroke();
        } else {
          c.fillStyle = `rgba(30,61,69,${0.2 + random() * 0.25})`;
          c.fill();
          c.strokeStyle = '#a0d7d340';
          c.lineWidth = 1.5;
          c.stroke();
        }
      }
    tex.update();
    return tex;
  }
  if (['raw ground', 'dirt', 'gold', 'rock', 'bedrock', 'gem'].includes(name)) {
    // Weathered clods/strata remain distinct from deliberately fitted masonry.
    const ground = name === 'raw ground',
      rock = ['rock', 'bedrock', 'gem'].includes(name),
      size = ground ? 36 : rock ? 64 : 52;
    c.fillStyle = ground ? '#8d8272' : '#514e49';
    c.fillRect(0, 0, 256, 256);
    for (let row = -1; row < 256 / size + 1; row++)
      for (let col = -1; col < 256 / size + 1; col++) {
        const x = col * size + (row % 2) * size * 0.45,
          y = row * size,
          value = 140 + Math.floor(random() * 56),
          inset = 2 + random() * 3;
        c.fillStyle = `rgb(${value + 8},${value + 3},${value - 3})`;
        c.beginPath();
        c.moveTo(x + inset, y + 7);
        c.lineTo(x + size * 0.42, y + 2 + random() * 4);
        c.lineTo(x + size - 6, y + inset);
        c.lineTo(x + size - 2, y + size * 0.6);
        c.lineTo(x + size - 8, y + size - 3);
        c.lineTo(x + size * 0.3, y + size - 1);
        c.lineTo(x + 2, y + size - 9);
        c.closePath();
        c.fill();
        c.strokeStyle = '#ffffff35';
        c.lineWidth = 1.5;
        c.stroke();
        c.strokeStyle = '#3b393044';
        c.beginPath();
        c.moveTo(x + 5, y + size - 7);
        c.lineTo(x + size - 7, y + size - 5);
        c.stroke();
      }
    for (let i = 0; i < 2400; i++) {
      c.fillStyle = i % 2 ? '#fff0cd18' : '#32271d20';
      c.beginPath();
      c.ellipse(
        random() * 256,
        random() * 256,
        1 + random() * 6,
        1 + random() * 3,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    for (let i = 0; i < 45; i++) {
      const x = random() * 256,
        y = random() * 256,
        r = 2 + random() * 4;
      c.fillStyle = '#584f43';
      c.beginPath();
      c.ellipse(x, y, r, r * 0.65, 0.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#c4b9a0';
      c.beginPath();
      c.ellipse(x - 0.5, y - 1, r * 0.75, r * 0.4, 0.4, 0, Math.PI * 2);
      c.fill();
    }
    if (['rock', 'bedrock', 'gem'].includes(name))
      for (let i = 0; i < 18; i++) {
        const x = random() * 256,
          y = random() * 256;
        c.strokeStyle = '#383a3c88';
        c.lineWidth = 1 + random() * 2;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + random() * 28 - 14, y + 15);
        c.lineTo(x + random() * 40 - 20, y + 35);
        c.stroke();
      }
    tex.update();
    return tex;
  }
  const wood = name.includes('wood') || name === 'library shelf',
    room = name.startsWith('floor-'),
    paved = room || name === 'hearth stone' || name === 'floor' || name === 'bridge stone';
  const base = room ? (roomLook(name.slice(6)).floor ?? '#656963').slice(1) : 'ffffff';
  const rgb = [0, 2, 4].map((i) => parseInt(base.slice(i, i + 2), 16));
  c.fillStyle = room ? '#292c2b' : '#5b5851';
  c.fillRect(0, 0, 256, 256);
  const size = wood ? 64 : paved ? 128 : 64;
  for (let row = 0; row < 256 / size; row++)
    for (let col = -1; col < 256 / size; col++) {
      const x = col * size + (paved || wood ? 0 : (row % 2) * 32),
        y = row * size;
      const value = 155 + Math.floor(random() * 45),
        edge = paved || wood ? 3 : 4 + random() * 5;
      c.fillStyle = room
        ? `rgb(${rgb.map((v) => Math.round((v * value) / 180)).join(',')})`
        : `rgb(${value + 8},${value + 5},${value})`;
      c.beginPath();
      c.moveTo(x + edge, y + 3);
      c.lineTo(x + size - 9, y + 2);
      c.lineTo(x + size - 3, y + edge);
      c.lineTo(x + size - 2, y + size - 7);
      c.lineTo(x + size - 8, y + size - 3);
      c.lineTo(x + 3, y + size - 2);
      c.lineTo(x + 2, y + edge);
      c.closePath();
      c.fill();
      c.strokeStyle = '#ffffff24';
      c.lineWidth = 2;
      c.stroke();
      if (wood)
        for (let i = 0; i < 12; i++) {
          c.strokeStyle = '#55442e25';
          c.beginPath();
          c.moveTo(x + random() * size, y);
          c.bezierCurveTo(x + size / 2, y + 18, x + size / 2 + 6, y + 45, x + random() * size, y + size);
          c.stroke();
        }
    }
  for (let i = 0; i < 1500; i++) {
    c.fillStyle = i % 2 ? '#ffffff0c' : '#18161015';
    c.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1 + random() * 2);
  }
  if (room) {
    const id = name.slice(6),
      motif = roomLook(id).motif;
    c.strokeStyle = roomLook(id).trim ?? '#c0aa77';
    c.lineWidth = 5;
    c.lineWidth = 2;
    c.globalAlpha = 0.5;
    // Perimeter geometry supplies the outline; avoid a bright box around every floor tile.
    c.globalAlpha = 1;
    c.lineWidth = 4;
    for (const x of [8, 248])
      for (const y of [8, 248]) {
        c.fillStyle = '#cfb27c';
        c.fillRect(x - 2, y - 2, 4, 4);
      }
    c.beginPath();
    if (motif === 'treasure') {
      c.arc(128, 128, 24, 0, Math.PI * 2);
      c.moveTo(128, 109);
      c.lineTo(145, 128);
      c.lineTo(128, 147);
      c.lineTo(111, 128);
      c.closePath();
    } else if (motif === 'dormitory') {
      c.rect(110, 110, 36, 36);
      c.moveTo(110, 110);
      c.lineTo(146, 146);
      c.moveTo(146, 110);
      c.lineTo(110, 146);
    } else if (motif === 'kitchen') {
      c.arc(128, 127, 24, Math.PI, Math.PI * 2);
      c.lineTo(104, 127);
      c.moveTo(122, 127);
      c.lineTo(122, 149);
      c.lineTo(134, 149);
      c.lineTo(134, 127);
    } else if (motif === 'training') {
      c.moveTo(128, 101);
      c.lineTo(155, 128);
      c.lineTo(128, 155);
      c.lineTo(101, 128);
      c.closePath();
      c.moveTo(110, 110);
      c.lineTo(146, 146);
      c.moveTo(146, 110);
      c.lineTo(110, 146);
      for (const y of [32, 224]) {
        c.moveTo(28, y);
        c.lineTo(228, y);
      }
    } else if (motif === 'library') {
      c.moveTo(106, 105);
      c.lineTo(128, 111);
      c.lineTo(150, 105);
      c.lineTo(150, 148);
      c.lineTo(128, 153);
      c.lineTo(106, 148);
      c.closePath();
      c.moveTo(128, 111);
      c.lineTo(128, 153);
      for (const x of [32, 224]) {
        c.moveTo(x, 112);
        c.lineTo(x, 144);
        c.moveTo(x - 8, 124);
        c.lineTo(x, 114);
        c.lineTo(x + 8, 124);
      }
    } else {
      for (let i = 0; i <= 16; i++) {
        const a = (i * Math.PI) / 8,
          r = i % 2 ? 21 : 27;
        const x = 128 + Math.cos(a) * r,
          y = 128 + Math.sin(a) * r;
        if (!i) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.moveTo(139, 128);
      c.arc(128, 128, 11, 0, Math.PI * 2);
    }
    c.stroke();
    if (ruined) {
      c.fillStyle = '#423f4659';
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = '#262b2a';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(0, 48);
      c.lineTo(68, 69);
      c.lineTo(92, 114);
      c.lineTo(154, 134);
      c.lineTo(181, 211);
      c.lineTo(256, 238);
      c.moveTo(92, 114);
      c.lineTo(66, 169);
      c.lineTo(12, 202);
      c.stroke();
    }
  }
  tex.update();
  return tex;
}
