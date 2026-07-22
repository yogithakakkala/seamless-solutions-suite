import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { coordinatesMapsUrl, officeMapsUrl } from '@/lib/googleMaps';
import { useMissingDocuments } from '@/hooks/useMissingDocuments';
import { useMeesevaCenters, findCentersForService } from '@/hooks/useMeesevaCenters';
import { useGeolocation } from '@/hooks/useGeolocation';
import LocationPermissionBanner from '@/components/LocationPermissionBanner';

export default function MissingDocumentsWarning({ requiredDocuments }: { requiredDocuments: string[] }) {
  const { lang } = useLang();
  const { status, loggedIn } = useMissingDocuments(requiredDocuments);
  const { centers } = useMeesevaCenters();
  const { loc, status: geoStatus, request: retryLocation } = useGeolocation(true);
  const missing = status.filter((s) => !s.present);

  if (!loggedIn || missing.length === 0) return null;

  return (
    <div className="space-y-3">
      <LocationPermissionBanner status={geoStatus} onRetry={retryLocation} />
      {missing.map((m) => {
        const matches = findCentersForService(centers, m.docType, loc, 3);
        return (
          <div
            key={m.docType}
            className="space-y-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm"
          >
            <p>
              {lang === 'te' ? 'మీకు లేదు: ' : "You're missing "}
              <strong>{m.docType}</strong>.
            </p>

            {matches.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-yellow-900">
                  {lang === 'te'
                    ? 'ఈ సేవను అందించే సమీప మీసేవ కేంద్రాలు:'
                    : 'Nearest MeeSeva centers offering this service:'}
                </p>
                {matches.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1 rounded-md border border-yellow-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ap-blue">
                        {lang === 'te' ? c.name_telugu : c.name}
                        {c.distanceKm != null && (
                          <span className="ml-2 rounded-full bg-ap-blue/10 px-2 py-0.5 text-[10px] font-medium">
                            {c.distanceKm.toFixed(1)} km
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-gray-500">{c.address}</p>
                      {c.phone && <p className="text-[11px] text-gray-500">{c.phone}</p>}
                    </div>
                    <a
                      href={coordinatesMapsUrl(c.latitude, c.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block whitespace-nowrap rounded-full bg-ap-orange px-3 py-1 text-[11px] font-medium text-white hover:bg-ap-orangeDark"
                    >
                      {lang === 'te' ? 'మ్యాప్స్' : 'Maps'}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">
                  {lang === 'te'
                    ? 'మీ సమీప తహసీల్దార్ లేదా మీసేవ కేంద్రాన్ని సందర్శించండి.'
                    : 'Visit your nearest Tahsildar Office or MeeSeva Center.'}
                </span>
                <div className="flex gap-2">
                  <a
                    href={officeMapsUrl(m.office.issuing_office_type)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block whitespace-nowrap rounded-full bg-ap-orange px-3 py-1.5 text-xs font-medium text-white hover:bg-ap-orangeDark"
                  >
                    {lang === 'te' ? 'గూగుల్ మ్యాప్స్' : 'Google Maps'}
                  </a>
                  <Link
                    to="/nearest-center"
                    className="inline-block whitespace-nowrap rounded-full border border-ap-blue bg-white px-3 py-1.5 text-xs font-medium text-ap-blue"
                  >
                    {lang === 'te' ? 'మీసేవ కేంద్రాలు' : 'MeeSeva Centers'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
