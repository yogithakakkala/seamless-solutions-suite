import { useEffect, useState } from 'react';
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
  const [tab, setTab] = useState<Tab>('sachivalayam');
  const [sachCenters, setSachCenters] = useState<SachivalayamCenter[]>(CENTERS_SEED);
  const { centers: meesevaCenters } = useMeesevaCenters();
  const { loc: userLoc, status: geoStatus, request: retryLocation } = useGeolocation(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('sachivalayam_centers')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) setSachCenters(data as SachivalayamCenter[]);
      });
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

      <div className="h-72 overflow-hidden rounded-xl border border-ap-blue/10 shadow-sm">
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
          {rawList.map((c) => (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icon}>
              <Popup>
                <p className="font-semibold">{lang === 'te' ? c.name_telugu : c.name}</p>
                <p className="text-xs">{c.address}</p>
                {c.phone && <p className="text-xs">{c.phone}</p>}
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

      <ul className="space-y-2">
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
                  <p className="font-semibold text-ap-blue">
                    {lang === 'te' ? c.name_telugu : c.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.area ? `${c.area} · ` : ''}
                    {c.address}
                  </p>
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
  );
}
