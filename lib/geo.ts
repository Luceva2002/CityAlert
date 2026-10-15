export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type GeoLocation = {
  placeName: string;
  address: string | null;
  city: string | null;
  country: string | null;
};

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 10000,
};

const GEO_FRESH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 0,
};

/** Ritorna la chiave i18n per l'errore GPS (tradotta in UI con t()) */
export function getGeolocationError(code: number): string {
  if (code === 1) return 'map.gps.error.denied';
  if (code === 2) return 'map.gps.error.unavailable';
  if (code === 3) return 'map.gps.error.timeout';
  return 'map.gps.error.generic';
}

function readPosition(position: GeolocationPosition): UserLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

export function getCurrentLocation(fresh = false): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation not supported'), { code: 0 }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(readPosition(position)),
      (error) => reject(error),
      fresh ? GEO_FRESH_OPTIONS : GEO_OPTIONS,
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi,address,neighborhood,locality,place&limit=1&access_token=${token}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const ctx: Record<string, string> = {};
    for (const c of feature.context ?? []) {
      const type = (c.id as string).split('.')[0];
      ctx[type] = c.text;
    }

    let address: string | null = null;
    if (feature.place_type?.includes('address')) {
      address = feature.address ? `${feature.text} ${feature.address}` : feature.text;
    } else if (feature.text) {
      address = feature.text;
    }

    return {
      placeName: feature.place_name ?? feature.text ?? '',
      address,
      city: ctx.place ?? ctx.locality ?? null,
      country: ctx.country ?? null,
    };
  } catch {
    return null;
  }
}
