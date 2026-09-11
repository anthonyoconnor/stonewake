import { SmartArray, type AbstractMesh, type Scene, type TransformNode } from '@babylonjs/core';

type Visibility = { camera: number; world: number; strategy: number; visible: boolean };

/** Only finalized, immutable terrain/furniture belongs here. Actors and effects stay dynamic. */
export class StaticMeshCandidates {
  private staticMeshes = new WeakSet<AbstractMesh>();
  private visibility = new WeakMap<AbstractMesh, Visibility>();
  private transform = new Array<number>(16).fill(NaN);
  private cameraGeneration = 0;
  private candidates = new SmartArray<AbstractMesh>(1024);
  private all: { data: AbstractMesh[]; length: number };

  constructor(private scene: Scene) {
    this.all = { data: scene.meshes, length: scene.meshes.length };
  }

  finalize(node: TransformNode) {
    node.freezeWorldMatrix();
    for (const mesh of node.getChildMeshes()) this.finalizeMesh(mesh);
  }

  finalizeMesh(mesh: AbstractMesh) {
    mesh.freezeWorldMatrix();
    this.staticMeshes.add(mesh);
  }

  reset() {
    this.staticMeshes = new WeakSet();
    this.visibility = new WeakMap();
    this.candidates = new SmartArray<AbstractMesh>(1024);
  }

  get = () => {
    const scene = this.scene;
    if (scene.skipFrustumClipping || !scene.frustumPlanes) {
      this.all.data = scene.meshes;
      this.all.length = scene.meshes.length;
      return this.all;
    }
    // Glow rendering rewrites Babylon's matrix updateFlag even when the
    // camera is stationary. Compare the 16 actual values without allocating.
    const matrix = scene.getTransformMatrix().m;
    for (let i = 0; i < 16; i++)
      if (this.transform[i] !== matrix[i]) {
        for (let j = 0; j < 16; j++) this.transform[j] = matrix[j];
        this.cameraGeneration++;
        break;
      }
    const camera = this.cameraGeneration;
    this.candidates.reset();
    // Walking the live array preserves Babylon's order and immediately handles
    // creation/disposal, including the shared fog source and its instances.
    for (const mesh of scene.meshes) {
      if (!mesh.isVisible) continue;
      if (this.staticMeshes.has(mesh) && mesh.isWorldMatrixFrozen && !mesh.alwaysSelectAsActiveMesh) {
        const world = mesh.getWorldMatrix().updateFlag;
        let cached = this.visibility.get(mesh);
        if (!cached) {
          cached = { camera: -1, world: -1, strategy: -1, visible: false };
          this.visibility.set(mesh, cached);
        }
        if (cached.camera !== camera || cached.world !== world || cached.strategy !== mesh.cullingStrategy) {
          cached.camera = camera;
          cached.world = world;
          cached.strategy = mesh.cullingStrategy;
          cached.visible = mesh.isInFrustum(scene.frustumPlanes);
        }
        if (!cached.visible) continue;
      }
      // Readiness, visibility, enabled state, LOD and per-frame actor bounds are
      // still evaluated by Babylon. Picking continues to use scene.meshes.
      this.candidates.push(mesh);
    }
    return this.candidates;
  };
}
