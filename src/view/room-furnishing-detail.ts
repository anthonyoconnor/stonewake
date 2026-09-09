import {
  Color3,
  DynamicTexture,
  Mesh,
  VertexData,
  type StandardMaterial,
  type TransformNode,
} from '@babylonjs/core';
import type { GameScene } from './scene';

type Finish = 'wood' | 'iron' | 'stone' | 'cloth' | 'leather' | 'straw' | 'coin' | 'paper';

/** Independent room finishes: no material or texture from a comparison archive is modified. */
export function furnishingFinish(view: GameScene, name: string, color: string, finish: Finish, motif = '') {
  const material = view.material(`room artisan ${name}`, color);
  if (material.diffuseTexture) return material;
  const size = 256,
    texture = new DynamicTexture(`room artisan ${name}`, { width: size, height: size }, view.scene, true);
  const context = texture.getContext() as CanvasRenderingContext2D,
    pixels = context.createImageData(size, size),
    base = Color3.FromHexString(color);
  let seed = 941;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const cloud = Math.sin(x * 0.041 + Math.sin(y * 0.027) * 2) * Math.sin(y * 0.045 + x * 0.012);
      const grain =
        finish === 'wood'
          ? Math.sin(y * 0.35 + Math.sin(x * 0.021) * 2.5 + Math.sin(x * 0.05) * 0.7) * 0.11
          : finish === 'cloth'
            ? (x % 3 === 0 ? -0.035 : 0.015) + (y % 3 === 0 ? -0.035 : 0.015)
            : finish === 'straw'
              ? Math.sin(x * 0.43 + Math.sin(y * 0.05) * 0.7) * 0.12
              : finish === 'leather'
                ? Math.sin(x * 0.47) * Math.sin(y * 0.38) * 0.025
                : 0;
      const noise = (random() - 0.5) * (finish === 'iron' ? 0.08 : 0.12);
      const value = 0.94 + cloud * (finish === 'wood' ? 0.08 : 0.04) + grain + noise;
      const i = (y * size + x) * 4;
      pixels.data[i] = Math.min(255, base.r * 255 * value);
      pixels.data[i + 1] = Math.min(255, base.g * 255 * value);
      pixels.data[i + 2] = Math.min(255, base.b * 255 * value);
      pixels.data[i + 3] = 255;
    }
  context.putImageData(pixels, 0, 0);
  if (finish === 'wood') {
    for (let i = 0; i < 30; i++) {
      const y = random() * size;
      context.strokeStyle = i % 3 ? '#1e120b35' : '#f1c88538';
      context.lineWidth = 0.5 + random();
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 16; x <= size; x += 16) context.lineTo(x, y + Math.sin(x * 0.028 + i) * (1 + (i % 4)));
      context.stroke();
    }
  }
  if (finish === 'iron' || finish === 'stone') {
    for (let i = 0; i < 24; i++) {
      const x = random() * size,
        y = random() * size;
      context.strokeStyle = i % 4 ? '#12141525' : '#ddd3bb40';
      context.lineWidth = 0.6;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + random() * 22, y + random() * 8);
      context.stroke();
    }
  }
  const stroke = (points: number[][], width = 7, color = '#cbb58c') => {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'square';
    context.lineJoin = 'miter';
    context.beginPath();
    points.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.stroke();
  };
  if (finish === 'coin') {
    for (const [r, style, line] of [
      [110, '#ffe195', 6],
      [96, '#a56b22', 3],
      [88, '#efc674', 2],
    ] as const) {
      context.strokeStyle = style;
      context.lineWidth = line;
      context.beginPath();
      context.arc(128, 128, r, 0, Math.PI * 2);
      context.stroke();
    }
    stroke(
      [
        [128, 66],
        [174, 124],
        [128, 184],
        [82, 124],
        [128, 66],
      ],
      11,
      '#9c6420',
    );
    stroke(
      [
        [129, 69],
        [171, 124],
        [129, 179],
      ],
      6,
      '#ffeaa5',
    );
    stroke(
      [
        [111, 145],
        [145, 108],
      ],
      9,
      '#ffe399',
    );
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      stroke(
        [
          [128 + Math.cos(a) * 99, 128 + Math.sin(a) * 99],
          [128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104],
        ],
        2,
        '#ffdd91',
      );
    }
  }
  if (motif === 'engineer') {
    context.strokeStyle = '#d7b974';
    context.lineWidth = 13;
    context.beginPath();
    context.arc(128, 140, 32, 0, Math.PI * 2);
    context.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      stroke(
        [
          [128 + Math.cos(a) * 31, 140 + Math.sin(a) * 31],
          [128 + Math.cos(a) * 46, 140 + Math.sin(a) * 46],
        ],
        14,
        '#d7b974',
      );
    }
  } else if (motif === 'warrior') {
    stroke(
      [
        [91, 179],
        [155, 100],
        [172, 121],
      ],
      10,
      '#d7ac70',
    );
    stroke(
      [
        [99, 102],
        [161, 179],
      ],
      10,
      '#d7ac70',
    );
    stroke(
      [
        [82, 122],
        [107, 96],
        [120, 112],
      ],
      10,
      '#d7ac70',
    );
  } else if (motif === 'runesmith') {
    stroke(
      [
        [99, 182],
        [140, 94],
        [168, 146],
        [119, 146],
        [158, 182],
      ],
      9,
      '#b0c8d0',
    );
  } else if (motif === 'runner') {
    context.strokeStyle = '#9b5137';
    context.lineWidth = 6;
    context.strokeRect(10, 15, 236, 226);
    stroke(
      [
        [108, 84],
        [163, 141],
        [133, 172],
        [77, 117],
        [108, 84],
      ],
      10,
      '#9b5137',
    );
    stroke(
      [
        [148, 84],
        [179, 115],
        [122, 171],
        [91, 140],
        [148, 84],
      ],
      10,
      '#9b5137',
    );
  } else if (motif === 'page') {
    for (let y = 35; y < 220; y += 10)
      stroke(
        [
          [22, y],
          [109 - (y % 30), y],
        ],
        1.5,
        '#73634b',
      );
    stroke(
      [
        [188, 81],
        [220, 127],
        [188, 175],
        [151, 127],
        [188, 81],
      ],
      3,
      '#857253',
    );
    stroke(
      [
        [188, 81],
        [181, 171],
        [211, 117],
        [151, 127],
        [202, 153],
        [188, 81],
      ],
      2,
      '#857253',
    );
  } else if (motif === 'diagram') {
    stroke(
      [
        [50, 51],
        [205, 52],
        [205, 204],
        [50, 204],
        [50, 51],
      ],
      2,
      '#726650',
    );
    stroke(
      [
        [128, 58],
        [197, 128],
        [128, 197],
        [59, 128],
        [128, 58],
        [128, 197],
      ],
      2,
      '#726650',
    );
    stroke(
      [
        [59, 128],
        [197, 128],
        [78, 77],
        [179, 181],
      ],
      2,
      '#726650',
    );
  }
  if (finish === 'cloth' && motif !== 'runner') {
    for (const x of [11, 245])
      stroke(
        [
          [x, 7],
          [x, 249],
        ],
        2,
        '#dac99e65',
      );
    for (const y of [13, 240])
      stroke(
        [
          [11, y],
          [245, y],
        ],
        2,
        '#dac99e65',
      );
  }
  texture.update();
  material.diffuseTexture = texture;
  material.diffuseColor = Color3.White();
  material.specularColor =
    finish === 'coin'
      ? new Color3(0.86, 0.72, 0.42)
      : finish === 'iron'
        ? new Color3(0.27, 0.28, 0.29)
        : new Color3(0.045, 0.04, 0.03);
  material.specularPower = finish === 'coin' ? 28 : finish === 'iron' ? 45 : 12;
  return material;
}

/** A shallow textile surface with rounded edges and irregular, continuous folds. */
export function drapedCloth(
  view: GameScene,
  parent: TransformNode,
  name: string,
  width: number,
  depth: number,
  y: number,
  z: number,
  material: StandardMaterial,
  amplitude = 0.012,
  edgeDrop = 0.045,
) {
  const mesh = new Mesh(name, view.scene),
    positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const columns = 16,
    rows = 20;
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= columns; col++) {
      const u = col / columns,
        v = row / rows;
      const edge =
        Math.pow(Math.abs(u * 2 - 1), 8) * edgeDrop + (Math.pow(Math.abs(v * 2 - 1), 10) * edgeDrop) / 3;
      const folds =
        Math.sin(u * 16 + v * 4) * Math.sin(v * 11 + 0.5) * amplitude +
        Math.sin(v * 19 + u * 8) * amplitude * 0.3;
      positions.push((u - 0.5) * width, y + folds - edge, z + (v - 0.5) * depth);
      uvs.push(u, v);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col;
        // Babylon's left-handed front faces must face the camera above the floor.
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  const data = new VertexData();
  data.positions = positions;
  data.uvs = uvs;
  data.indices = indices;
  data.normals = [];
  VertexData.ComputeNormals(positions, indices, data.normals);
  data.applyToMesh(mesh);
  mesh.material = material;
  mesh.parent = parent;
  mesh.isPickable = false;
  return mesh;
}
