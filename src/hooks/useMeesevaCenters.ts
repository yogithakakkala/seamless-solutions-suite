import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { haversineDistanceKm } from '@/lib/haversine';
import type { MeesevaCenter } from '@/types';

/**
 * Fetches all MeeSeva centers once. Used by:
 *  - Nearest Center page (MeeSeva tab)
 *  - Missing Documents warning (find nearest centers offering a given service)
 */
export function useMeesevaCenters() {
  const [centers, setCenters] = useState<MeesevaCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('meeseva_centers').select('*').order('area');
    if (err) setError(err.message);
    else {
      setError(null);
      setCenters((data as unknown as MeesevaCenter[]) ?? []);
      setLastSynced(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { centers, loading, error, lastSynced, reload };
}

/** Returns the top-N MeeSeva centers offering a service, sorted by distance if userLoc known. */
export function findCentersForService(
  centers: MeesevaCenter[],
  service: string,
  userLoc: { lat: number; lng: number } | null,
  limit = 3,
): (MeesevaCenter & { distanceKm: number | null })[] {
  const matches = centers.filter((c) =>
    c.services.some((s) => s.toLowerCase() === service.toLowerCase()),
  );
  const withDist = matches.map((c) => ({
    ...c,
    distanceKm: userLoc ? haversineDistanceKm(userLoc.lat, userLoc.lng, c.latitude, c.longitude) : null,
  }));
  if (userLoc) withDist.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return withDist.slice(0, limit);
}
