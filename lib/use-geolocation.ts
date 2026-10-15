'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentLocation, getGeolocationError, type UserLocation } from '@/lib/geo';

export type LocationStatus = 'idle' | 'granted' | 'denied';

/** Ultima posizione accettata, per non richiederla a ogni apertura */
const CACHE_KEY = 'cityalert:last-location';

function readCachedLocation(): UserLocation | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw) as UserLocation;
    return typeof loc.latitude === 'number' && typeof loc.longitude === 'number' ? loc : null;
  } catch {
    return null;
  }
}

function writeCachedLocation(loc: UserLocation | null) {
  try {
    if (loc) window.localStorage.setItem(CACHE_KEY, JSON.stringify(loc));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // storage non disponibile (navigazione privata): si richiede la posizione come prima
  }
}

export function useGeolocation() {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [promptDismissed, setPromptDismissed] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const setLocation = useCallback((loc: UserLocation) => {
    setLocationState(loc);
    writeCachedLocation(loc);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current != null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
        setStatus('granted');
      },
      (positionError) => {
        setError(getGeolocationError(positionError.code));
        if (positionError.code === 1) {
          setStatus('denied');
          writeCachedLocation(null);
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }, [setLocation]);

  const requestAccess = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    setError(null);

    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setStatus('granted');
      setPromptDismissed(true);
      startWatching();
      return loc;
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? Number((err as GeolocationPositionError).code) : 0;
      setError(getGeolocationError(code));
      if (code === 1) {
        setStatus('denied');
        writeCachedLocation(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLocation, startWatching]);

  const getFreshLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    setError(null);

    try {
      const loc = await getCurrentLocation(true);
      setLocation(loc);
      setStatus('granted');
      return loc;
    } catch (err) {
      if (location) return location;
      const code =
        typeof err === 'object' && err && 'code' in err
          ? Number((err as GeolocationPositionError).code)
          : 0;
      setError(getGeolocationError(code));
      if (code === 1) {
        setStatus('denied');
        writeCachedLocation(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [location, setLocation]);

  // Posizione già accettata in passato: riparte dalla cache senza rimostrare la richiesta
  useEffect(() => {
    const cached = readCachedLocation();
    if (!cached) return;
    setLocationState(cached);
    setStatus('granted');
    setPromptDismissed(true);

    let cancelled = false;
    const resume = () => {
      if (!cancelled) startWatching();
    };
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (cancelled) return;
          if (perm.state === 'denied') {
            writeCachedLocation(null);
            setLocationState(null);
            setStatus('denied');
          } else if (perm.state === 'granted') {
            resume();
          }
        })
        .catch(resume);
    } else {
      resume();
    }
    return () => {
      cancelled = true;
    };
  }, [startWatching]);

  useEffect(() => () => stopWatching(), [stopWatching]);

  return {
    location,
    error,
    loading,
    status,
    promptDismissed,
    dismissPrompt: () => setPromptDismissed(true),
    requestAccess,
    getFreshLocation,
    hasLocation: location != null,
    needsPrompt: status === 'idle' && !promptDismissed,
  };
}
