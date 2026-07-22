import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('meeseva_centers')
      .select('*')
      .then(({ data }) => {
        if (!cancelled && data) setCenters(data as unknown as MeesevaCenter[]);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { centers, loading };
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
