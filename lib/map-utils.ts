import type { CivicReportRecord } from '@/types/civic';

export type PositionedReport = {
  report: CivicReportRecord;
  /** Offset in pixel dal punto geografico (per separare pin sovrapposti) */
  offset: [number, number];
};

const RING_SIZE = 8; // pin per anello
const RING_RADIUS = 30; // px

/**
 * Separa visivamente i pin che condividono (quasi) la stessa posizione:
 * i duplicati vengono disposti in cerchio attorno al punto reale,
 * così restano tutti visibili e cliccabili a qualsiasi zoom.
 */
export function spreadOverlappingReports(reports: CivicReportRecord[]): PositionedReport[] {
  const groups = new Map<string, CivicReportRecord[]>();

  for (const report of reports) {
    // ~1 m di tolleranza: stessa buca fotografata due volte = stesso gruppo
    const key = `${report.latitude.toFixed(5)},${report.longitude.toFixed(5)}`;
    const group = groups.get(key);
    if (group) group.push(report);
    else groups.set(key, [report]);
  }

  const positioned: PositionedReport[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      positioned.push({ report: group[0], offset: [0, 0] });
      continue;
    }

    group.forEach((report, i) => {
      const ring = Math.floor(i / RING_SIZE);
      const indexInRing = i % RING_SIZE;
      const perRing = Math.min(group.length - ring * RING_SIZE, RING_SIZE);
      const angle = (indexInRing / perRing) * Math.PI * 2 - Math.PI / 2;
      const radius = RING_RADIUS * (ring + 1);
      positioned.push({
        report,
        offset: [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)],
      });
    });
  }

  return positioned;
}
