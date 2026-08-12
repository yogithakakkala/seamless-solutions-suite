import { Link } from 'react-router-dom';
import { Calculator, BadgeCheck, MapPin, FolderClock, ClipboardList, Sparkles, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useDrafts } from '@/hooks/useDrafts';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/lib/supabase';
import { haversineDistanceKm } from '@/lib/haversine';
import type { SachivalayamCenter } from '@/types';

const cards = [
  { to: '/recommender', Icon: Sparkles, en: 'Find Schemes For Me', te: 'నా పథకాలు కనుగొనండి' },
  { to: '/eligibility', Icon: Calculator, en: 'Check Scheme Eligibility', te: 'పథకం అర్హత తనిఖీ' },
  { to: '/track', Icon: BadgeCheck, en: 'Track My Application', te: 'దరఖాస్తు ట్రాక్' },
  { to: '/nearest-center', Icon: MapPin, en: 'Find Nearest Sachivalayam Center', te: 'సమీప సచివాలయం కనుగొనండి' },
  { to: '/my-applications', Icon: FolderClock, en: 'My Applications', te: 'నా దరఖాస్తులు' },
  { to: '/documents', Icon: ClipboardList, en: 'Document Checklist', te: 'పత్రాల చెక్‌లిస్ట్' },
];

const steps = [
  { en: 'Check eligibility', te: 'అర్హత తనిఖీ చేయండి' },
  { en: 'See documents needed', te: 'అవసరమైన పత్రాలు చూడండి' },
  { en: 'Apply online', te: 'ఆన్‌లైన్‌లో దరఖాస్తు చేయండి' },
  { en: 'Track your application', te: 'దరఖాస్తు ట్రాక్ చేయండి' },
];

export default function Home() {
  const { lang } = useLang();
  const { drafts } = useDrafts();
  const { loc } = useGeolocation(true);
  const [nearestBusy, setNearestBusy] = useState<SachivalayamCenter | null>(null);

  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    supabase.from('sachivalayam_centers').select('*').then(({ data }) => {
      if (cancelled || !data) return;
      const list = data as SachivalayamCenter[];
      if (!list.length) return;
      const nearest = list
        .map((c) => ({ c, d: haversineDistanceKm(loc.lat, loc.lng, c.latitude, c.longitude) }))
        .sort((a, b) => a.d - b.d)[0]?.c;
      setNearestBusy(nearest ?? null);
    });
    return () => { cancelled = true; };
  }, [loc]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-ap-blue to-ap-blueLight p-6 text-white">
        <h1 className="text-2xl font-bold">
          {lang === 'te' ? 'సచిసేవకు స్వాగతం' : 'Welcome to SachiSeva'}
        </h1>
        <p className="lang-te mt-1 text-white/90">
          {lang === 'te'
            ? 'ఆంధ్రప్రదేశ్ సచివాలయ సేవలను ఇంటి నుండే పొందండి'
            : 'Access Andhra Pradesh Sachivalayam services from home'}
        </p>
      </section>

      {drafts.length > 0 && (
        <Link to="/my-applications" className="block rounded-xl border-2 border-ap-orange/60 bg-orange-50 p-3 shadow-sm hover:bg-orange-100">
          <p className="text-sm font-semibold text-ap-orangeDark">
            📝 {lang === 'te'
              ? `మీకు ${drafts.length} అసంపూర్ణ దరఖాస్తులు ఉన్నాయి.`
              : `You have ${drafts.length} incomplete application${drafts.length > 1 ? 's' : ''}.`}
          </p>
          <p className="mt-0.5 text-xs text-ap-orangeDark/80">
            {lang === 'te' ? 'కొనసాగించండి →' : 'Resume →'}
          </p>
        </Link>
      )}

      {nearestBusy && nearestBusy.busy_level === 'busy' && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle size={16} />
            {lang === 'te'
              ? `మీ సమీప సచివాలయం (${nearestBusy.name_telugu || nearestBusy.name}) ప్రస్తుతం చాలా రద్దీగా ఉంది.`
              : `Your nearest Sachivalayam (${nearestBusy.name}) is currently very busy.`}
          </p>
          <Link to="/nearest-center?filter=less" className="mt-2 inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            {lang === 'te' ? 'తక్కువ రద్దీ కేంద్రం కనుగొనండి' : 'Find Less Crowded Center'}
          </Link>
        </div>
      )}

      {nearestBusy && nearestBusy.busy_level === 'moderate' && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 shadow-sm">
          {lang === 'te'
            ? `మీ సమీప సచివాలయంలో మధ్యస్థ రద్దీ ఉంది.`
            : `Your nearest Sachivalayam has a moderate queue right now.`}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3">
        {cards.map(({ to, Icon, en, te }) => (
          <Link
            key={to}
            to={to}
            className="flex h-full flex-col items-center justify-start gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ap-orange/10 text-ap-orange">
              <Icon size={22} />
            </div>
            <span className="text-sm font-medium text-ap-blue">{en}</span>
            <span className="lang-te text-xs text-gray-500">{te}</span>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ap-blue">
          {lang === 'te' ? 'సచిసేవ ఎలా పని చేస్తుంది' : 'How SachiSeva Works'}
        </h2>
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ap-blue text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700">
                {step.en} <span className="lang-te text-gray-500">/ {step.te}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl bg-[#eff6ff] p-4 text-center shadow-sm">
        <p className="text-sm font-semibold text-ap-blue">
          Need help? Talk to SachiBot <span className="lang-te text-ap-blue/70">/ సహాయం కావాలా? సచిబాట్‌తో మాట్లాడండి</span>
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('sachibot:open'))}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ap-orange px-5 text-sm font-semibold text-white hover:bg-ap-orangeDark"
        >
          Open SachiBot / సచిబాట్ తెరువు
        </button>
      </section>
    </div>
  );
}
