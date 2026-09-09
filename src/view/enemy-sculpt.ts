import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  TransformNode,
  Vector3,
  VertexData,
  type StandardMaterial,
} from '@babylonjs/core';
import type { GameScene } from './scene';
import { dressedBlock } from './environment';

type Point = readonly [number, number, number];
/** Small sculpting vocabulary shared only by the enemy roster. All dimensions are local to a rig pivot. */
export class EnemySculpt {
  private parts = new Map<TransformNode, Map<StandardMaterial, Mesh[]>>();
  constructor(
    public view: GameScene,
    public body: TransformNode,
  ) {}

  material(
    id: string,
    color: string,
    finish: 'skin' | 'stone' | 'metal' | 'cloth' | 'crystal' | 'plain' = 'skin',
    glow = 0,
  ) {
    const mat = this.view.material(`refined enemy ${id}`, color, false, glow);
    if (!mat.diffuseTexture && finish !== 'plain') {
      const texture = new DynamicTexture(`refined ${id} grain`, 256, this.view.scene, false);
      const c = texture.getContext();
      let seed = [...id].reduce((n, char) => Math.imul(n, 31) + char.charCodeAt(0), 7) >>> 0;
      const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      c.fillStyle = '#e3e0da';
      c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 30; i++) {
        c.fillStyle = i % 3 ? 'rgba(100,92,78,.13)' : 'rgba(255,247,223,.18)';
        c.beginPath();
        c.arc(random() * 256, random() * 256, 6 + random() * 19, 0, Math.PI * 2);
        c.fill();
      }
      for (let i = 0; i < 2600; i++) {
        const shade = 172 + Math.floor(random() * 76);
        c.fillStyle = `rgba(${shade},${shade},${shade},.35)`;
        const size = finish === 'stone' ? 1 + random() * 6 : 1 + random() * 2;
        c.fillRect(random() * 256, random() * 256, size, size);
      }
      if (finish === 'skin' || finish === 'stone' || finish === 'crystal') {
        c.lineWidth = finish === 'stone' ? 1.3 : 0.8;
        for (let row = -1; row < 13; row++)
          for (let col = -1; col < 13; col++) {
            const x = col * 24 + (row % 2) * 12,
              y = row * 22;
            c.strokeStyle = finish === 'crystal' ? '#eeebf2' : 'rgba(60,53,48,.38)';
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + 7 + random() * 4, y + 12);
            c.lineTo(x + 20, y + 17);
            c.lineTo(x + 24, y + 22);
            c.stroke();
          }
      }
      if (finish === 'cloth') {
        c.strokeStyle = '#b9b4a9';
        c.lineWidth = 0.6;
        for (let i = 0; i < 256; i += 4) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i, 256);
          c.moveTo(0, i);
          c.lineTo(256, i);
          c.stroke();
        }
      }
      texture.update();
      mat.diffuseTexture = texture;
    }
    mat.specularColor =
      finish === 'metal'
        ? new Color3(0.25, 0.23, 0.2)
        : finish === 'crystal'
          ? new Color3(0.34, 0.3, 0.4)
          : new Color3(0.045, 0.042, 0.038);
    mat.specularPower = finish === 'crystal' ? 38 : finish === 'metal' ? 26 : 12;
    return mat;
  }

  private add(mesh: Mesh, m: StandardMaterial, parent: TransformNode) {
    mesh.parent = parent;
    mesh.material = m;
    mesh.isPickable = false;
    let materials = this.parts.get(parent);
    if (!materials) this.parts.set(parent, (materials = new Map()));
    let list = materials.get(m);
    if (!list) materials.set(m, (list = []));
    list.push(mesh);
    return mesh;
  }
  joint(name: string, p: Point, parent = this.body) {
    const node = new TransformNode(name, this.view.scene);
    node.parent = parent;
    node.position.set(...p);
    return node;
  }
  oval(name: string, p: Point, size: Point, m: StandardMaterial, parent = this.body, rough = 0) {
    const mesh = MeshBuilder.CreateSphere(name, { diameter: 1, segments: 10 }, this.view.scene);
    if (rough) {
      const positions = mesh.getVerticesData('position')!,
        indices = mesh.getIndices()!,
        normals: number[] = [];
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i],
          y = positions[i + 1],
          z = positions[i + 2];
        const d =
          1 + rough * (Math.sin(x * 19 + z * 11) * Math.sin(y * 21 - z * 8) + Math.sin(z * 29 + y * 6) * 0.4);
        positions[i] *= d;
        positions[i + 1] *= d;
        positions[i + 2] *= d;
      }
      VertexData.ComputeNormals(positions, indices, normals);
      mesh.setVerticesData('position', positions);
      mesh.setVerticesData('normal', normals);
    }
    mesh.position.set(...p);
    mesh.scaling.set(...size);
    return this.add(mesh, m, parent);
  }
  block(name: string, p: Point, size: Point, m: StandardMaterial, parent = this.body, bevel = 0.018) {
    const mesh = dressedBlock(
      this.view,
      name,
      ...p,
      ...size,
      m,
      parent,
      Math.min(bevel, ...size.map((n) => n * 0.22)),
    );
    return this.add(mesh, m, parent);
  }
  /** Tapered curved limb, root, horn or tail. The open ends are capped; smooth normals avoid bead-like joints. */
  tube(
    name: string,
    path: readonly Point[],
    radii: readonly number[],
    m: StandardMaterial,
    parent = this.body,
    sides = 8,
  ) {
    const controls = path.map((p) => new Vector3(...p)),
      points: Vector3[] = [],
      widths: number[] = [],
      positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [];
    const steps = sides >= 7 && path.length > 2 ? 4 : 1;
    for (let i = 0; i < controls.length - 1; i++)
      for (let step = 0; step < steps; step++) {
        const t = step / steps;
        points.push(
          Vector3.CatmullRom(
            controls[Math.max(0, i - 1)],
            controls[i],
            controls[i + 1],
            controls[Math.min(controls.length - 1, i + 2)],
            t,
          ),
        );
        widths.push(radii[i] + (radii[i + 1] - radii[i]) * t);
      }
    points.push(controls[controls.length - 1]);
    widths.push(radii[radii.length - 1]);
    let axis: Vector3 | undefined;
    for (let i = 0; i < points.length; i++) {
      const tangent = points[Math.min(i + 1, points.length - 1)]
        .subtract(points[Math.max(0, i - 1)])
        .normalize();
      // Transport the previous ring axis to avoid a ninety-degree twist as a curved
      // limb crosses the vertical reference direction.
      const projected = axis?.subtract(tangent.scale(Vector3.Dot(axis, tangent)));
      const a =
          projected && projected.lengthSquared() > 0.0001
            ? projected.normalize()
            : Vector3.Cross(tangent, Math.abs(tangent.y) > 0.93 ? Vector3.Right() : Vector3.Up()).normalize(),
        b = Vector3.Cross(tangent, a).normalize();
      axis = a;
      for (let j = 0; j < sides; j++) {
        const angle = (j * Math.PI * 2) / sides;
        const p = points[i]
          .add(a.scale(Math.cos(angle) * widths[i]))
          .add(b.scale(Math.sin(angle) * widths[i]));
        positions.push(p.x, p.y, p.z);
        uvs.push(j / sides, i / (points.length - 1));
        if (i < points.length - 1) {
          const k = i * sides + j,
            n = i * sides + ((j + 1) % sides);
          indices.push(k, n, k + sides, n, n + sides, k + sides);
        }
      }
    }
    for (const [ring, reverse] of [
      [0, false],
      [points.length - 1, true],
    ] as const) {
      const center = positions.length / 3;
      positions.push(points[ring].x, points[ring].y, points[ring].z);
      uvs.push(0.5, 0.5);
      for (let j = 0; j < sides; j++) {
        const a = ring * sides + j,
          b = ring * sides + ((j + 1) % sides);
        indices.push(center, reverse ? a : b, reverse ? b : a);
      }
    }
    return this.mesh(name, positions, indices, uvs, m, parent);
  }
  /** A shallow extruded outline in the XY plane; useful for ears, torn cloth, blades and stone plates. */
  plaque(
    name: string,
    outline: readonly (readonly [number, number])[],
    depth: number,
    p: Point,
    m: StandardMaterial,
    parent = this.body,
  ) {
    const area = outline.reduce((sum, point, i) => {
      const next = outline[(i + 1) % outline.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0);
    if (area < 0) outline = [...outline].reverse();
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [],
      n = outline.length;
    for (const z of [-depth / 2, depth / 2])
      for (const [x, y] of outline) {
        positions.push(x, y, z);
        uvs.push(x + 0.5, y + 0.5);
      }
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i + 1, i, n, n + i, n + i + 1);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      indices.push(i, j, i + n, j, j + n, i + n);
    }
    const mesh = this.mesh(name, positions, indices, uvs, m, parent, true);
    mesh.position.set(...p);
    return mesh;
  }
  crystal(name: string, p: Point, height: number, radius: number, m: StandardMaterial, parent = this.body) {
    const positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [],
      rings = [
        [-0.45, 0.68],
        [-0.28, 1],
        [0.22, 0.85],
        [0.55, 0],
      ];
    for (let r = 0; r < rings.length; r++)
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        positions.push(
          Math.cos(a) * radius * rings[r][1],
          rings[r][0] * height,
          Math.sin(a) * radius * rings[r][1],
        );
        uvs.push(i / 6, r / 3);
        if (r < 3) {
          const k = r * 6 + i,
            n = r * 6 + ((i + 1) % 6);
          indices.push(k, k + 6, n, n, k + 6, n + 6);
        }
      }
    indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5);
    const mesh = this.mesh(name, positions, indices, uvs, m, parent, true);
    mesh.position.set(...p);
    return mesh;
  }
  private mesh(
    name: string,
    positions: number[],
    indices: number[],
    uvs: number[],
    m: StandardMaterial,
    parent: TransformNode,
    flat = false,
  ) {
    // The construction above uses geometric outward cross products. Babylon's default
    // left-handed winding and ComputeNormals need the opposite triangle order.
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = uvs;
    const mesh = new Mesh(name, this.view.scene);
    data.applyToMesh(mesh);
    if (flat) mesh.convertToFlatShadedMesh();
    return this.add(mesh, m, parent);
  }
  /** Preserve animated joints while collapsing their costume detail into a handful of draw calls. */
  finish() {
    for (const [pivot, materials] of this.parts) {
      const inverse = pivot.computeWorldMatrix(true).clone().invert();
      for (const [material, meshes] of materials) {
        for (const mesh of meshes) mesh.computeWorldMatrix(true);
        const merged = meshes.length > 1 ? Mesh.MergeMeshes(meshes, true, true) : undefined;
        if (merged) {
          merged.name = `${pivot.name} sculpt ${material.name}`;
          merged.bakeTransformIntoVertices(inverse);
          merged.parent = pivot;
          merged.isPickable = false;
        }
        const result = merged ?? meshes[0];
        if (material.emissiveColor.r + material.emissiveColor.g + material.emissiveColor.b > 0.3)
          this.view.includeGlow(result);
      }
    }
  }
}
