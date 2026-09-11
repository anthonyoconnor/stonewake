import { InstancedMesh, Mesh, PointLight, StandardMaterial, type AbstractMesh } from '@babylonjs/core';
import { isTerrainComparison } from '../content/terrain-comparison.ts';
import type { GameScene } from './scene';

type Batch = { members: AbstractMesh[]; mesh: Mesh };

/** Draw nearby opaque, ambient-lit terrain together. Keep original tile meshes for picking. */
export class TerrainBatches {
  enabled = true;
  private batches = new Map<string, Batch>();
  private hidden = new Set<AbstractMesh>();
  private revision = '';

  constructor(
    private view: GameScene,
    private finalize: (mesh: Mesh) => void,
  ) {}

  update() {
    const v = this.view;
    if (!this.enabled || isTerrainComparison(v.world)) {
      this.reset();
      return;
    }
    const revision = `${v.geometryRevision}:${v.labLighting?.meshMaskRevision}`;
    if (this.revision === revision) return;
    this.revision = revision;
    const groups = new Map<string, AbstractMesh[]>();
    for (const [tile, entry] of v.tileNodes) {
      const [x, z] = tile.split(',').map(Number);
      const chunk = `${Math.floor(x / 6)},${Math.floor(z / 6)}`;
      for (const mesh of entry.node.getChildMeshes()) {
        // Fog already shares geometry; thin instances also remove per-cell
        // active-mesh evaluation. Original instances remain as exact pick targets.
        if (mesh instanceof InstancedMesh && mesh.sourceMesh === v.unknownBlock) {
          const id = `fog:${chunk}`,
            group = groups.get(id);
          if (group) group.push(mesh);
          else groups.set(id, [mesh]);
          continue;
        }
        // Transparent/emissive geometry and locally illuminated terrain retain
        // their own sorting and light masks.
        if (
          !(mesh instanceof Mesh) ||
          mesh.instances.length ||
          !mesh.isEnabled() ||
          (!mesh.isVisible && !this.hidden.has(mesh)) ||
          mesh.visibility !== 1 ||
          !mesh.isWorldMatrixFrozen ||
          mesh.skeleton ||
          mesh.morphTargetManager
        )
          continue;
        const material = mesh.material;
        if (
          !(material instanceof StandardMaterial) ||
          material.needAlphaBlendingForMesh(mesh) ||
          material.emissiveColor.r ||
          material.emissiveColor.g ||
          material.emissiveColor.b ||
          mesh.lightSources.some((l) => l instanceof PointLight)
        )
          continue;
        const id = `${chunk}:${material.uniqueId}:${mesh.getVerticesDataKinds().join(',')}`;
        const group = groups.get(id);
        if (group) group.push(mesh);
        else groups.set(id, [mesh]);
      }
    }
    for (const [id, batch] of this.batches) {
      const members = groups.get(id);
      if (members?.length === batch.members.length && members.every((m, i) => m === batch.members[i])) {
        groups.delete(id);
        continue;
      }
      this.remove(batch);
      this.batches.delete(id);
    }
    for (const [id, members] of groups) {
      if (members.length < 3) continue;
      let mesh: Mesh | null;
      if (members[0] instanceof InstancedMesh) {
        mesh = members[0].sourceMesh.clone(`terrain batch ${id}`, null, true);
        // Instance attributes belong to geometry: each patch needs its own
        // buffers, without overwriting another patch or the original fog picks.
        mesh.makeGeometryUnique();
        const matrices = new Float32Array(members.length * 16);
        members.forEach((member, i) => member.getWorldMatrix().copyToArray(matrices, i * 16));
        mesh.thinInstanceSetBuffer('matrix', matrices, 16, true);
      } else mesh = Mesh.MergeMeshes(members as Mesh[], false, true);
      if (!mesh) continue;
      mesh.name = `terrain batch ${id}`;
      mesh.metadata = undefined;
      mesh.isPickable = false;
      mesh.isVisible = true;
      this.finalize(mesh);
      for (const member of members) {
        // All gameplay/pointer picks supply the tile-metadata predicate, which
        // Babylon evaluates independently of render visibility.
        member.isVisible = false;
        this.hidden.add(member);
      }
      this.batches.set(id, { members, mesh });
    }
  }

  private remove(batch: Batch) {
    batch.mesh.dispose();
    for (const mesh of batch.members) {
      if (!mesh.isDisposed()) mesh.isVisible = true;
      this.hidden.delete(mesh);
    }
  }

  reset() {
    for (const batch of this.batches.values()) this.remove(batch);
    this.batches.clear();
    this.revision = '';
  }
}
