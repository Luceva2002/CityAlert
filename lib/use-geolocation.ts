'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentLocation, getGeolocationError, type UserLocation } from '@/lib/geo';

export type LocationStatus = 'idle' | 'granted' | 'denied';

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [promptDismissed, setPromptDismissed] = useState(false);
  const watchIdRef = useRef<number | null>(null);

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
        if (positionError.code === 1) setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }, []);

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
      if (code === 1) setStatus('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, [startWatching]);

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
      if (code === 1) setStatus('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, [location]);

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
