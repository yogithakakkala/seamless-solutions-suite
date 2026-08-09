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
  {
    to: '/recommender',
    Icon: Sparkles,
    en: 'Find Schemes For Me',
    te: 'నాకు సరిపోయే పథకాలు కనుగొనండి',
    desc: {
      en: 'Answer 8 simple questions and see all schemes you qualify for instantly.',
      te: '8 సరళమైన ప్రశ్నలకు సమాధానం ఇవ్వండి, మీరు అర్హులైన అన్ని పథకాలను వెంటనే చూడండి.',
    },
    featured: true,
  },
  {
    to: '/eligibility',
    Icon: Calculator,
    en: 'Check Scheme Eligibility',
    te: 'పథక అర్హతను తనిఖీ చేయండి',
  },
  {
    to: '/track',
    Icon: BadgeCheck,
    en: 'Track My Application',
    te: 'నా దరఖాస్తును ట్రాక్ చేయండి',
  },
  {
    to: '/nearest-center',
    Icon: MapPin,
    en: 'Find Nearest Sachivalayam Center',
    te: 'సమీప సచివాలయ కేంద్రాన్ని కనుగొనండి',
  },
  {
    to: '/my-applications',
    Icon: FolderClock,
    en: 'My Applications',
    te: 'నా దరఖాస్తులు',
  },
  {
    to: '/documents',
    Icon: ClipboardList,
    en: 'Document Checklist',
    te: 'పత్రాల జాబితా',
  },
];

const steps = [
  { en: 'Check if you qualify using the Eligibility Calculator', te: 'అర్హత గణన ద్వారా మీరు అర్హులో లేదో చూడండి' },
  { en: 'See which documents you need, and where to get missing ones', te: 'మీకు ఏ పత్రాలు కావాలో, లేనివి ఎక్కడ పొందాలో చూడండి' },
  { en: 'Apply online for the scheme or service', te: 'పథకం లేదా సేవ కోసం ఆన్‌లైన్‌లో దరఖాస్తు చేయండి' },
  { en: 'Track your application status anytime with your application number', te: 'మీ దరఖాస్తు నంబర్‌తో ఎప్పుడైనా స్థితిని ట్రాక్ చేయండి' },
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

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map(({ to, Icon, en, te, featured, desc }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              featured ? 'border-ap-orange/40 bg-gradient-to-br from-ap-orange/10 to-white md:col-span-2' : 'border-ap-blue/10 bg-white'
            }`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${featured ? 'bg-ap-orange text-white' : 'bg-ap-orange/10 text-ap-orange'}`}>
              <Icon size={22} />
            </div>
            <span className="text-sm font-medium text-ap-blue">{lang === 'te' ? te : en}</span>
            {featured && desc && (
              <span className="text-xs text-gray-600">{lang === 'te' ? desc.te : desc.en}</span>
            )}
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
              <span className="text-sm text-gray-700">{lang === 'te' ? step.te : step.en}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
