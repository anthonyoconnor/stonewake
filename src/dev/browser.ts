import { DevelopmentController, type DevCommand } from './controller';
import { scenarioIds, type ScenarioId } from '../content/scenarios';
import { stepCount, STEP_SECONDS } from './stepping';
import type { World } from '../game/types';
import type { Sidebar } from '../ui/sidebar';

export interface BrowserDevelopment {
  version: 1;
  status: () => ReturnType<DevelopmentController['status']> & { busy: boolean };
  load: (id: ScenarioId) => ReturnType<DevelopmentController['load']>;
  pause: (paused?: boolean) => void;
  state: () => World;
  inspect: (id?: number) => ReturnType<DevelopmentController['inspect']>;
  command: (command: DevCommand) => string;
  advance: (seconds: number) => Promise<{ advanced: number; elapsed: number }>;
}
declare global {
  interface Window {
    strongholdDev?: BrowserDevelopment;
  }
}

export function installDevelopment(
  getWorld: () => World,
  replaceWorld: (world: World, id: ScenarioId) => void,
  refresh: () => void,
  sidebar: Sidebar,
  exposeBrowserApi = true,
) {
  const controller = new DevelopmentController(getWorld, replaceWorld);
  let busy = false;
  const checkIdle = () => {
    if (busy) throw new Error('Simulation advance in progress. Await it before another command.');
  };
  const report = (error: unknown) =>
    controller.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  const checked = <T>(fn: () => T): T => {
    try {
      checkIdle();
      return fn();
    } catch (error) {
      report(error);
      throw error;
    }
  };
  const api: BrowserDevelopment = {
    version: 1,
    status: () => ({ ...controller.status(), busy }),
    state: () => controller.state(),
    inspect: (id) => controller.inspect(id),
    load: (id) =>
      checked(() => {
        sidebar.onPause(controller.paused);
        const result = controller.load(id);
        refresh();
        return result;
      }),
    pause: (paused = true) =>
      checked(() => {
        controller.paused = paused;
        sidebar.onPause(paused);
        if (getWorld().spellTest) getWorld().spellTest!.paused = false;
      }),
    command: (command) =>
      checked(() => {
        const result = controller.command(command);
        if (command.kind === 'free-build') sidebar.onFreeBuild(command.enabled);
        refresh();
        return result;
      }),
    advance: async (seconds) => {
      checkIdle();
      const steps = stepCount(seconds);
      controller.paused = true;
      sidebar.onPause(true);
      busy = true;
      // Freeze sidebar/world gestures while yielding frames. Camera/rendering stay available.
      const sidebarInert = sidebar.root.inert;
      sidebar.root.inert = true;
      const canvas = sidebar.view.canvas,
        pointerEvents = canvas.style.pointerEvents;
      canvas.style.pointerEvents = 'none';
      try {
        for (let done = 0; done < steps;) {
          const batch = Math.min(20, steps - done);
          controller.advance(batch * STEP_SECONDS);
          done += batch;
          refresh();
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
        return { advanced: steps * STEP_SECONDS, elapsed: getWorld().elapsed };
      } catch (error) {
        report(error);
        throw error;
      } finally {
        busy = false;
        sidebar.root.inert = sidebarInert;
        canvas.style.pointerEvents = pointerEvents;
        refresh();
      }
    },
  };
  if (exposeBrowserApi) window.strongholdDev = api;
  const error = (event: ErrorEvent) => report(event.error ?? event.message);
  const rejection = (event: PromiseRejectionEvent) => report(event.reason);
  if (exposeBrowserApi) {
    window.addEventListener('error', error);
    window.addEventListener('unhandledrejection', rejection);
  }
  sidebar.onDevelopmentPanel = () => mountDevelopmentPanel(sidebar, api);
  if (exposeBrowserApi) {
    const params = new URLSearchParams(location.search),
      scenario = params.get('scenario');
    if (scenario) {
      try {
        api.load(scenario as ScenarioId);
      } catch {
        /* Error is readable through status(). */
      }
    }
    if (params.get('paused') === '1') controller.paused = true;
  }
  import.meta.hot?.dispose(() => {
    if (exposeBrowserApi) {
      window.removeEventListener('error', error);
      window.removeEventListener('unhandledrejection', rejection);
      delete window.strongholdDev;
    }
    sidebar.onDevelopmentPanel = () => {};
  });
  return controller;
}

function mountDevelopmentPanel(sidebar: Sidebar, api: BrowserDevelopment) {
  const comparisons = [
    ['graphics-gallery', 'Characters', 'Sixteen starting and refined character pairs.'],
    ['terrain-comparison', 'Terrain & rooms', 'Matching terrain, furnished rooms and regional palettes.'],
    [
      'arcana-gallery',
      'Spells, traps & Hearthstones',
      'Thirteen starting and refined effects and structures.',
    ],
  ] as const;
  if (sidebar.category === 'debug') {
    const links = sidebar.panel.querySelector<HTMLElement>('#debug-comparisons')!;
    links.hidden = false;
    links.innerHTML = '<h3>Before &amp; after</h3>';
    const feedback = document.createElement('p');
    feedback.className = 'muted';
    feedback.setAttribute('role', 'status');
    for (const [id, label, description] of comparisons) {
      const button = document.createElement('button');
      button.className = 'wide';
      button.textContent = label;
      button.title = description;
      button.onclick = () => {
        try {
          api.load(id);
        } catch (error) {
          feedback.textContent = String(error);
        }
      };
      links.append(button);
    }
    links.append(feedback);
    return;
  }
  const panel = document.createElement('section');
  panel.className = 'development-panel';
  const title = document.createElement('h3');
  title.textContent = 'Additional test scenarios';
  panel.append(title);
  const scenario = document.createElement('select');
  scenario.setAttribute('aria-label', 'Development scenario');
  const groups: Array<{ label: string; items: Array<readonly [ScenarioId, string]> }> = [
    { label: 'Before & after', items: comparisons.map(([id, label]) => [id, label]) },
    {
      label: 'Characters & enemies',
      items: [
        ['character-models', 'Character model showcase'],
        ['enemy-roster', 'Enemy roster'],
        ['cave-hounds', 'Cave Hound patrols'],
      ],
    },
    {
      label: 'Rooms & work',
      items: [
        ['lighting', 'Lighting studio'],
        ['stonehands', 'Stonehand work yard'],
        ['miner-work', 'Miner work yard'],
        ['crowded-kitchen', 'Crowded Kitchen'],
        ['research-interruption', 'Research interruptions'],
        ['locked-door-hauling', 'Hauling through a locked door'],
        ['economy', 'Economy and wages'],
        ['morale', 'Needs and morale'],
      ],
    },
    {
      label: 'Combat & objectives',
      items: [
        ['combat', 'Combat matchups'],
        ['encounters', 'Camps and raids'],
        ['hearth', 'Onward Hearthstone activation'],
        ['hearth-defeat', 'Stone Hearth defeat'],
        ['crossings', 'Water and lava crossings'],
      ],
    },
    {
      label: 'Regional scenes',
      items: [
        ['region-upper', 'Upper caverns'],
        ['region-fungal', 'Fungal caves'],
        ['region-ancient', 'Ancient ruins'],
        ['region-crystal', 'Crystal caverns'],
        ['region-volcanic', 'Volcanic depths'],
      ],
    },
  ];
  const listed = new Set(groups.flatMap((group) => group.items.map(([id]) => id)));
  groups.push({
    label: 'Other scenarios',
    items: scenarioIds
      .filter(
        (id) => !listed.has(id) && !['stronghold', 'room-lab', 'showcase', 'defenses', 'spells'].includes(id),
      )
      .map((id) => [id, id.replaceAll('-', ' ')]),
  });
  for (const group of groups.filter((group) => group.items.length)) {
    const options = document.createElement('optgroup');
    options.label = group.label;
    for (const [id, label] of group.items) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      options.append(option);
    }
    scenario.append(options);
  }
  if ([...scenario.options].some((o) => o.value === api.status().scenario))
    scenario.value = api.status().scenario;
  panel.append(scenario);
  const feedback = document.createElement('p');
  feedback.className = 'muted';
  feedback.setAttribute('role', 'status');
  const button = (label: string, action: () => unknown) => {
    const b = document.createElement('button');
    b.className = 'wide';
    b.textContent = label;
    b.onclick = async () => {
      try {
        await action();
        feedback.textContent = `${api.status().paused ? 'Paused' : 'Running'} · ${api.status().elapsed.toFixed(2)}s`;
      } catch (error) {
        feedback.textContent = String(error);
      }
    };
    panel.append(b);
  };
  button('Load scenario paused', () => api.load(scenario.value as ScenarioId));
  panel.append(feedback);

  if (!sidebar.lab || comparisons.some(([id]) => id === api.status().scenario)) {
    sidebar.panel.append(panel);
    return;
  }
  const help = document.createElement('p');
  help.className = 'muted';
  help.textContent =
    'Time controls affect this test world and leave it paused. Resume above for continuous play.';
  panel.append(help);
  button('Step 0.05 seconds', () => api.advance(0.05));
  button('Advance 10 seconds', () => api.advance(10));
  const resident = document.createElement('select');
  resident.setAttribute('aria-label', 'Diagnostic resident');
  for (const a of api.state().agents) {
    const option = document.createElement('option');
    option.value = String(a.id);
    option.textContent = `${a.id} · ${a.name}`;
    resident.append(option);
  }
  panel.append(resident);
  const output = document.createElement('pre');
  output.className = 'diagnostic-output';
  button('Inspect resident diagnostics', () => {
    output.textContent = JSON.stringify(api.inspect(Number(resident.value)), null, 2);
  });
  panel.append(feedback, output);
  sidebar.panel.append(panel);
}
