import type { World } from '../game/types.ts';
import { encounterSummary } from '../game/encounters.ts';
import { moraleAlerts } from '../game/morale.ts';
import { dormitoryFullMessage } from '../game/recruitment.ts';
import { alive, visible } from '../game/spell-effects.ts';
import {
  notificationSettings,
  syncNotifications,
  type NotificationInput,
  type NotificationSource,
} from '../game/notifications.ts';

/** Add a collector here to introduce a condition, with no UI changes. */
export const notificationSources: Array<{ id: string; collect: (w: World) => NotificationInput[] }> = [
  {
    id: 'hearth',
    collect: (w) =>
      w.hearthState?.hitAt !== undefined &&
      w.elapsed - w.hearthState.hitAt < notificationSettings.hearthQuietSeconds
        ? [
            {
              key: 'hearth',
              category: 'Hearth',
              icon: 'notification-hearth',
              title: 'Hearth under attack',
              priority: 'danger',
              message: `The Stone Hearth is under attack. ${Math.ceil(w.hearthState.health)} / ${w.hearthState.maxHealth} health. Defend the heart of your stronghold.`,
              sources: [{ kind: 'point', point: { ...w.hearth } }],
              locateLabel: 'Go to Hearthstone',
            },
          ]
        : [],
  },
  {
    id: 'combat',
    collect: (w) => {
      const recent = (at?: number) =>
        at !== undefined && w.elapsed - at < notificationSettings.combatQuietSeconds;
      const sources: NotificationSource[] = (w.enemies ?? [])
        .filter(
          (e) => e.health > 0 && visible(w, e) && (recent(e.attackedAt) || (e.hitAt > 0 && recent(e.hitAt))),
        )
        .map((e) => ({ kind: 'enemy', id: e.id }));
      for (const a of w.agents) if (alive(a) && recent(a.hitAt)) sources.push({ kind: 'resident', id: a.id });
      for (const a of w.security?.alerts ?? [])
        if (a.id.startsWith('door:') && recent(a.at))
          sources.push({ kind: 'point', point: { x: a.x, z: a.z } });
      return sources.length
        ? [
            {
              key: 'combat',
              category: 'Combat',
              icon: 'notification-combat',
              title: 'Fighting in the tunnels',
              priority: 'danger',
              message:
                'Your stronghold is in combat. Go to the fighting to inspect the threat and bring support.',
              sources,
              locateLabel: 'Go to fight',
            },
          ]
        : [];
    },
  },
  {
    id: 'encounters',
    collect: (w) =>
      encounterSummary(w)
        .filter((r) => ['warning', 'active', 'cleared'].includes(r.phase))
        .map((r) => {
          const source = w.encounters!.find((s) => s.definition.id === r.id)!;
          return {
            key: `encounter:${r.id}`,
            episode: `${r.phase}:${r.waves}`,
            category: 'Threat',
            icon: 'notification-threat',
            title: r.phase === 'cleared' ? `${r.name} cleared` : r.name,
            message: `${r.status}${r.visibleEnemies ? ` ${r.visibleEnemies} visible enemies.` : ''}`,
            priority: r.phase === 'cleared' ? 'info' : 'warning',
            sources: source.discovered
              ? source.definition.positions.map((point) => ({ kind: 'point', point: { ...point } }))
              : [],
            locateLabel: 'Go to threat source',
            action: { kind: 'panel', value: 'defenses', label: 'Open defenses' },
          };
        }),
  },
  {
    id: 'needs',
    collect: (w) =>
      moraleAlerts(w).map((r) => ({
        key: `need:${r.id}`,
        episode: r.severity,
        category: 'Need',
        icon: { food: 'kitchen', accommodation: 'dormitory', pay: 'treasure', facility: 'workshop' }[r.id],
        title: r.title,
        message: `${r.count} resident${r.count === 1 ? '' : 's'} ${r.severity === 'leaving' ? 'leaving' : 'unhappy'}. ${r.message}`,
        priority: r.severity === 'leaving' ? 'danger' : 'warning',
        sources: r.residentIds.map((id) => ({ kind: 'resident', id })),
        locateLabel: 'Go to resident',
        action: { kind: 'panel', value: 'dwarfs', label: 'View workforce' },
      })),
  },
  {
    id: 'dormitory',
    collect: (w) =>
      w.recruitment?.enabled && w.recruitment.dormitoryFull
        ? [
            {
              key: 'dormitory',
              episode: w.recruitment.fullEpisode,
              category: 'Arrival',
              icon: 'dormitory',
              title: 'Dormitory is full',
              message: dormitoryFullMessage,
              priority: 'warning',
              sources: w.roomServices
                .filter((s) => s.service === 'rest')
                .map((s) => ({ kind: 'point', point: { x: s.x, z: s.z } })),
              locateLabel: 'Go to Dormitory',
              action: { kind: 'tool', value: 'dormitory', label: 'Build Dormitory' },
            },
          ]
        : [],
  },
];
export function refreshNotifications(w: World) {
  syncNotifications(w, w.outcome ? [] : notificationSources.flatMap((source) => source.collect(w)));
}
