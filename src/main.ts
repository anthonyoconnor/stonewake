import { actionIcon } from './ui/icons';
import { paintedFrame, type LoadingScreen } from './ui/loading';
import { tuning } from './content/tuning';
import { MainMenu, confirmDiscard } from './ui/menu';
import { startFreePlay, restartSession } from './game/session';
import { createLevelPreviewWorld } from './content/level-preview';
import type { World } from './game/types';
import { createCombatLab } from './content/combat-lab';
import { createLightingLab } from './content/lighting-lab';
import './style.css';
import { startCampaign, restartCampaignArea, travelOnward } from './game/campaign';
import { GameScene } from './view/scene';
import { GraphicsGallery } from './view/graphics-gallery';
import { ArcanaGallery } from './view/arcana-gallery';
import { isArcanaGallery } from './content/arcana-gallery';
import { isGraphicsGallery } from './content/graphics-gallery';
import { isTerrainComparison } from './content/terrain-comparison';
import { focusTerrainComparison } from './ui/terrain-comparison';
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
import { GameAudio } from './view/audio';
import { createAudioDialog } from './ui/audio';
import { createSpellLab } from './content/spell-lab';
import { populateShowcase } from './content/scenarios';
import type { DevelopmentController } from './dev/controller';
export async function initializeGame(loading: LoadingScreen) {
  let world = startCampaign(import.meta.env.VITE_FREE_ROOM_BUILDING === 'true');
  const menu = new MainMenu();
  let activeRun =
    import.meta.env.DEV &&
    (new URLSearchParams(location.search).has('scenario') ||
      new URLSearchParams(location.search).has('paused'));

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
  const gallery = new GraphicsGallery(view);
  sidebar.graphicsGallery = gallery;
  const arcana = new ArcanaGallery(view);
  sidebar.arcanaGallery = arcana;
  const audio = new GameAudio();
  const unlockAudio = () => { void audio.unlock(); };
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  const soundDialog = createAudioDialog(() => audio.applySettings());
  const soundButton = document.createElement('button');
  soundButton.id = 'sound-settings'; soundButton.innerHTML = actionIcon('ui-sound'); soundButton.title = 'Sound settings'; soundButton.setAttribute('aria-label', 'Sound settings');
  soundButton.onclick = () => soundDialog.show(); sidebar.root.querySelector('footer')!.append(soundButton);
  if (import.meta.env.DEV) Object.assign(view, { audio });
  window.addEventListener('pagehide', () => audio.suspend());
  if (import.meta.hot) import.meta.hot.dispose(() => { audio.dispose(); document.removeEventListener('pointerdown', unlockAudio); document.removeEventListener('keydown', unlockAudio); });
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
    gallery.update();
    arcana.update();
    residents.update();
    defenses.update();
    magic.update();
    hearth.update();
    view.render();
    sidebar.update();
  };
  let loadingStudio = false;
  let loadedLevelPreview: World | undefined;
  const openLab = async (open: boolean, shape?: string, type?: string, preview?: World) => {
    if (loadingStudio) return;
    if (open && shape === 'showcase') {
      loadingStudio = true;
      sidebar.root.querySelector('#feedback')!.textContent = 'Preparing the visual showcase…';
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    }
    if (open && !sidebar.lab) retainedPaused = sidebar.isPaused();
    loadedLevelPreview = preview ? structuredClone(preview) : undefined;
    sidebar.lab = open;
    selection.selected = undefined;
    selection.start = undefined;
    selection.hover = undefined;
    const next = open
      ? preview ?? (shape === 'lighting'
        ? createLightingLab(world.freeRoomBuilding)
        : shape === 'combat'
          ? createCombatLab(world.freeRoomBuilding, sidebar.combatSetup)
          : shape === 'spells'
            ? createSpellLab(world.freeRoomBuilding)
            : shape === 'defenses'
              ? createDefenseLab(world.freeRoomBuilding)
              : createRoomLab())
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
    } else if (open && !preview && shape && !['empty', 'defenses', 'spells', 'combat', 'lighting'].includes(shape)) {
      buildRoom(next, type ?? sidebar.labType, labLayout(next, shape));
      if (shape === 'Adjacent rooms')
        buildRoom(
          next,
          'treasure',
          labLayout(next, 'Compact').map((p) => ({ x: p.x + 3, z: p.z - 3 })),
        );
    }
    residents.reset();
    gallery.reset();
    arcana.reset();
    defenses.reset();
    magic.reset();
    hearth.reset();
    sidebar.inspectedUnit = undefined;
    furnish(next);
    view.setWorld(next);
    view.showAllEnemies = !!preview;
    sidebar.onPause(open ? true : retainedPaused);
    controls.center(open ? (shape === 'defenses' ? 18 : 12) : world.hearth.x, open ? 12 : world.hearth.z);
    view.camera.radius = open ? 26 : tuning.homeZoom;
    view.camera.beta = shape === 'defenses' ? 0.35 : tuning.initialTilt;
    view.camera.maxZ = 150;
    selection.setTool(shape === 'defenses' ? 'inspect' : open ? (type ?? sidebar.labType) : 'dig');
    sidebar.show(shape === 'defenses' ? 'defenses' : open ? 'lab' : 'rooms');
    if (shape === 'spells') {
      selection.setTool('dig');
      sidebar.show('spells');
    }
    if (shape === 'combat') {
      controls.center(14, 11);
      selection.setTool('inspect');
      sidebar.show('combat');
    }
    if (shape === 'lighting') {
      controls.center(8, 14);
      view.camera.radius = 24;
      selection.setTool('inspect');
      sidebar.show('lighting');
    }
    if (preview) {
      controls.center((next.width - 1) / 2, (next.height - 1) / 2);
      view.camera.alpha = tuning.initialAngle;
      const aspect = view.engine.getRenderWidth() / view.engine.getRenderHeight();
      const halfFov = Math.min(view.camera.fov / 2, Math.atan(Math.tan(view.camera.fov / 2) * aspect));
      view.camera.radius = Math.hypot(next.width, next.height) * .55 / Math.sin(halfFov);
      view.camera.maxZ = Math.max(150, view.camera.radius + Math.hypot(next.width, next.height));
      selection.setTool('inspect');
      sidebar.show('debug');
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
  const readyWorld = async () => {
    loading.stage('Lighting the halls…');
    refresh();
    await view.ready();
    refresh();
    await paintedFrame();
  };
  const loadLevelPreview = (next: World) => {
    if (loading.busy) return;
    sidebar.levelPreview.element.close();
    void loading.run('Loading the full level…', async () => {
      await openLab(true, 'level-preview', undefined, structuredClone(next));
      await readyWorld();
    });
  };
  sidebar.levelPreview.onLoadLevel = (id, prepared) => loadLevelPreview(createLevelPreviewWorld(prepared ? 'current' : id, prepared ?? view.world));
  sidebar.onLab = (open, shape, type) => {
    void loading.run(open ? 'Preparing the test room…' : 'Returning to the stronghold…', async () => {
      try {
        await openLab(open, shape, type);
        await readyWorld();
      } finally {
        loadingStudio = false;
      }
    });
  };
  sidebar.onFreeBuild = (value) => {
    if (view.world.outcome) return;
    world.freeRoomBuilding = value;
    view.world.freeRoomBuilding = value;
  };
  sidebar.onRestart = () => {
    void restartRun(true);
  };
  async function restartRun(newJourney = false) {
    if (loading.busy) return;
    const source = world;
    if (!view.world.outcome && !(await confirmDiscard('Restart area'))) return;
    await loading.run('Rebuilding the stronghold…', async () => {
      world =
        newJourney && source.campaign && source.outcome === 'victory'
          ? startCampaign(source.freeRoomBuilding)
          : restartSession(source);
      await openLab(false);
      sidebar.onPause(false);
      sidebar.show('hearth');
      await readyWorld();
    });
  }
  sidebar.onRestartArea = () => {
    if (loadedLevelPreview) {
      loadLevelPreview(loadedLevelPreview);
      return;
    }
    if (!sidebar.lab) {
      void restartRun();
      return;
    }
    if (development && development.scenario !== 'custom' && development.scenario !== 'stronghold') {
      const id = development.scenario;
      void loading.run('Resetting the test world…', async () => {
        development!.load(id);
        await readyWorld();
      });
    } else sidebar.onLab(true);
  };
  sidebar.onTravel = () => {
    if (loading.busy) return;
    const source = view.world;
    void loading.run('Following the runic network…', async () => {
      const next = travelOnward(source);
      if (!next) return;
      world = next;
      await openLab(false);
      sidebar.onPause(false);
      sidebar.show('hearth');
      await readyWorld();
    });
  };
  sidebar.onMenu = async () => {
    if (loading.busy || !(await confirmDiscard('Return to menu'))) return;
    activeRun = false;
    controls.keys.clear();
    controls.pointer = undefined;
    controls.drag = undefined;
    selection.setTool('dig');
    menu.show();
  };
  menu.onStart = async (mode, id) => {
    const free = world.freeRoomBuilding;
    await loading.run('Preparing a new stronghold…', async () => {
      world = mode === 'campaign' ? startCampaign(free) : startFreePlay(id!, free);
      sidebar.fullMap.element.close();
      sidebar.levelPreview.element.close();
      sidebar.tuningDialog.element.close();
      await openLab(false);
      sidebar.onPause(false);
      selection.setTool('dig');
      activeRun = true;
      view.engine.resize();
      await readyWorld();
    });
  };
  let uiTime = 0;
  await import('./dev/browser').then(({ installDevelopment }) => {
      development = installDevelopment(
        () => view.world,
        (next, id) => {
          if (loadingStudio) throw new Error('Wait for the room studio to finish loading.');
          loadedLevelPreview = undefined;
          if (id !== 'stronghold' && !sidebar.lab) retainedPaused = localPaused;
          if (id === 'stronghold') world = next;
          sidebar.lab = id !== 'stronghold';
          sidebar.inspectedUnit = undefined;
          selection.selected = undefined;
          selection.start = undefined;
          selection.hover = undefined;
          residents.reset();
          gallery.reset();
          arcana.reset();
          defenses.reset();
          magic.reset();
          hearth.reset();
          furnish(next);
          view.setWorld(next);
          gallery.update();
          arcana.update();
          controls.center(
            id === 'stronghold' ? next.hearth.x : id === 'defenses' || id === 'locked-door-hauling' ? 18 : 12,
            id === 'stronghold' ? next.hearth.z : 12,
          );
          view.camera.radius = id === 'stronghold' ? tuning.homeZoom : 26;
          view.camera.beta = id === 'defenses' || id === 'locked-door-hauling' ? 0.35 : tuning.initialTilt;
          selection.setTool('dig');
          sidebar.show('debug');
          if (next.lightingTest && !isGraphicsGallery(next) && !isTerrainComparison(next) && !isArcanaGallery(next)) {
            controls.center(8, 14);
            view.camera.radius = 24;
            sidebar.show('lighting');
          }
          if (next.combatTest) {
            controls.center(14, 11);
            sidebar.show('combat');
          }
          if (isGraphicsGallery(next)) {
            gallery.focus();
            selection.setTool('inspect');
            sidebar.show('graphics-gallery');
          }
          if (isArcanaGallery(next)) {
            arcana.focus();
            selection.setTool('inspect');
            sidebar.show('arcana-gallery');
          }
          if (isTerrainComparison(next)) {
            focusTerrainComparison(sidebar);
            selection.setTool('inspect');
            sidebar.show('terrain-comparison');
          }
          accumulator = 0;
        },
        refresh,
        sidebar,
        import.meta.env.DEV,
      );
    });
  view.engine.runRenderLoop(() => {
    if ((menu.open || document.hidden) && !loading.busy) {
      audio.update(view.world, { x: view.camera.target.x, z: view.camera.target.z }, false);
      accumulator = 0;
      controls.keys.clear();
      controls.pointer = undefined;
      return;
    }
    const dt = Math.min(0.25, view.engine.getDeltaTime() / 1000);
    const menuBlocked = loading.busy || menu.open || soundDialog.element.open || sidebar.levelPreview.element.open || !!document.querySelector('.discard-dialog[open]');
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
    gallery.update(!menuBlocked && !sidebar.tuningDialog.open ? dt : 0);
    arcana.update(!menuBlocked && !sidebar.tuningDialog.open ? dt : 0);
    residents.update();
    defenses.update();
    magic.update();
    hearth.update();
    audio.update(view.world, { x: view.camera.target.x, z: view.camera.target.z }, !document.hidden && !menuBlocked && !sidebar.tuningDialog.open && !sidebar.isPaused() && !view.world.spellTest?.paused);
    view.render();
    uiTime += dt;
    if (uiTime > 0.15) {
      sidebar.update();
      uiTime = 0;
    }
  });

  await readyWorld();
  return () => {
    if (!activeRun) menu.show();
  };
}
