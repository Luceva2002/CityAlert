import { MAPBOX_TOKEN, MAP_STYLES } from '@/config/mapbox';

/** Placeholder chiaro mentre carica la thumbnail */
export const MAP_PLACEHOLDER = '#e9ebf0';

/**
 * Anteprima statica Mapbox per card profilo (lat/lng segnalazione), tema chiaro.
 * @see https://docs.mapbox.com/api/maps/static-images/
 */
export function reportStaticMapUrl(
  longitude: number,
  latitude: number,
  width = 240,
  height = 300,
  zoom = 15,
  withPin = true,
): string | null {
  if (!MAPBOX_TOKEN) return null;

  const pin = withPin ? `pin-s+f5b301(${longitude},${latitude})/` : '';
  const size = `${Math.round(width)}x${Math.round(height)}@2x`;
  const center = `${longitude},${latitude},${zoom},0,0`;

  return `https://api.mapbox.com/styles/v1/${MAP_STYLES.lightStatic}/static/${pin}${center}/${size}?access_token=${MAPBOX_TOKEN}`;
}
