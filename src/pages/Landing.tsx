import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🏛️', en: 'Apply for Schemes', te: 'పథకాలకు దరఖాస్తు', desc: 'Apply for 15+ AP government schemes from home' },
  { icon: '📋', en: 'Check Eligibility', te: 'అర్హత తనిఖీ', desc: 'Instantly find out which schemes you qualify for' },
  { icon: '🔍', en: 'Track Certificate', te: 'సర్టిఫికేట్ ట్రాక్', desc: 'Check your certificate status using a token number' },
  { icon: '📍', en: 'Nearest Center', te: 'సమీప కేంద్రం', desc: 'Find nearest Sachivalayam and MeeSeva centers' },
  { icon: '🤖', en: 'AI Assistant', te: 'AI సహాయకుడు', desc: 'Get help in Telugu or English anytime' },
  { icon: '📄', en: 'Document Checklist', te: 'పత్రాల చెక్‌లిస్ట్', desc: 'Know exactly what documents you need' },
];

const STEPS = [
  { icon: '👤', en: 'Create Account', te: 'ఖాతా సృష్టించండి', desc: 'Sign up with your email in under a minute' },
  { icon: '✅', en: 'Check Eligibility', te: 'అర్హత తనిఖీ చేయండి', desc: 'Answer simple questions to find your schemes' },
  { icon: '📨', en: 'Apply From Home', te: 'ఇంటి నుండి దరఖాస్తు చేయండి', desc: 'Submit applications without visiting the office' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-ap-blue">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ap-orange bg-ap-blue text-sm font-bold text-white">
              AP
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-base font-bold text-white">SachiSeva</span>
              <span className="lang-te block text-[11px] text-ap-orange">సచిసేవ</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="flex min-h-11 items-center rounded-full bg-ap-orange px-3 text-[11px] font-semibold text-white hover:bg-ap-orangeDark sm:px-4 sm:text-sm"
            >
              Login / లాగిన్
            </Link>
            <Link
              to="/signup"
              className="flex min-h-11 items-center rounded-full border border-white/70 px-3 text-[11px] font-semibold text-white hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              Sign Up / నమోదు
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-ap-blue to-[#0b1f4d] px-4 pb-12 pt-10 text-center text-white">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, #f97316 0 12px, #fdba74 12px 24px)',
          }}
        />
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold leading-snug sm:text-4xl">
            Access Andhra Pradesh Government Services From Home
          </h1>
          <p className="lang-te mt-2 text-base font-semibold text-ap-orange sm:text-2xl">
            ఇంటి నుండే ఆంధ్రప్రదేశ్ ప్రభుత్వ సేవలు పొందండి
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/85">
            No more waiting in queues. Apply for schemes, track certificates, and find your nearest
            Sachivalayam — all in one place.
          </p>
          <p className="lang-te mx-auto mt-1 max-w-2xl text-xs text-white/70">
            క్యూలో నిరీక్షించడం అక్కర్లేదు. పథకాలకు దరఖాస్తు చేయండి, సర్టిఫికేట్లు ట్రాక్ చేయండి, సమీప
            సచివాలయం కనుగొనండి.
          </p>
          <Link
            to="/signup"
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-ap-orange px-8 text-base font-bold text-white shadow-lg hover:bg-ap-orangeDark"
          >
            Get Started / ప్రారంభించండి
          </Link>
          <p className="mt-3 text-xs text-white/75">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ap-orange hover:underline">
              Login
            </Link>{' '}
            <span className="lang-te">/ ఇప్పటికే ఖాతా ఉందా? లాగిన్</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-bold text-ap-blue sm:text-2xl">
            What SachiSeva Does For You
          </h2>
          <p className="lang-te mt-1 text-center text-sm text-ap-orangeDark">
            SachiSeva మీ కోసం ఏమి చేస్తుంది
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.en}
                className="rounded-2xl border border-ap-blue/10 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-2 text-sm font-bold text-ap-blue sm:text-base">{f.en}</h3>
                <p className="lang-te text-xs text-ap-orangeDark">{f.te}</p>
                <p className="mt-2 text-xs text-gray-600">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-bold text-ap-blue sm:text-2xl">How It Works</h2>
          <p className="lang-te mt-1 text-center text-sm text-ap-orangeDark">
            ఇది ఎలా పని చేస్తుంది
          </p>
          <ol className="mt-6 flex flex-col items-stretch gap-4 md:flex-row md:items-start">
            {STEPS.map((s, i) => (
              <li key={s.en} className="flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ap-orange text-lg font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-2xl md:mt-1">{s.icon}</div>
                  <h3 className="mt-1 text-sm font-bold text-ap-blue">{s.en}</h3>
                  <p className="lang-te text-xs text-ap-orangeDark">{s.te}</p>
                  <p className="mt-1 text-xs text-gray-600">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="hidden self-center text-2xl text-ap-orange md:block">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* About */}
      <section className="bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold text-ap-blue sm:text-2xl">About SachiSeva</h2>
          <p className="lang-te mt-1 text-sm text-ap-orangeDark">SachiSeva గురించి</p>
          <p className="mt-4 text-sm text-gray-700">
            SachiSeva is a community service project built to help citizens of Visakhapatnam access
            Andhra Pradesh government schemes and Sachivalayam services without unnecessary office
            visits. Built for the people of Vizag — in Telugu and English.
          </p>
          <p className="lang-te mt-2 text-xs text-gray-600">
            SachiSeva అనేది విశాఖపట్నం పౌరులు అనవసర కార్యాలయ సందర్శనలు లేకుండా ఆంధ్రప్రదేశ్ ప్రభుత్వ
            పథకాలు మరియు సచివాలయ సేవలను పొందడంలో సహాయపడేందుకు నిర్మించిన కమ్యూనిటీ సేవా ప్రాజెక్ట్.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="flex min-h-11 items-center justify-center rounded-full bg-ap-orange px-6 text-sm font-bold text-white hover:bg-ap-orangeDark"
            >
              Get Started / ప్రారంభించండి
            </Link>
            <Link
              to="/help"
              className="flex min-h-11 items-center justify-center rounded-full border border-ap-blue/30 px-6 text-sm font-semibold text-ap-blue hover:bg-ap-blue/5"
            >
              Learn More / మరింత తెలుసుకోండి
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b1f4d] px-4 py-8 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 text-center md:grid-cols-3 md:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ap-orange text-xs font-bold">
                AP
              </span>
              <span className="font-bold">SachiSeva</span>
            </div>
            <p className="mt-2 text-xs text-white/75">Official AP Sachivalayam Services Portal</p>
            <p className="lang-te text-xs text-white/60">అధికారిక AP సచివాలయ సేవల పోర్టల్</p>
          </div>
          <nav className="flex items-center justify-center gap-4 text-sm">
            <Link to="/help" className="hover:text-ap-orange">Help</Link>
            <Link to="/help" className="hover:text-ap-orange">Contact</Link>
            <Link to="/help" className="hover:text-ap-orange">About</Link>
          </nav>
          <div className="md:text-right">
            <p className="text-xs text-white/75">Built for Visakhapatnam Citizens</p>
            <p className="lang-te text-xs text-white/60">విశాఖపట్నం పౌరుల కోసం నిర్మించబడింది</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
