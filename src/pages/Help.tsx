import { useLang } from '@/lib/i18n';
import ListenButton from '@/components/ListenButton';

const faqs = [
  {
    q: { en: 'What is a Sachivalayam?', te: 'సచివాలయం అంటే ఏమిటి?' },
    a: {
      en: 'A Grama/Ward Sachivalayam is a neighborhood-level government office in Andhra Pradesh that delivers welfare schemes and citizen services close to home.',
      te: 'గ్రామ/వార్డు సచివాలయం అనేది ఆంధ్రప్రదేశ్‌లో ఇంటికి దగ్గరగా సంక్షేమ పథకాలు మరియు పౌర సేవలను అందించే స్థానిక ప్రభుత్వ కార్యాలయం.',
    },
  },
  {
    q: { en: 'How do I check eligibility?', te: 'అర్హతను ఎలా తనిఖీ చేయాలి?' },
    a: {
      en: 'Open the Eligibility Calculator, pick a scheme, and enter your details. It works even without internet once you have used it once.',
      te: 'అర్హత గణనను తెరిచి, ఒక పథకాన్ని ఎంచుకుని, మీ వివరాలు నమోదు చేయండి. ఒకసారి ఉపయోగించిన తర్వాత ఇంటర్నెట్ లేకుండా కూడా పనిచేస్తుంది.',
    },
  },
  {
    q: { en: 'How do I track my certificate?', te: 'నా ధృవీకరణ పత్రాన్ని ఎలా ట్రాక్ చేయాలి?' },
    a: {
      en: 'Go to Certificate Tracker and enter the token number you were given when you requested it.',
      te: 'ధృవీకరణ పత్రం ట్రాకర్‌కు వెళ్లి, మీరు అభ్యర్థించినప్పుడు ఇచ్చిన టోకెన్ నంబర్ నమోదు చేయండి.',
    },
  },
  {
    q: { en: "What if I'm missing a document?", te: 'నా దగ్గర పత్రం లేకపోతే?' },
    a: {
      en: 'The Document Checklist and application form both show which office issues any missing document, plus a link to find the nearest one.',
      te: 'పత్రాల జాబితా మరియు దరఖాస్తు ఫారం రెండూ లేని పత్రాన్ని ఏ కార్యాలయం జారీ చేస్తుందో చూపిస్తాయి, సమీప కార్యాలయాన్ని కనుగొనే లింక్‌తో పాటు.',
    },
  },
  {
    q: { en: 'How do I contact staff directly?', te: 'సిబ్బందిని నేరుగా ఎలా సంప్రదించాలి?' },
    a: {
      en: 'Open any application under My Applications — there is a message thread where you can write to staff directly.',
      te: 'నా దరఖాస్తుల క్రింద ఏదైనా దరఖాస్తును తెరవండి — సిబ్బందికి నేరుగా వ్రాయగల సందేశ థ్రెడ్ ఉంది.',
    },
  },
];

export default function Help() {
  const { lang, t } = useLang();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">{t('help')}</h1>

      <ul className="space-y-3">
        {faqs.map((f, i) => (
          <li key={i} className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-ap-blue">{lang === 'te' ? f.q.te : f.q.en}</p>
              <ListenButton text={lang === 'te' ? f.a.te : f.a.en} />
            </div>
            <p className="mt-1 text-sm text-gray-600">{lang === 'te' ? f.a.te : f.a.en}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-ap-blue/5 p-4 text-sm text-gray-600">
        <p className="font-semibold text-ap-blue">
          {lang === 'te' ? 'ఈ ప్రాజెక్ట్ గురించి' : 'About This Project'}
        </p>
        <p className="mt-1">
          {lang === 'te'
            ? 'ఇది అనవసరమైన సచివాలయ సందర్శనలను తగ్గించడానికి నిర్మించిన ఒక కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్ ప్రోటోటైప్.'
            : 'This is a community service project prototype, built to reduce unnecessary in-person Sachivalayam visits.'}
        </p>
      </div>
    </div>
  );
}
