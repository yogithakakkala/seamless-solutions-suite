import { useCallback, useEffect, useState } from 'react';

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function useGeolocation(autoRequest = true) {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return { loc, status, request };
}
