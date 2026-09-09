import { Mesh, VertexData, VertexBuffer, type StandardMaterial } from '@babylonjs/core';
import { neighbors, type Tile } from '../game/types';
import type { GameScene } from './scene';

const noise = (x: number, y: number, z: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

/** One solid excavation cell, with a common top and shallow fractured exposed faces. */
export function geologicalBank(view: GameScene, tile: Tile, material: StandardMaterial) {
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [],
    colors: number[] = [];
  const vertex = (x: number, y: number, z: number, u: number, v: number, shade = 1) => {
    positions.push(x, y, z);
    uvs.push(u, v);
    colors.push(shade, shade, shade, 1);
    return positions.length / 3 - 1;
  };
  const triangle = (a: number, b: number, c: number, normal: number[]) => {
    const p = (i: number) => positions.slice(i * 3, i * 3 + 3);
    const pa = p(a),
      pb = p(b),
      pc = p(c),
      ab = pb.map((n, i) => n - pa[i]),
      ac = pc.map((n, i) => n - pa[i]);
    const dot =
      (ab[1] * ac[2] - ab[2] * ac[1]) * normal[0] +
      (ab[2] * ac[0] - ab[0] * ac[2]) * normal[1] +
      (ab[0] * ac[1] - ab[1] * ac[0]) * normal[2];
    // Babylon's left-handed front faces use the opposite winding to a right-handed cross product.
    indices.push(a, dot > 0 ? c : b, dot > 0 ? b : c);
  };
  const period = 2.35;
  const comparisonX = view.world.name === 'Terrain Comparison Studio' && tile.x >= 18 ? tile.x - 18 : tile.x;
  const top = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ].map(([x, z]) => vertex(x, 1.48, z, (comparisonX + x) / period, (tile.z + z) / period));
  triangle(top[0], top[1], top[2], [0, 1, 0]);
  triangle(top[0], top[2], top[3], [0, 1, 0]);
  const adjoining = neighbors(view.world, tile);
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const exposed = adjoining.some(
      (n) =>
        n.x === tile.x + dx &&
        n.z === tile.z + dz &&
        n.known &&
        ['floor', 'water', 'lava', 'chasm'].includes(n.terrain),
    );
    const rows = exposed ? [-0.12, 0.04, 0.31, 0.62, 0.93, 1.23, 1.445, 1.48] : [-0.12, 1.48];
    const columns = exposed ? [-0.5, -0.28, -0.04, 0.23, 0.5] : [-0.5, 0.5];
    const points: number[][] = [];
    for (let r = 0; r < rows.length; r++) {
      points[r] = [];
      for (let c = 0; c < columns.length; c++) {
        const edge = c === 0 || c === columns.length - 1 || r === 0 || r === rows.length - 1;
        const inset = edge ? 0 : 0.008 + noise(comparisonX + c, r, tile.z + dz) * 0.046;
        const along = columns[c] + (edge ? 0 : (noise(c, r, comparisonX + tile.z) - 0.5) * 0.09);
        const y =
          rows[r] + (edge || r === rows.length - 2 ? 0 : (noise(comparisonX, r + c, tile.z) - 0.5) * 0.13);
        const shade =
          r === 0
            ? 0.38
            : r === 1
              ? 0.65
              : r === rows.length - 1
                ? 0.98
                : 0.84 + noise(c, r, comparisonX + tile.z) * 0.13;
        points[r][c] = vertex(
          dx ? dx * (0.5 - inset) : along,
          y,
          dz ? dz * (0.5 - inset) : along,
          ((dx ? tile.z : comparisonX) + along) / period,
          (y + 0.12) / period,
          shade,
        );
      }
    }
    for (let r = 0; r < rows.length - 1; r++)
      for (let c = 0; c < columns.length - 1; c++) {
        const a = points[r][c],
          b = points[r][c + 1],
          d = points[r + 1][c],
          e = points[r + 1][c + 1];
        triangle(a, b, e, [dx, 0, dz]);
        triangle(a, e, d, [dx, 0, dz]);
      }
  }
  const mesh = new Mesh(`tile-${tile.x}-${tile.z}`, view.scene),
    data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.uvs = uvs;
  data.colors = colors;
  data.normals = [];
  VertexData.ComputeNormals(positions, indices, data.normals);
  data.applyToMesh(mesh);
  mesh.position.set(tile.x, 0, tile.z);
  mesh.material = material;
  mesh.parent = view.terrainRoot;
  return mesh;
}

/** Continuous geology/paving texture coordinates avoid stamping one wallpaper square on every cell. */
export function alignStoneSurface(mesh: Mesh, tile: Tile, comparison = false) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind),
    normals = mesh.getVerticesData(VertexBuffer.NormalKind);
  if (!positions || !normals) return;
  const tileX = comparison && tile.x >= 18 ? tile.x - 18 : tile.x;
  const period = tile.terrain === 'floor' ? (tile.claimed || tile.room || tile.ruin ? 2 : 3.2) : 2.35;
  const uvs: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] + tileX,
      y = positions[i + 1] + mesh.position.y,
      z = positions[i + 2] + tile.z;
    if (Math.abs(normals[i + 1]) > 0.7) uvs.push(x / period, z / period);
    else if (Math.abs(normals[i]) > 0.7) uvs.push(z / period, y / period);
    else uvs.push(x / period, y / period);
  }
  mesh.setVerticesData(VertexBuffer.UVKind, uvs);
}
