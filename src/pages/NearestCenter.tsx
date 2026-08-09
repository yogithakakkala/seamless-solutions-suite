import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLang } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CENTERS_SEED } from '@/data/centersSeed';
import { haversineDistanceKm, MAX_RADIUS_KM } from '@/lib/haversine';
import { coordinatesMapsUrl } from '@/lib/googleMaps';
import type { SachivalayamCenter, MeesevaCenter } from '@/types';
import ListenButton from '@/components/ListenButton';
import LocationPermissionBanner from '@/components/LocationPermissionBanner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMeesevaCenters } from '@/hooks/useMeesevaCenters';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const orangeMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet-color-markers@1.2.0/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Tab = 'sachivalayam' | 'meeseva';

export default function NearestCenter() {
  const { lang, t } = useLang();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('sachivalayam');
  const [sachCenters, setSachCenters] = useState<SachivalayamCenter[]>(CENTERS_SEED);
  const [sachSyncing, setSachSyncing] = useState(false);
  const [lessCrowdedOnly, setLessCrowdedOnly] = useState(searchParams.get('filter') === 'less');
  const {
    centers: meesevaCenters,
    loading: meesevaLoading,
    error: meesevaError,
    lastSynced: meesevaSynced,
    reload: reloadMeeseva,
  } = useMeesevaCenters();
  const { loc: userLoc, status: geoStatus, request: retryLocation } = useGeolocation(true);

  const loadSach = async () => {
    setSachSyncing(true);
    const { data } = await supabase.from('sachivalayam_centers').select('*');
    if (data && data.length > 0) setSachCenters(data as SachivalayamCenter[]);
    setSachSyncing(false);
  };

  const syncCenters = async () => {
    await Promise.all([loadSach(), reloadMeeseva()]);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const load = () => supabase.from('sachivalayam_centers').select('*').then(({ data }) => {
      if (data && data.length > 0) setSachCenters(data as SachivalayamCenter[]);
    });
    load();
    const ch = supabase.channel('centers-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sachivalayam_centers' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const rawList: (SachivalayamCenter | MeesevaCenter)[] =
    tab === 'sachivalayam' ? sachCenters : meesevaCenters;
  const isMeeseva = tab === 'meeseva';
  const icon = isMeeseva ? orangeMarkerIcon : markerIcon;

  const withDistance = rawList.map((c) => ({
    ...c,
    distanceKm: userLoc ? haversineDistanceKm(userLoc.lat, userLoc.lng, c.latitude, c.longitude) : null,
  }));

  let sorted = [...withDistance];
  if (userLoc) {
    sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    const inRange = sorted.filter((c) => (c.distanceKm ?? Infinity) <= MAX_RADIUS_KM);
    sorted = inRange.length > 0 ? inRange : sorted.slice(0, 3);
  }
  if (!isMeeseva && lessCrowdedOnly) {
    sorted = sorted.filter((c) => (c as SachivalayamCenter).busy_level !== 'busy');
  }

  const busyBadge = (level?: string | null) => {
    if (level === 'busy') return { emoji: '🔴', bg: 'bg-red-100 text-red-700', en: 'Very Busy', te: 'చాలా రద్దీ' };
    if (level === 'moderate') return { emoji: '🟡', bg: 'bg-yellow-100 text-yellow-800', en: 'Moderate', te: 'మధ్యస్థం' };
    return { emoji: '🟢', bg: 'bg-green-100 text-green-700', en: 'Less Crowded', te: 'తక్కువ రద్దీ' };
  };
  const staleBusy = (updated?: string | null) => {
    if (!updated) return false;
    return Date.now() - new Date(updated).getTime() > 8 * 3600 * 1000;
  };

  const mapCenter: [number, number] = userLoc
    ? [userLoc.lat, userLoc.lng]
    : rawList.length > 0
      ? [rawList[0].latitude, rawList[0].longitude]
      : [17.6868, 83.2185];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ap-blue">{t('nearestCenter')}</h1>
        <ListenButton
          text={
            lang === 'te'
              ? 'ఇది మీ సమీప కేంద్రాల జాబితా, సమీపమైనది మొదట చూపబడుతుంది.'
              : 'This is a list of your nearest centers, closest first.'
          }
        />
      </div>

      <LocationPermissionBanner status={geoStatus} onRetry={retryLocation} />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ap-blue/10 bg-white p-3 text-xs shadow-sm">
        <button
          onClick={syncCenters}
          disabled={sachSyncing || meesevaLoading}
          className="rounded-full bg-ap-blue px-3 py-1.5 font-semibold text-white disabled:opacity-60"
        >
          {sachSyncing || meesevaLoading
            ? lang === 'te' ? 'సింక్ అవుతోంది…' : 'Syncing…'
            : lang === 'te' ? '↻ కేంద్రాలను రిఫ్రెష్ చేయండి' : '↻ Sync & Refresh Centers'}
        </button>
        <span className="text-ap-blue/80">
          {lang === 'te' ? 'సచివాలయం' : 'Sachivalayam'}: <strong>{sachCenters.length}</strong>
          {' · '}
          {lang === 'te' ? 'మీసేవ' : 'MeeSeva'}: <strong>{meesevaCenters.length}</strong>
        </span>
        {meesevaSynced && (
          <span className="text-gray-400">
            {lang === 'te' ? 'చివరి సింక్' : 'Last synced'} {meesevaSynced.toLocaleTimeString()}
          </span>
        )}
        {meesevaError && <span className="text-red-600">{meesevaError}</span>}
        {!meesevaLoading && !meesevaError && meesevaCenters.length === 0 && (
          <span className="text-orange-600">
            {lang === 'te' ? 'మీసేవ కేంద్రాలు కనబడలేదు' : 'No MeeSeva centers found'}
          </span>
        )}
      </div>

      <div className="inline-flex rounded-full border border-ap-blue/20 bg-white p-1 text-xs font-semibold">
        <button
          onClick={() => setTab('sachivalayam')}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === 'sachivalayam' ? 'bg-ap-blue text-white' : 'text-ap-blue'
          }`}
        >
          {lang === 'te' ? 'సచివాలయ కేంద్రాలు' : 'Sachivalayam'}
        </button>
        <button
          onClick={() => setTab('meeseva')}
          className={`rounded-full px-4 py-1.5 transition ${
            tab === 'meeseva' ? 'bg-ap-orange text-white' : 'text-ap-blue'
          }`}
        >
          {lang === 'te' ? 'మీసేవ కేంద్రాలు' : 'MeeSeva'}
        </button>
      </div>

      {tab === 'sachivalayam' && (
        <label className="flex items-center gap-2 text-xs text-ap-blue">
          <input type="checkbox" checked={lessCrowdedOnly} onChange={(e) => setLessCrowdedOnly(e.target.checked)} />
          {lang === 'te' ? 'తక్కువ రద్దీ కేంద్రాలను మాత్రమే చూపించు' : 'Show Less Crowded Only'}
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="h-[300px] overflow-hidden rounded-xl border border-ap-blue/10 shadow-sm lg:col-span-3 lg:h-[500px]">
        <MapContainer
          key={tab + (userLoc ? '-loc' : '')}
          center={mapCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(isMeeseva ? rawList : (rawList as SachivalayamCenter[]).filter((c) => !lessCrowdedOnly || c.busy_level !== 'busy')).map((c) => (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icon}>
              <Popup>
                <p className="font-semibold">{lang === 'te' ? c.name_telugu : c.name}</p>
                <p className="text-xs">{c.address}</p>
                {c.phone && <p className="text-xs">{c.phone}</p>}
                {!isMeeseva && (() => {
                  const b = busyBadge((c as SachivalayamCenter).busy_level);
                  return <p className="mt-1 text-xs">{b.emoji} {lang === 'te' ? b.te : b.en}</p>;
                })()}
                <a
                  href={coordinatesMapsUrl(c.latitude, c.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-ap-orangeDark underline"
                >
                  {lang === 'te' ? 'గూగుల్ మ్యాప్స్‌లో తెరవండి' : 'Open in Google Maps'}
                </a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <ul className="space-y-2 lg:col-span-2 lg:max-h-[500px] lg:overflow-y-auto">
        {sorted.map((c, i) => (
          <li
            key={c.id}
            className={`rounded-xl border shadow-sm transition hover:shadow-md ${
              i === 0 && userLoc ? 'border-ap-orange bg-ap-orange/5' : 'border-ap-blue/10 bg-white'
            }`}
          >
            <a
              href={coordinatesMapsUrl(c.latitude, c.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ap-blue">{lang === 'te' ? c.name_telugu : c.name}</p>
                    {!isMeeseva && (() => {
                      const cc = c as SachivalayamCenter & { distanceKm?: number | null };
                      const b = busyBadge(cc.busy_level);
                      return (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.bg}`}>
                          {b.emoji} {lang === 'te' ? b.te : b.en}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500">
                    {c.area ? `${c.area} · ` : ''}
                    {c.address}
                  </p>
                  {!isMeeseva && (c as SachivalayamCenter).busy_note && (
                    <p className="mt-0.5 text-[11px] italic text-gray-600">"{(c as SachivalayamCenter).busy_note}"</p>
                  )}
                  {!isMeeseva && staleBusy((c as SachivalayamCenter).busy_updated_at) && (
                    <p className="text-[10px] text-gray-400">
                      {lang === 'te' ? 'రద్దీ సమాచారం పాతది' : 'Busy info may be outdated'}
                    </p>
                  )}
                  {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                  {isMeeseva && 'services' in c && c.services.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {c.services.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-ap-blue/10 px-2 py-0.5 text-[10px] font-medium text-ap-blue"
                        >
                          {s}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                {c.distanceKm != null && (
                  <span className="whitespace-nowrap rounded-full bg-ap-blue/10 px-2 py-1 text-xs font-semibold text-ap-blue">
                    {c.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>
              <span className="mt-2 inline-block rounded-full bg-ap-orange px-3 py-1 text-xs font-medium text-white">
                {lang === 'te' ? 'గూగుల్ మ్యాప్స్‌లో తెరవండి' : 'Open in Google Maps'}
              </span>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
