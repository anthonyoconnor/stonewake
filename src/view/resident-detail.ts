import { Color3, DynamicTexture } from '@babylonjs/core';
import type { GameScene } from './scene';

/** Shared surfaces keep skin quiet while woven cloth, worn leather and forged steel catch the light. */
export function residentSurface(v: GameScene, name: string, color: string, metal = false) {
  const key = `sculpt resident ${name}`,
    existing = v.materials.get(key);
  if (existing) return existing;
  const material = v.material(key, color);
  const leather = /leather|strap|binding|apron/.test(name),
    hair = /hair|beard|fur|sandy/.test(name),
    cloth = /cloth|woven|trouser/.test(name),
    textured = leather || cloth || metal;
  material.specularColor = new Color3(
    metal ? 0.22 : leather ? 0.045 : 0.024,
    metal ? 0.23 : 0.033,
    metal ? 0.23 : 0.027,
  );
  material.specularPower = metal ? 48 : leather ? 20 : 9;
  const size = textured ? 256 : 128;
  const texture = new DynamicTexture(`${key} albedo`, { width: size, height: size }, v.scene, false);
  const c = texture.getContext();
  c.fillStyle = textured ? '#f1eee6' : '#f8f4ed';
  c.fillRect(0, 0, size, size);
  const hash = (x: number, y: number) => (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
  for (let y = 0; y < size; y += 2)
    for (let x = 0; x < size; x += 2) {
      const n = Math.abs(hash(x, y));
      c.fillStyle = `rgba(72,62,47,${n * (textured ? 0.07 : 0.022)})`;
      c.fillRect(x, y, hair ? 1 : 2, hair ? 6 : 2);
    }
  if (cloth) {
    // Alternating warp/weft strands and coarse yarn variation stay legible at studio distance.
    for (let i = 0; i < size; i += 6) {
      c.fillStyle = `rgba(68,69,62,${0.09 + (i % 18) / 240})`;
      c.fillRect(i, 0, 1, size);
      c.fillStyle = 'rgba(255,255,250,.38)';
      c.fillRect(i + 1, 0, 1, size);
      c.fillStyle = 'rgba(75,71,59,.10)';
      c.fillRect(0, i, size, 1);
      c.fillStyle = 'rgba(255,255,245,.23)';
      c.fillRect(0, i + 2, size, 1);
    }
    for (let y = 0; y < size; y += 6)
      for (let x = 0; x < size; x += 6) {
        c.fillStyle = 'rgba(64,61,50,.075)';
        c.fillRect(x + ((x + y) % 12 === 0 ? 1 : 3), y + 2, 2, 3);
      }
  } else if (leather) {
    // Large soft wear patches over a broken fine grain avoid a tiled "cracked mud" effect.
    for (let i = 0; i < 40; i++) {
      const x = (i * 83) % size,
        y = (i * 139) % size,
        r = 9 + ((i * 13) % 24),
        g = c.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, i % 3 ? 'rgba(82,59,34,.065)' : 'rgba(255,246,218,.20)');
      g.addColorStop(1, 'rgba(120,99,65,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 95; i++) {
      const x = (i * 67) % size,
        y = (i * 107) % size;
      c.strokeStyle = i % 3 ? 'rgba(90,66,39,.10)' : 'rgba(255,244,215,.25)';
      c.lineWidth = i % 3 ? 0.65 : 1;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 3, y - 2, x + 5 + (i % 5), y + 2);
      c.stroke();
    }
  } else if (metal) {
    for (let y = 0; y < size; y++) {
      c.fillStyle = `rgba(72,80,78,${((y * 37) % 23) / 360})`;
      c.fillRect(0, y, size, 1);
    }
    for (let i = 0; i < 70; i++) {
      const x = (i * 79) % size,
        y = (i * 131) % size;
      c.strokeStyle = i % 4 ? 'rgba(255,255,241,.21)' : 'rgba(60,66,62,.13)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 4 + (i % 10), y + 1 + (i % 3));
      c.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const x = (i * 117) % size,
        y = (i * 47) % size,
        g = c.createRadialGradient(x, y, 0, x, y, 13);
      g.addColorStop(0, 'rgba(84,75,47,.055)');
      g.addColorStop(1, 'rgba(84,75,47,0)');
      c.fillStyle = g;
      c.fillRect(x - 13, y - 13, 26, 26);
    }
  }
  texture.update();
  material.diffuseTexture = texture;
  if (textured) {
    const normal = new DynamicTexture(`${key} tactile grain`, { width: size, height: size }, v.scene, false),
      nc = normal.getContext(),
      pixels = nc.getImageData(0, 0, size, size);
    const height = (x: number, y: number) =>
      cloth
        ? Math.sin((x * Math.PI) / 3) * 0.035 + Math.sin((y * Math.PI) / 3) * 0.028
        : metal
          ? Math.sin(y * 1.73) * 0.006 + Math.abs(hash(x, y)) * 0.005
          : Math.sin(x * 0.71 + Math.sin(y * 0.33)) * 0.012 +
            Math.sin(y * 0.91) * 0.01 +
            Math.abs(hash(x, y)) * 0.012;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = (height(x - 1, y) - height(x + 1, y)) * 2.2,
          dy = (height(x, y - 1) - height(x, y + 1)) * 2.2,
          length = Math.hypot(dx, dy, 1),
          p = (y * size + x) * 4;
        pixels.data[p] = Math.round(((dx / length) * 0.5 + 0.5) * 255);
        pixels.data[p + 1] = Math.round(((dy / length) * 0.5 + 0.5) * 255);
        pixels.data[p + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
        pixels.data[p + 3] = 255;
      }
    nc.putImageData(pixels, 0, 0);
    normal.update();
    normal.level = cloth ? 0.5 : leather ? 0.38 : 0.24;
    material.bumpTexture = normal;
  }
  return material;
}
