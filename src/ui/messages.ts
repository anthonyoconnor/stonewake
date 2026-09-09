import type { Sidebar } from './sidebar';
import type { World } from '../game/types';
import { refreshNotifications } from '../content/notifications';
import {
  activeNotifications,
  dismissNotification,
  notificationHistory,
  notificationLocation,
  type Notification,
} from '../game/notifications';
import { actionIcon } from './icons';
import './notifications.css';

/** One renderer for every report. Content owns wording, icons, priority and actions. */
export class MessageCenter {
  private rail = document.createElement('section');
  private list = document.createElement('div');
  private card = document.createElement('section');
  private announcer = document.createElement('div');
  private buttons = new Map<number, HTMLElement>();
  private world?: World;
  private selected?: Notification;
  private announced = 0;
  constructor(private sidebar: Sidebar) {
    this.rail.id = 'notification-rail';
    this.rail.setAttribute('aria-label', 'Stronghold notifications');
    this.list.className = 'notification-list';
    this.list.setAttribute('aria-label', 'Active reports');
    const history = document.createElement('button');
    history.id = 'notification-history';
    history.textContent = '?';
    history.title = 'Help and notification history';
    history.setAttribute('aria-label', history.title);
    history.onclick = () => {
      this.close();
      sidebar.show('help');
    };
    this.rail.append(this.list, history);
    this.card.id = 'notification-card';
    this.card.hidden = true;
    this.card.setAttribute('aria-labelledby', 'notification-title');
    this.card.innerHTML =
      '<header><span class="notification-card-icon" aria-hidden="true"></span><div><small id="notification-category"></small><h2 id="notification-title"></h2></div><button id="close-notification" aria-label="Close notification details" title="Close details (Escape)">×</button></header><p id="notification-text"></p><p id="notification-source-status" class="muted"></p><div class="notification-actions"><button id="notification-locate"></button><button id="notification-action"></button><button id="notification-dismiss">Dismiss</button></div>';
    this.card.querySelector<HTMLButtonElement>('#close-notification')!.onclick = () => this.close(true);
    this.card.querySelector<HTMLButtonElement>('#notification-dismiss')!.onclick = () =>
      this.dismiss(this.selected!);
    this.card.querySelector<HTMLButtonElement>('#notification-locate')!.onclick = () => {
      const w = sidebar.view.world,
        source = this.selected?.sources?.find((s) => notificationLocation(w, s));
      const point = source && notificationLocation(w, source);
      if (!source || !point) {
        this.renderCard();
        return;
      }
      sidebar.controls.center(point.x, point.z);
      if (source.kind !== 'point')
        sidebar.inspectedUnit = { kind: source.kind === 'resident' ? 'dwarf' : 'enemy', id: source.id };
      this.close();
      sidebar.update();
    };
    this.card.querySelector<HTMLButtonElement>('#notification-action')!.onclick = () => {
      const action = this.selected?.action;
      if (!action || (action.kind === 'tool' && sidebar.view.world.outcome)) return;
      this.close();
      sidebar.show(action.kind === 'panel' ? action.value : 'rooms');
      if (action.kind === 'tool') sidebar.selection.setTool(action.value);
    };
    this.announcer.className = 'sr-only';
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    sidebar.root.append(this.rail, this.card, this.announcer);
    for (const element of [this.rail, this.card]) {
      element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.selected) {
          e.preventDefault();
          e.stopPropagation();
          this.close(true);
        }
      });
    }
  }
  private close(returnFocus = false) {
    const selected = this.selected;
    this.selected = undefined;
    this.card.hidden = true;
    if (returnFocus && selected)
      (
        this.buttons.get(selected.id)?.querySelector('button') ??
        this.rail.querySelector<HTMLButtonElement>('#notification-history')
      )?.focus();
    this.syncSelection();
  }
  private open(report: Notification) {
    if (this.selected?.id === report.id) {
      this.close();
      return;
    }
    this.selected = report;
    report.read = true;
    this.renderCard();
    this.syncSelection();
  }
  private dismiss(report: Notification) {
    const focused =
      this.buttons.get(report.id)?.contains(document.activeElement) ||
      this.card.contains(document.activeElement);
    dismissNotification(this.sidebar.view.world, report.id);
    if (this.selected?.id === report.id) this.close();
    this.update();
    if (focused)
      (this.list.querySelector<HTMLButtonElement>('.notification-open') ??
        this.rail.querySelector<HTMLButtonElement>('#notification-history'))!.focus();
  }
  private syncSelection() {
    const reports = activeNotifications(this.sidebar.view.world);
    for (const [id, entry] of this.buttons) {
      entry
        .querySelector('.notification-open')!
        .setAttribute('aria-expanded', String(this.selected?.id === id));
      entry.classList.toggle('selected', this.selected?.id === id);
      entry.classList.toggle('unread', !reports.find((n) => n.id === id)?.read);
    }
  }
  private renderCard() {
    const report = this.selected;
    if (!report) return;
    const w = this.sidebar.view.world;
    this.card.hidden = false;
    this.card.dataset.key = report.key;
    this.card.dataset.priority = report.priority;
    const icon = this.card.querySelector<HTMLElement>('.notification-card-icon')!;
    if (icon.dataset.icon !== report.icon) {
      icon.dataset.icon = report.icon;
      icon.innerHTML = actionIcon(report.icon);
    }
    this.card.querySelector('#notification-category')!.textContent =
      `${report.category} · ${report.priority === 'danger' ? 'Urgent' : report.priority === 'warning' ? 'Attention' : 'Information'}${!report.active ? ' · Archived' : report.dismissed ? ' · Dismissed' : ''}`;
    this.card.querySelector('#notification-title')!.textContent = report.title;
    this.card.querySelector('#notification-text')!.textContent = report.message;
    const available = report.sources?.some((s) => notificationLocation(w, s));
    const locate = this.card.querySelector<HTMLButtonElement>('#notification-locate')!;
    locate.hidden = report.sources === undefined;
    locate.textContent = report.locateLabel ?? 'Go to source';
    locate.disabled = !available;
    const status = this.card.querySelector<HTMLElement>('#notification-source-status')!;
    status.hidden = report.sources === undefined || !!available;
    status.textContent = report.sources?.length
      ? 'Source is no longer available or visible.'
      : 'Source location has not been discovered.';
    const action = this.card.querySelector<HTMLButtonElement>('#notification-action')!;
    action.hidden = !report.action;
    action.textContent = report.action?.label ?? '';
    action.disabled = !!w.outcome && report.action?.kind === 'tool';
    this.card.querySelector<HTMLButtonElement>('#notification-dismiss')!.hidden =
      !report.active || report.dismissed;
  }
  update() {
    const w = this.sidebar.view.world;
    if (w !== this.world) {
      this.world = w;
      this.close();
      this.buttons.clear();
      this.list.replaceChildren();
      this.announced = 0;
    }
    refreshNotifications(w);
    const reports = activeNotifications(w),
      ids = new Set(reports.map((n) => n.id));
    for (const [id, entry] of this.buttons)
      if (!ids.has(id)) {
        entry.remove();
        this.buttons.delete(id);
      }
    for (const report of reports) {
      let entry = this.buttons.get(report.id);
      if (!entry) {
        entry = document.createElement('div');
        entry.className = 'notification-entry';
        entry.dataset.key = report.key;
        const open = document.createElement('button');
        open.className = 'notification-open';
        open.innerHTML = `${actionIcon(report.icon)}<span class="notification-priority" aria-hidden="true"></span>`;
        open.setAttribute('aria-controls', this.card.id);
        open.onclick = () => this.open(report);
        open.oncontextmenu = (e) => {
          e.preventDefault();
          this.dismiss(report);
        };
        open.onkeydown = (e) => {
          if (e.key === 'Delete') {
            e.preventDefault();
            this.dismiss(report);
          }
        };
        const dismiss = document.createElement('button');
        dismiss.className = 'notification-remove';
        dismiss.textContent = '×';
        dismiss.onclick = () => this.dismiss(report);
        entry.append(open, dismiss);
        this.buttons.set(report.id, entry);
      }
      entry.dataset.priority = report.priority;
      const open = entry.querySelector<HTMLButtonElement>('.notification-open')!;
      if (open.dataset.icon !== report.icon) {
        open.dataset.icon = report.icon;
        open.querySelector('.action-icon')?.remove();
        open.insertAdjacentHTML('afterbegin', actionIcon(report.icon));
      }
      open.title = `${report.title} · ${report.priority === 'danger' ? 'Urgent' : report.category}. Click for details; right-click or Delete to dismiss.`;
      open.setAttribute('aria-label', report.title);
      entry.querySelector('.notification-priority')!.textContent =
        report.priority === 'danger' ? '!' : report.priority === 'warning' ? '·' : '+';
      entry.querySelector('.notification-remove')!.setAttribute('aria-label', `Dismiss ${report.title}`);
    }
    // Preserve elements: live updates must not restart animation or lose focus.
    reports.forEach((report, index) => {
      const entry = this.buttons.get(report.id)!;
      if (this.list.children[index] !== entry)
        this.list.insertBefore(entry, this.list.children[index] ?? null);
    });
    const fresh = reports.filter((n) => n.id > this.announced),
      history = notificationHistory(w);
    this.announced = Math.max(this.announced, ...history.map((n) => n.id));
    if (fresh.length) this.announcer.textContent = fresh.map((n) => n.title).join('. ');
    if (fresh.some((n) => n.priority === 'danger') && !this.rail.contains(document.activeElement))
      this.list.scrollTop = 0;
    if (this.selected && !this.selected.active && !history.includes(this.selected)) this.close();
    this.syncSelection();
    this.renderCard();
    const list = this.sidebar.panel.querySelector<HTMLElement>('#message-history');
    if (list) {
      const signature = JSON.stringify(history.map((n) => [n.id, n.title, n.active, n.dismissed]));
      if (list.dataset.reports !== signature) {
        list.dataset.reports = signature;
        list.replaceChildren();
        if (!history.length) list.textContent = 'No reports in this area yet.';
        for (const report of history) {
          const button = document.createElement('button');
          button.className = 'history-report';
          button.dataset.key = report.key;
          const title = document.createElement('strong');
          title.textContent = report.title;
          const detail = document.createElement('small'),
            seconds = Math.floor(report.at);
          detail.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${report.category} · ${report.dismissed ? 'Dismissed' : report.active ? 'Active' : 'Archived'}`;
          button.append(title, detail);
          button.onclick = () => this.open(report);
          list.append(button);
        }
      }
    }
  }
  mountHistory(panel: HTMLElement) {
    const section = document.createElement('details');
    section.className = 'production';
    section.open = true;
    section.innerHTML = '<summary>Notification history</summary><div id="message-history"></div>';
    panel.append(section);
    const objective = document.createElement('button');
    objective.className = 'wide';
    objective.textContent = 'View Hearth objective';
    objective.onclick = () => this.sidebar.show('hearth');
    panel.prepend(objective);
  }
}
