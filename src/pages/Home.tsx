import { Link } from 'react-router-dom';
import { Calculator, BadgeCheck, MapPin, FolderClock, ClipboardList } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const cards = [
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(({ to, Icon, en, te }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ap-orange/10 text-ap-orange">
              <Icon size={22} />
            </div>
            <span className="text-sm font-medium text-ap-blue">{lang === 'te' ? te : en}</span>
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
