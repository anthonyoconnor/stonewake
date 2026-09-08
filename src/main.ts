import { tuning } from './content/tuning';
import './style.css';
import { prototypeLevel } from './content/levels';
import { createWorld } from './game/world';
import { GameScene } from './view/scene';
import { CameraControls } from './view/controls';
import { Sidebar } from './ui/sidebar';
import { addMiners, tick } from './game/simulation';
import { ResidentView } from './view/residents';
import { Selection } from './ui/selection';
import { createRoomLab, labLayout, showcaseRooms } from './content/room-lab';
import { buildRoom, furnish } from './game/rooms';
import { characterStats, syncCharacterHealth } from './game/progression';
import { enableRecruitment } from './game/recruitment';
import { createDefenseLab } from './content/defense-lab';
import { DefenseView } from './view/defenses';
import { SpellView } from './view/spells';
import { createSpellLab } from './content/spell-lab';
import { populateShowcase } from './content/scenarios';
import type { DevelopmentController } from './dev/controller';
let world = createWorld(prototypeLevel);
world.freeRoomBuilding = import.meta.env.VITE_FREE_ROOM_BUILDING === 'true';
addMiners(world);
enableRecruitment(world);
const view = new GameScene(document.querySelector<HTMLCanvasElement>('#world')!, world);
const controls = new CameraControls(view);
// A browser owns Ctrl+W; protect the in-memory session at the point of leaving.
window.addEventListener('beforeunload', (event) => {
  event.preventDefault();
  event.returnValue = true;
});
const selection = new Selection(view);
const sidebar = new Sidebar(view, controls, selection);
sidebar.onCharacterHealthChanged = (levels) => {
  if (world !== view.world)
    for (const a of world.agents)
      if (levels.has(`${a.type}:${characterStats(a).level}`)) syncCharacterHealth(a);
};
selection.setTool('dig');
const residents = new ResidentView(view);
const defenses = new DefenseView(view);
const magic = new SpellView(view);
let development: DevelopmentController | undefined;
let accumulator = 0;
const refresh = () => {
  residents.update();
  defenses.update();
  magic.update();
  view.render();
  sidebar.update();
};
let loadingStudio = false;
sidebar.onLab = async (open, shape, type) => {
  if (loadingStudio) return;
  if (open && shape === 'showcase') {
    loadingStudio = true;
    sidebar.root.querySelector('#feedback')!.textContent = 'Preparing the visual showcase…';
    await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }
  sidebar.lab = open;
  selection.selected = undefined;
  selection.start = undefined;
  selection.hover = undefined;
  const next = open
    ? shape === 'spells'
      ? createSpellLab(world.freeRoomBuilding)
      : shape === 'defenses'
        ? createDefenseLab(world.freeRoomBuilding)
        : createRoomLab()
    : world;
  next.freeRoomBuilding = world.freeRoomBuilding;
  if (open && shape === 'showcase') {
    for (const r of showcaseRooms) {
      buildRoom(
        next,
        r.type,
        Array.from({ length: r.width * r.depth }, (_, i) => ({
          x: r.x + (i % r.width),
          z: r.z + Math.floor(i / r.width),
        })),
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    populateShowcase(next);
  } else if (open && shape && shape !== 'empty' && shape !== 'defenses' && shape !== 'spells') {
    buildRoom(next, type ?? sidebar.labType, labLayout(next, shape));
    if (shape === 'Adjacent rooms')
      buildRoom(
        next,
        'treasure',
        labLayout(next, 'Compact').map((p) => ({ x: p.x + 3, z: p.z - 3 })),
      );
  }
  residents.reset();
  defenses.reset();
  magic.reset();
  sidebar.inspectedUnit = undefined;
  furnish(next);
  view.setWorld(next);
  controls.center(open ? (shape === 'defenses' ? 18 : 12) : world.hearth.x, open ? 12 : world.hearth.z);
  view.camera.radius = open ? 26 : tuning.homeZoom;
  view.camera.beta = shape === 'defenses' ? 0.35 : tuning.initialTilt;
  selection.setTool(shape === 'defenses' ? 'inspect' : open ? (type ?? sidebar.labType) : 'dig');
  sidebar.show(shape === 'defenses' ? 'defenses' : open ? 'lab' : 'rooms');
  if (shape === 'spells') {
    selection.setTool('dig');
    sidebar.show('spells');
  }
  accumulator = 0;
  development?.worldChanged(
    !open
      ? 'stronghold'
      : shape === 'showcase' || shape === 'defenses' || shape === 'spells'
        ? shape
        : 'custom',
  );
  loadingStudio = false;
};
sidebar.onFreeBuild = (value) => {
  world.freeRoomBuilding = value;
  view.world.freeRoomBuilding = value;
};
sidebar.onRestart = () => {
  const free = world.freeRoomBuilding;
  world = createWorld(prototypeLevel);
  world.freeRoomBuilding = free;
  addMiners(world);
  enableRecruitment(world);
  sidebar.onLab(false);
};
let uiTime = 0;
if (import.meta.env.DEV)
  import('./dev/browser').then(({ installDevelopment }) => {
    development = installDevelopment(
      () => view.world,
      (next, id) => {
        if (loadingStudio) throw new Error('Wait for the room studio to finish loading.');
        if (id === 'stronghold') world = next;
        sidebar.lab = id !== 'stronghold';
        sidebar.inspectedUnit = undefined;
        selection.selected = undefined;
        selection.start = undefined;
        selection.hover = undefined;
        residents.reset();
        defenses.reset();
        magic.reset();
        furnish(next);
        view.setWorld(next);
        controls.center(
          id === 'stronghold' ? next.hearth.x : id === 'defenses' || id === 'locked-door-hauling' ? 18 : 12,
          id === 'stronghold' ? next.hearth.z : 12,
        );
        view.camera.radius = id === 'stronghold' ? tuning.homeZoom : 26;
        view.camera.beta = id === 'defenses' || id === 'locked-door-hauling' ? 0.35 : tuning.initialTilt;
        selection.setTool('dig');
        sidebar.show('debug');
        accumulator = 0;
      },
      refresh,
      sidebar,
    );
  });
view.engine.runRenderLoop(() => {
  const dt = Math.min(0.25, view.engine.getDeltaTime() / 1000);
  if (!sidebar.tuningDialog.open) controls.update(Math.min(0.05, dt));
  else {
    controls.keys.clear();
    controls.pointer = undefined;
  }
  if (
    !document.hidden &&
    !sidebar.tuningDialog.open &&
    !view.world.spellTest?.paused &&
    !development?.paused
  ) {
    accumulator += dt;
    while (accumulator >= 0.05) {
      tick(view.world, 0.05);
      accumulator -= 0.05;
    }
  } else accumulator = 0;
  residents.update();
  defenses.update();
  magic.update();
  view.render();
  uiTime += dt;
  if (uiTime > 0.15) {
    sidebar.update();
    uiTime = 0;
  }
});
