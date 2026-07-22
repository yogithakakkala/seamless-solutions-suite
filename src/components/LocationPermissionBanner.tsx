import { useState } from 'react';
import { ChevronDown, MapPin, RefreshCw } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { GeoStatus } from '@/hooks/useGeolocation';

/**
 * Reusable banner + expandable how-to used on Nearest Center and
 * Missing Documents to nudge users to enable browser location so
 * distance-sorted results actually work.
 */
export default function LocationPermissionBanner({
  status,
  onRetry,
}: {
  status: GeoStatus;
  onRetry: () => void;
}) {
  const { lang } = useLang();
  const [openHelp, setOpenHelp] = useState(false);

  if (status === 'granted' || status === 'idle') return null;

  const requesting = status === 'requesting';
  const unavailable = status === 'unavailable';

  return (
    <div className="rounded-xl border-2 border-ap-orange bg-ap-orange/10 p-4 shadow-sm">
      <p className="flex items-start gap-2 text-sm font-semibold text-ap-orangeDark">
        <MapPin size={18} className="mt-0.5 shrink-0" />
        <span>
          {unavailable
            ? lang === 'te'
              ? '📍 మీ బ్రౌజర్ స్థాన సేవలకు మద్దతు ఇవ్వదు. సమీప కేంద్రాలను క్రమబద్ధీకరించడానికి Chrome వంటి బ్రౌజర్ ఉపయోగించండి.'
              : '📍 Your browser does not support location. Use a modern browser like Chrome to see nearest-first results.'
            : lang === 'te'
              ? '📍 స్థాన అనుమతి ఇవ్వబడలేదు. సమీప కేంద్రాలను చూడాలంటే బ్రౌజర్‌లో లొకేషన్ యాక్సెస్ అనుమతించండి, ఆపై ఈ పేజీని రిఫ్రెష్ చేయండి.'
              : '📍 Location access was denied. To see nearest centers, please allow location access in your browser settings, then refresh this page.'}
        </span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={requesting}
          className="inline-flex items-center gap-1.5 rounded-full bg-ap-orange px-4 py-2 text-xs font-semibold text-white hover:bg-ap-orangeDark disabled:opacity-60"
        >
          <RefreshCw size={14} className={requesting ? 'animate-spin' : ''} />
          {requesting
            ? lang === 'te'
              ? 'కోరుతోంది...'
              : 'Requesting...'
            : lang === 'te'
              ? 'లొకేషన్ మళ్లీ ప్రయత్నించండి'
              : 'Retry Location Access'}
        </button>
        <button
          type="button"
          onClick={() => setOpenHelp((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ap-orange bg-white px-4 py-2 text-xs font-semibold text-ap-orangeDark"
        >
          <ChevronDown size={14} className={openHelp ? 'rotate-180' : ''} />
          {lang === 'te' ? 'లొకేషన్‌ను ఎలా ప్రారంభించాలి' : 'How to enable location'}
        </button>
      </div>

      {openHelp && (
        <div className="mt-3 space-y-3 rounded-lg bg-white p-3 text-xs text-gray-700">
          <div>
            <p className="mb-1 font-semibold text-ap-blue">
              {lang === 'te' ? 'Chrome మొబైల్‌లో' : 'Chrome on mobile'}
            </p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>{lang === 'te' ? 'అడ్రస్ బార్‌లోని లాక్ 🔒 ఐకాన్‌పై ట్యాప్ చేయండి' : 'Tap the lock 🔒 icon in the address bar'}</li>
              <li>{lang === 'te' ? 'Permissions → Location ఎంచుకోండి' : 'Choose Permissions → Location'}</li>
              <li>{lang === 'te' ? '"Allow" ఎంచుకోండి' : 'Select "Allow"'}</li>
              <li>{lang === 'te' ? 'ఈ పేజీని రిఫ్రెష్ చేసి "Retry" నొక్కండి' : 'Refresh this page or tap Retry above'}</li>
            </ol>
          </div>
          <div>
            <p className="mb-1 font-semibold text-ap-blue">
              {lang === 'te' ? 'Chrome డెస్క్‌టాప్‌లో' : 'Chrome on desktop'}
            </p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>{lang === 'te' ? 'అడ్రస్ బార్‌లోని లాక్ 🔒 ఐకాన్‌పై క్లిక్ చేయండి' : 'Click the lock 🔒 icon in the address bar'}</li>
              <li>{lang === 'te' ? 'Location → Allow సెట్ చేయండి' : 'Set Location → Allow'}</li>
              <li>{lang === 'te' ? 'పేజీని రిఫ్రెష్ చేసి "Retry" నొక్కండి' : 'Refresh the page or click Retry above'}</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
