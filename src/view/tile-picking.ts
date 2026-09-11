import type { Scene } from '@babylonjs/core';

/** Reject distant tiles before Babylon transforms the ray and tests their triangles. */
export function pickTile(scene: Scene, x: number, y: number) {
  const ray = scene.createPickingRay(x, y, null, scene.activeCamera);
  return scene.pick(x, y, (mesh) => {
    if (!mesh.metadata?.tile) return false;
    const bounds = mesh.getBoundingInfo().boundingBox;
    // Only the broad phase is approximate. Keep Babylon's original per-mesh
    // ray for identical surface hits; pad bounds for matrix rounding at edges.
    return ray.intersectsBoxMinMax(bounds.minimumWorld, bounds.maximumWorld, 0.002);
  });
}
