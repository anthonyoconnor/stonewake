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
        const result = controller.load(id);
        refresh();
        return result;
      }),
    pause: (paused = true) =>
      checked(() => {
        controller.paused = paused;
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
  window.strongholdDev = api;
  const error = (event: ErrorEvent) => report(event.error ?? event.message);
  const rejection = (event: PromiseRejectionEvent) => report(event.reason);
  window.addEventListener('error', error);
  window.addEventListener('unhandledrejection', rejection);
  sidebar.onDevelopmentPanel = () => mountDevelopmentPanel(sidebar, api);
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
  import.meta.hot?.dispose(() => {
    window.removeEventListener('error', error);
    window.removeEventListener('unhandledrejection', rejection);
    delete window.strongholdDev;
    sidebar.onDevelopmentPanel = () => {};
  });
  return controller;
}

function mountDevelopmentPanel(sidebar: Sidebar, api: BrowserDevelopment) {
  const panel = document.createElement('section');
  panel.className = 'development-panel';
  const title = document.createElement('h3');
  title.textContent = 'Simulation tools';
  panel.append(title);
  const scenario = document.createElement('select');
  scenario.setAttribute('aria-label', 'Development scenario');
  for (const id of scenarioIds) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    scenario.append(option);
  }
  if (api.status().scenario !== 'custom') scenario.value = api.status().scenario;
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
  button('Pause / resume simulation', () => api.pause(!api.status().paused));
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
  sidebar.panel.prepend(panel);
}
