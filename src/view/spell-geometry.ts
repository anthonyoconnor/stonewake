import { Mesh, MeshBuilder, TransformNode, type StandardMaterial } from '@babylonjs/core';
import type { GameScene } from './scene';
import { residentSculpt, mergeResident } from './resident-sculpt';

export type SpellPoint = [number, number, number];
/** Solid mesh runes stay readable without billboards or particle fog. */
export function spellGeometry(view: GameScene, root: TransformNode) {
  const sculpt = residentSculpt(view, root);
  const node = (name: string, parent = root) => {
    const n = new TransformNode(name, view.scene);
    n.parent = parent;
    return n;
  };
  const line = (name: string, points: SpellPoint[], width: number, mat: StandardMaterial, parent = root) =>
    sculpt.line(name, points, width, mat, parent);
  function arc(
    name: string,
    radius: number,
    y: number,
    start: number,
    length: number,
    width: number,
    mat: StandardMaterial,
    parent = root,
    rise = 0,
  ) {
    const steps = Math.max(3, Math.ceil(Math.abs(length) * 8));
    return line(
      name,
      Array.from({ length: steps + 1 }, (_, i) => {
        const a = start + (length * i) / steps;
        return [Math.cos(a) * radius, y + (rise * i) / steps, Math.sin(a) * radius] as SpellPoint;
      }),
      width,
      mat,
      parent,
    );
  }
  function ring(
    name: string,
    radius: number,
    y: number,
    width: number,
    mat: StandardMaterial,
    parent = root,
    sides = 8,
    gap = 0.07,
  ) {
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2,
        b = ((i + 1) / sides) * Math.PI * 2,
        p = [Math.cos(a) * radius, Math.sin(a) * radius],
        q = [Math.cos(b) * radius, Math.sin(b) * radius];
      line(
        name,
        [
          [p[0] + (q[0] - p[0]) * gap, y, p[1] + (q[1] - p[1]) * gap],
          [q[0] + (p[0] - q[0]) * gap, y, q[1] + (p[1] - q[1]) * gap],
        ],
        width,
        mat,
        parent,
      );
    }
  }
  function diamond(
    name: string,
    p: SpellPoint,
    width: number,
    height: number,
    mat: StandardMaterial,
    parent = root,
  ) {
    const m = MeshBuilder.CreatePolyhedron(name, { type: 1, size: 1 }, view.scene);
    m.material = mat;
    m.parent = parent;
    m.isPickable = false;
    m.position.set(...p);
    m.scaling.set(width, height, width);
    return m;
  }
  function rune(
    name: string,
    x: number,
    y: number,
    z: number,
    size: number,
    mat: StandardMaterial,
    parent = root,
    ground = true,
  ) {
    const coords: SpellPoint[] = [
      [0, -1, 0],
      [0, -0.25, 0],
      [-0.42, 0.16, 0],
      [0, 0.6, 0],
      [0.42, 0.16, 0],
      [0, -0.25, 0],
      [0, 1, 0],
    ];
    return line(
      name,
      coords.map(([a, b]) => (ground ? [x + a * size, y, z + b * size] : [x + a * size, y + b * size, z])),
      size * 0.055,
      mat,
      parent,
    );
  }
  function chevron(
    name: string,
    radius: number,
    y: number,
    a: number,
    size: number,
    mat: StandardMaterial,
    parent = root,
  ) {
    const n = node(name, parent);
    n.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    n.rotation.y = -a;
    line(
      name,
      [
        [-size, 0, -size],
        [0, 0, 0],
        [-size, 0, size],
      ],
      0.018,
      mat,
      n,
    );
    return n;
  }
  function flat(
    name: string,
    outline: [number, number][],
    y: number,
    depth: number,
    mat: StandardMaterial,
    parent = root,
  ) {
    const m = sculpt.plate(name, outline, 0, depth, mat, parent);
    m.rotation.x = Math.PI / 2;
    m.position.y = y;
    return m;
  }
  function band(
    name: string,
    radius: number,
    width: number,
    y: number,
    start: number,
    length: number,
    mat: StandardMaterial,
    parent = root,
    taper = false,
  ) {
    const steps = Math.max(4, Math.ceil(length * 9)),
      outer: [number, number][] = [],
      inner: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const a = start + (length * i) / steps,
        w = taper ? Math.max(0.002, width * Math.sin((Math.PI * i) / steps)) : width;
      outer.push([Math.cos(a) * (radius + w / 2), Math.sin(a) * (radius + w / 2)]);
      inner.unshift([Math.cos(a) * (radius - w / 2), Math.sin(a) * (radius - w / 2)]);
    }
    return flat(name, [...outer, ...inner], y, 0.014, mat, parent);
  }
  function finish() {
    mergeResident(view, root);
    for (const m of root.getChildMeshes())
      if (m instanceof Mesh) {
        const mat = m.material as StandardMaterial | null;
        if (mat && mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.3) view.includeGlow(m);
      }
  }
  return { ...sculpt, node, line, arc, ring, diamond, rune, chevron, flat, band, finish };
}
