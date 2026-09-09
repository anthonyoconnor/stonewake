import { DynamicTexture, type Scene } from '@babylonjs/core';

/** Continuous water ripples and cooled basalt fissures; visual flow follows existing simulation time. */
export function hazardSurface(scene: Scene, lava: boolean) {
  const size = 256,
    texture = new DynamicTexture(lava ? 'cooled lava' : 'cavern water', size, scene, true);
  const context = texture.getContext() as CanvasRenderingContext2D,
    image = context.createImageData(size, size);
  const random = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2;
      let red: number, green: number, blue: number;
      if (lava) {
        const px = (x / size) * 5 + Math.sin(v * 2) * 0.12,
          py = (y / size) * 5 + Math.cos(u * 3) * 0.14;
        let nearest = Infinity,
          second = Infinity,
          shade = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const ix = Math.floor(px) + dx,
              iy = Math.floor(py) + dy,
              sx = (ix + 50) % 5,
              sy = (iy + 50) % 5;
            const distance = Math.hypot(
              px - ix - 0.2 - random(sx, sy) * 0.6,
              py - iy - 0.2 - random(sy + 7, sx + 2) * 0.6,
            );
            if (distance < nearest) {
              second = nearest;
              nearest = distance;
              shade = random(sx + 4, sy + 9);
            } else second = Math.min(second, distance);
          }
        const heat = Math.max(0, 1 - (second - nearest) / 0.055);
        const embers = Math.max(0, 1 - (second - nearest) / 0.18) * 0.15;
        red = 34 + shade * 26 + heat * 212 + embers * 80;
        green = 30 + shade * 17 + heat * 109;
        blue = 31 + shade * 12 + heat * 22;
      } else {
        const broad = Math.sin(u + Math.sin(v * 2) * 0.9) * Math.cos(v + Math.sin(u * 2) * 0.7);
        const ripple = Math.sin(u * 7 + Math.sin(v * 3) * 2.1) + Math.cos(v * 8 + Math.sin(u * 4) * 1.8);
        const caustic = Math.pow(Math.max(0, 1 - Math.abs(ripple) * 4), 3);
        red = 24 + broad * 5 + caustic * 43;
        green = 59 + broad * 10 + caustic * 55;
        blue = 68 + broad * 11 + caustic * 53;
      }
      const i = (y * size + x) * 4;
      image.data.set([red, green, blue, 255], i);
    }
  context.putImageData(image, 0, 0);
  texture.update();
  texture.anisotropicFilteringLevel = 8;
  return texture;
}
