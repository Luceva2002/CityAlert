/** Mapbox configuration */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  /** Edifici 3D e prospettiva — pin segnalazioni */
  standard3d: 'mapbox://styles/mapbox/standard',
  /** Static API per thumbnail (tema chiaro) */
  lightStatic: 'mapbox/streets-v12',
} as const;

/** Preset luce per lo stile standard — giorno, coerente col tema chiaro */
export const MAP_LIGHT_PRESET = 'day';

export type MapStyleKey = keyof typeof MAP_STYLES;

export const DEFAULT_CENTER = { longitude: 12.4833, latitude: 41.896 } as const;

export const ZOOM = {
  overview: 14.5,
  selected: 16.5,
} as const;
