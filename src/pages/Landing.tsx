import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🏛️', en: 'Apply for Schemes', te: 'పథకాలకు దరఖాస్తు' },
  { icon: '✅', en: 'Check Eligibility', te: 'అర్హత తనిఖీ' },
  { icon: '🔍', en: 'Track Certificate', te: 'సర్టిఫికేట్ ట్రాక్' },
  { icon: '📍', en: 'Nearest Center', te: 'సమీప కేంద్రం' },
  { icon: '🤖', en: 'AI Assistant', te: 'AI సహాయకుడు' },
  { icon: '📄', en: 'Document Checklist', te: 'పత్రాల చెక్‌లిస్ట్' },
];

const STEPS = [
  { en: 'Create Account', te: 'ఖాతా సృష్టించండి', desc: 'Sign up with your email' },
  { en: 'Check Eligibility', te: 'అర్హత తనిఖీ', desc: 'Find schemes you qualify for' },
  { en: 'Apply From Home', te: 'ఇంటి నుండి దరఖాస్తు', desc: 'No office visit needed' },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] px-6 py-10 text-center">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #f97316 0 12px, #fdba74 12px 24px)' }}
        />
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ap-orange text-lg font-bold text-white">
          AP
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-white">SachiSeva</h1>
        <p className="lang-te text-xl font-semibold text-ap-orange">సచిసేవ</p>
        <p className="mt-4 max-w-[320px] text-base text-white/90">
          Access AP Government Services from home. No more waiting in queues.
        </p>
        <p className="lang-te mt-1 max-w-[320px] text-sm text-white/70">
          ఇంటి నుండే ప్రభుత్వ సేవలు పొందండి. క్యూలో నిరీక్షించడం అక్కర్లేదు.
        </p>
        <div className="mt-7 flex w-full max-w-[320px] flex-col gap-3">
          <Link
            to="/signup"
            className="flex h-12 items-center justify-center rounded-full bg-ap-orange text-base font-bold text-white hover:bg-ap-orangeDark"
          >
            Get Started / ప్రారంభించండి
          </Link>
          <Link
            to="/login"
            className="flex h-12 items-center justify-center rounded-full border border-white/80 text-base font-semibold text-white hover:bg-white/10"
          >
            Login / లాగిన్
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/70">For Visakhapatnam Citizens / విశాఖపట్నం పౌరుల కోసం</p>
      </section>

      {/* Features */}
      <section className="bg-white px-5 py-10">
        <h2 className="text-center text-[22px] font-bold text-ap-blue">What We Offer / మేము అందించేది</h2>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <article key={f.en} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-ap-blue/10">
              <div className="text-[32px] leading-none">{f.icon}</div>
              <h3 className="mt-2 text-sm font-bold text-ap-blue">{f.en}</h3>
              <p className="lang-te text-xs text-gray-500">{f.te}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#eff6ff] px-5 py-10">
        <h2 className="text-center text-[22px] font-bold text-ap-blue">How It Works / ఎలా పని చేస్తుంది</h2>
        <ol className="mx-auto mt-6 flex max-w-2xl flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.en} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ap-orange text-base font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-ap-blue">{s.en}</h3>
                <p className="lang-te text-xs text-ap-orangeDark">{s.te}</p>
                <p className="mt-1 text-xs text-gray-600">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* About */}
      <section className="bg-white px-5 py-10 text-center">
        <p className="mx-auto max-w-2xl text-sm text-gray-700">
          SachiSeva is a community service project for Visakhapatnam citizens to access AP government
          services without unnecessary office visits.
        </p>
        <p className="lang-te mx-auto mt-2 max-w-2xl text-xs text-gray-500">
          SachiSeva విశాఖపట్నం పౌరులకు అనవసర కార్యాలయ సందర్శనలు లేకుండా AP ప్రభుత్వ సేవలు అందించే
          కమ్యూనిటీ సేవా ప్రాజెక్ట్.
        </p>
        <Link
          to="/signup"
          className="mx-auto mt-6 flex h-12 w-full max-w-[320px] items-center justify-center rounded-full bg-ap-orange text-base font-bold text-white hover:bg-ap-orangeDark"
        >
          Get Started / ప్రారంభించండి
        </Link>
      </section>

      <footer className="bg-[#1e3a8a] px-5 py-6 text-center text-white">
        <p className="text-sm font-bold">SachiSeva — <span className="lang-te">సచిసేవ</span></p>
        <p className="mt-1 text-xs text-white/70">
          Built for Visakhapatnam / <span className="lang-te">విశాఖపట్నం కోసం నిర్మించబడింది</span>
        </p>
      </footer>
    </div>
  );
}
