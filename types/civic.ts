/**
 * Categorie segnalazioni comunali.
 * `id` in inglese = valore salvato nel DB (check constraint in schema.sql).
 * Colori vividi ma leggibili su tema chiaro.
 */
export const CIVIC_CATEGORIES = [
  { id: 'Pothole', emoji: '🕳️', labelKey: 'civicReport.category.pothole', descKey: 'civicReport.category.pothole.desc', color: '#fa5252' },
  { id: 'Broken fountain', emoji: '⛲', labelKey: 'civicReport.category.fountain', descKey: 'civicReport.category.fountain.desc', color: '#339af0' },
  { id: 'Overgrown', emoji: '🌿', labelKey: 'civicReport.category.overgrown', descKey: 'civicReport.category.overgrown.desc', color: '#40c057' },
  { id: 'Fire', emoji: '🔥', labelKey: 'civicReport.category.fire', descKey: 'civicReport.category.fire.desc', color: '#ff922b' },
  { id: 'Streetlight out', emoji: '💡', labelKey: 'civicReport.category.streetlight', descKey: 'civicReport.category.streetlight.desc', color: '#f5b301' },
  { id: 'Illegal dumping', emoji: '🗑️', labelKey: 'civicReport.category.dumping', descKey: 'civicReport.category.dumping.desc', color: '#7950f2' },
  { id: 'Broken sidewalk', emoji: '🧱', labelKey: 'civicReport.category.sidewalk', descKey: 'civicReport.category.sidewalk.desc', color: '#f76707' },
  { id: 'Water leak', emoji: '💧', labelKey: 'civicReport.category.water', descKey: 'civicReport.category.water.desc', color: '#15aabf' },
  { id: 'Vandalism', emoji: '🎨', labelKey: 'civicReport.category.vandalism', descKey: 'civicReport.category.vandalism.desc', color: '#e64980' },
  { id: 'Other', emoji: '⚠️', labelKey: 'civicReport.category.other', descKey: 'civicReport.category.other.desc', color: '#868e96' },
] as const;

/** Categorie legacy ancora valide nel DB ma non proposte nel wizard */
const LEGACY_CATEGORY_META = [
  { id: 'Unmarked hazard', emoji: '🚧', labelKey: 'civicReport.category.hazard', descKey: 'civicReport.category.hazard.desc', color: '#fa5252' },
  { id: 'Blocked access', emoji: '♿', labelKey: 'civicReport.category.access', descKey: 'civicReport.category.access.desc', color: '#7950f2' },
] as const;

export type CivicCategory = (typeof CIVIC_CATEGORIES)[number]['id'];

export type CategoryMeta = {
  id: string;
  emoji: string;
  labelKey: string;
  descKey: string;
  color: string;
};

export function getCategoryMeta(categoryId: string): CategoryMeta {
  return (
    [...CIVIC_CATEGORIES, ...LEGACY_CATEGORY_META].find((c) => c.id === categoryId) ??
    CIVIC_CATEGORIES[CIVIC_CATEGORIES.length - 1]
  );
}

export const REPORT_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_META: Record<ReportStatus, { labelKey: string; color: string }> = {
  open: { labelKey: 'reportDetail.status.open', color: '#d97706' },
  in_progress: { labelKey: 'reportDetail.status.inProgress', color: '#0284c7' },
  resolved: { labelKey: 'reportDetail.status.resolved', color: '#059669' },
};

export interface GeoLocation {
  placeName: string;
  address: string | null;
  city: string | null;
  country: string | null;
}

export interface CivicReportRecord {
  id: string;
  category: string;
  description: string;
  address: string | null;
  city: string | null;
  photo_url: string | null;
  status: ReportStatus;
  rewarded: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
  is_mine?: boolean;
  /** Validazione della comunità */
  likes: number;
  dislikes: number;
  comments_count: number;
  /** 1 = like, -1 = dislike, 0/undefined = nessun voto */
  my_vote: number;
}

export interface ReportComment {
  id: string;
  body: string;
  created_at: string;
  author: string;
  is_mine: boolean;
}

/** Aggregati sociali restituiti dopo un voto */
export interface VoteSummary {
  likes: number;
  dislikes: number;
  my_vote: number;
}

export interface ReportReward {
  xp: number;
  coins: number;
  level: number;
  xpAwarded: number;
  coinsAwarded: number;
  leveledUp: boolean;
}

export interface UserProfile {
  email: string;
  displayName: string | null;
  xp: number;
  coins: number;
  level: number;
}

/** XP per passare dal livello N a N+1 */
export const XP_PER_LEVEL = 100;

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function levelProgress(xp: number): { current: number; target: number; pct: number } {
  const current = xp % XP_PER_LEVEL;
  return { current, target: XP_PER_LEVEL, pct: Math.min(100, (current / XP_PER_LEVEL) * 100) };
}
