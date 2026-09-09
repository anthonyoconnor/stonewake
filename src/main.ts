import { tuning } from './content/tuning';
import { MainMenu, confirmDiscard } from './ui/menu';
import { startFreePlay, restartSession } from './game/session';
import { createCombatLab } from './content/combat-lab';
import './style.css';
import { startCampaign, restartCampaignArea, travelOnward } from './game/campaign';
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
import { HearthView } from './view/hearth';
import { createSpellLab } from './content/spell-lab';
import { populateShowcase } from './content/scenarios';
import type { DevelopmentController } from './dev/controller';
let world = startCampaign(import.meta.env.VITE_FREE_ROOM_BUILDING === 'true');
const menu = new MainMenu();
let activeRun = import.meta.env.DEV && (new URLSearchParams(location.search).has('scenario') || new URLSearchParams(location.search).has('paused'));
if (!activeRun) menu.show();
const view = new GameScene(document.querySelector<HTMLCanvasElement>('#world')!, world);
const controls = new CameraControls(view);
// A browser owns Ctrl+W; protect the in-memory session at the point of leaving.
window.addEventListener('beforeunload', (event) => {
  if (!activeRun) return;
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
const hearth = new HearthView(view);
let development: DevelopmentController | undefined;
let localPaused = false;
let retainedPaused = false;
sidebar.isPaused = () => development?.paused ?? localPaused;
sidebar.onPause = (paused) => {
  localPaused = paused;
  if (development) development.paused = paused;
  if (view.world.spellTest) view.world.spellTest.paused = false;
};
let accumulator = 0;
const refresh = () => {
  residents.update();
  defenses.update();
  magic.update();
  hearth.update();
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
  if (open && !sidebar.lab) retainedPaused = sidebar.isPaused();
  sidebar.lab = open;
  selection.selected = undefined;
  selection.start = undefined;
  selection.hover = undefined;
  const next = open
    ? shape === 'combat'
      ? createCombatLab(world.freeRoomBuilding, sidebar.combatSetup)
      : shape === 'spells'
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
  } else if (open && shape && !['empty','defenses','spells','combat'].includes(shape)) {
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
  hearth.reset();
  sidebar.inspectedUnit = undefined;
  furnish(next);
  view.setWorld(next);
  sidebar.onPause(open ? true : retainedPaused);
  controls.center(open ? (shape === 'defenses' ? 18 : 12) : world.hearth.x, open ? 12 : world.hearth.z);
  view.camera.radius = open ? 26 : tuning.homeZoom;
  view.camera.beta = shape === 'defenses' ? 0.35 : tuning.initialTilt;
  selection.setTool(shape === 'defenses' ? 'inspect' : open ? (type ?? sidebar.labType) : 'dig');
  sidebar.show(shape === 'defenses' ? 'defenses' : open ? 'lab' : 'rooms');
  if (shape === 'spells') {
    selection.setTool('dig');
    sidebar.show('spells');
  }
  if (shape === 'combat') { controls.center(14,11); selection.setTool('inspect'); sidebar.show('combat'); }
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
  if(view.world.outcome)return;
  world.freeRoomBuilding = value;
  view.world.freeRoomBuilding = value;
};
sidebar.onRestart = () => {
  void restartRun(true);
};
async function restartRun(newJourney = false) {
  if (!view.world.outcome && !(await confirmDiscard('Restart area'))) return;
  world = newJourney && world.campaign && world.outcome === 'victory' ? startCampaign(world.freeRoomBuilding) : restartSession(world);
  await sidebar.onLab(false); sidebar.onPause(false); sidebar.show('hearth'); refresh();
}
sidebar.onRestartArea = () => {
  if (!sidebar.lab) { void restartRun(); return; }
  const restarted = restartCampaignArea(view.world);
  if (restarted) { world = restarted; sidebar.onLab(false); sidebar.onPause(false); sidebar.show('hearth'); refresh(); }
  else if (development && development.scenario !== 'custom' && development.scenario !== 'stronghold') { development.load(development.scenario); refresh(); }
  else { sidebar.onRestart(); sidebar.onPause(false); }
};
sidebar.onTravel = () => {
  const next = travelOnward(view.world);
  if (!next) return;
  world = next;
  sidebar.onLab(false);
  sidebar.onPause(false);
  sidebar.show('hearth');
  refresh();
};
sidebar.onMenu = async () => {
  if (!(await confirmDiscard('Return to menu'))) return;
  activeRun = false; controls.keys.clear(); controls.pointer = undefined; controls.drag = undefined;
  selection.setTool('dig'); menu.show();
};
menu.onStart = async (mode, id) => {
  const free = world.freeRoomBuilding;
  world = mode === 'campaign' ? startCampaign(free) : startFreePlay(id!, free);
  sidebar.fullMap.element.close(); sidebar.tuningDialog.element?.close?.();
  await sidebar.onLab(false); sidebar.onPause(false); selection.setTool('dig');
  activeRun = true; view.engine.resize(); refresh();
};
let uiTime = 0;
if (import.meta.env.DEV)
  import('./dev/browser').then(({ installDevelopment }) => {
    development = installDevelopment(
      () => view.world,
      (next, id) => {
        if (loadingStudio) throw new Error('Wait for the room studio to finish loading.');
        if (id !== 'stronghold' && !sidebar.lab) retainedPaused = localPaused;
        if (id === 'stronghold') world = next;
        sidebar.lab = id !== 'stronghold';
        sidebar.inspectedUnit = undefined;
        selection.selected = undefined;
        selection.start = undefined;
        selection.hover = undefined;
        residents.reset();
        defenses.reset();
        magic.reset();
        hearth.reset();
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
  const menuBlocked = menu.open || !!document.querySelector('.discard-dialog[open]');
  if (!sidebar.tuningDialog.open && !menuBlocked) controls.update(Math.min(0.05, dt));
  else {
    controls.keys.clear();
    controls.pointer = undefined;
  }
  if (
    !document.hidden &&
    !menuBlocked &&
    !sidebar.tuningDialog.open &&
    !view.world.spellTest?.paused &&
    !sidebar.isPaused()
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
  hearth.update();
  view.render();
  uiTime += dt;
  if (uiTime > 0.15) {
    sidebar.update();
    uiTime = 0;
  }
});
