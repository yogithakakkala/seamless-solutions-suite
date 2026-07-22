import { useLang } from '@/lib/i18n';

export default function SachiBot() {
  const { lang } = useLang();
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-ap-blue/10 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ap-blue">
        SachiBot <span className="lang-te text-base text-ap-orangeDark">/ సచీబాట్</span>
      </h1>
      <p className="text-sm text-gray-600">
        {lang === 'te'
          ? 'కుడి దిగువన ఉన్న చాట్ బబుల్ నొక్కి SachiBot తో ఇంగ్లీష్ లేదా తెలుగులో మాట్లాడండి. వాయిస్ ఇన్‌పుట్ మద్దతిస్తుంది.'
          : 'Tap the chat bubble in the bottom-right corner to talk with SachiBot in English or Telugu. Voice input is supported.'}
      </p>
      <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
        <li>{lang === 'te' ? 'పథకాల గురించి అడగండి' : 'Ask about welfare schemes'}</li>
        <li>{lang === 'te' ? 'అర్హత తనిఖీ చేయండి' : 'Check eligibility'}</li>
        <li>{lang === 'te' ? 'అవసరమైన పత్రాలు తెలుసుకోండి' : 'Find out required documents'}</li>
        <li>{lang === 'te' ? 'సమీప కేంద్రాలను కనుగొనండి' : 'Locate nearest centers'}</li>
      </ul>
    </div>
  );
}
