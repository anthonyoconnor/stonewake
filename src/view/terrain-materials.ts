import { DynamicTexture, Texture, type Scene, type StandardMaterial } from '@babylonjs/core';

/** Original painted surfaces, shared across tiles. Colors remain editable in biome/room definitions. */
const assets = new WeakMap<
  Scene,
  Map<string, { color: Texture; normal: DynamicTexture; ready: Promise<void> }>
>();
export function terrainMaterialAsset(name: string) {
  if (name === 'biome-local_masonry-raw ground') return 'flagstone';
  const id = name.replace(/^biome-[^-]+-/, '').replace(/^ruin-/, '');
  // Room patterns carry gameplay identity and must not be replaced by the terrain sheet.
  if(id.startsWith('floor-'))return undefined;
  if (['dirt', 'gold', 'raw ground'].includes(id)) return 'fractured-earth';
  if (['rock', 'bedrock', 'gem'].includes(id)) return 'slate';
  if (
    id === 'floor' ||
    id.startsWith('floor-') ||
    ['reinforced wall', 'hearth stone', 'bridge stone', 'cut shore'].includes(id)
  )
    return 'flagstone';
  return undefined;
}

export function applyTerrainMaterial(scene: Scene, material: StandardMaterial, name: string) {
  const asset = terrainMaterialAsset(name);
  if (!asset) return false;
  let cache = assets.get(scene);
  if (!cache) {
    cache = new Map();
    assets.set(scene, cache);
  }
  let entry = cache.get(asset);
  if (!entry) {
    const url = `${import.meta.env.BASE_URL}art/terrain/${asset}.png`;
    const color = new Texture(url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
    color.name = `painted ${asset}`;
    color.anisotropicFilteringLevel = 8;
    const size = 512;
    const normal = new DynamicTexture(`${asset} relief normals`, { width: size, height: size }, scene, true);
    const context = normal.getContext() as CanvasRenderingContext2D;
    context.fillStyle = '#8080ff';
    context.fillRect(0, 0, size, size);
    normal.update(false);
    normal.gammaSpace = false;
    normal.anisotropicFilteringLevel = 8;
    const ready = new Promise<void>((resolve) => {
      const source = new Image();
      source.onload = () => {
        // Luminance only supplies restrained fine relief; geometry owns the actual bank shape.
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const c = canvas.getContext('2d')!;
        c.drawImage(source, 0, 0, size, size);
        const pixels = c.getImageData(0, 0, size, size).data;
        const height = (x: number, y: number) => {
          const i = (((y + size) % size) * size + ((x + size) % size)) * 4;
          return (pixels[i] * 0.22 + pixels[i + 1] * 0.7 + pixels[i + 2] * 0.08) / 255;
        };
        const result = context.createImageData(size, size);
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const dx = (height(x - 1, y) - height(x + 1, y)) * 1.35;
            const dy = (height(x, y - 1) - height(x, y + 1)) * 1.35;
            const length = Math.hypot(dx, dy, 1),
              i = (y * size + x) * 4;
            result.data.set(
              [
                ((dx / length) * 0.5 + 0.5) * 255,
                ((dy / length) * 0.5 + 0.5) * 255,
                ((1 / length) * 0.5 + 0.5) * 255,
                255,
              ],
              i,
            );
          }
        context.putImageData(result, 0, 0);
        normal.update(false);
        resolve();
      };
      source.onerror = () => resolve(); // Flat normal fallback; the albedo remains tracked by Babylon.
      source.src = url;
    });
    entry = { color, normal, ready };
    cache.set(asset, entry);
  }
  material.diffuseTexture = entry.color;
  material.bumpTexture = entry.normal;
  material.specularPower = 24;
  return true;
}

export async function terrainMaterialsReady(scene: Scene) {
  await Promise.all([...(assets.get(scene)?.values() ?? [])].map((entry) => entry.ready));
}
