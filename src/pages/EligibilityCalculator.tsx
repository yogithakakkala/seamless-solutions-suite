import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { getSchemesForCalculator } from '@/lib/offlineSchemes';
import {
  evaluateEligibility, relevantFields, schemeName,
  type EligibilityInput,
} from '@/lib/evaluateEligibility';
import type {
  Scheme, Caste, EducationLevel, PensionType, RationCardType, Occupation,
} from '@/types';
import ListenButton from '@/components/ListenButton';

const CASTE_OPTIONS: Caste[] = ['SC', 'ST', 'BC', 'OC', 'Minority', 'EWS', 'Disabled'];
const EDUCATION_OPTIONS: { value: EducationLevel; en: string; te: string }[] = [
  { value: 'below_ssc', en: 'Below SSC', te: 'SSC కంటే తక్కువ' },
  { value: 'ssc', en: 'SSC', te: 'SSC' },
  { value: 'intermediate', en: 'Intermediate', te: 'ఇంటర్మీడియట్' },
  { value: 'degree', en: 'Degree', te: 'డిగ్రీ' },
  { value: 'pg', en: 'Post Graduation', te: 'పోస్ట్ గ్రాడ్యుయేషన్' },
];
const PENSION_OPTIONS: { value: PensionType; en: string; te: string }[] = [
  { value: 'old_age', en: 'Old age', te: 'వృద్ధాప్యం' },
  { value: 'widow', en: 'Widow', te: 'వితంతువు' },
  { value: 'disabled', en: 'Disabled', te: 'దివ్యాంగుడు' },
  { value: 'weaver', en: 'Weaver', te: 'నేతన్న' },
  { value: 'fisherman', en: 'Fisherman', te: 'మత్స్యకారుడు' },
  { value: 'single_woman', en: 'Single woman', te: 'ఒంటరి మహిళ' },
];
const RATION_OPTIONS: { value: RationCardType; en: string; te: string }[] = [
  { value: 'white', en: 'White', te: 'తెల్ల' },
  { value: 'yellow', en: 'Yellow', te: 'పసుపు' },
  { value: 'pink', en: 'Pink', te: 'గులాబీ' },
  { value: 'none', en: 'None', te: 'లేదు' },
];
const OCCUPATION_OPTIONS: { value: Occupation; en: string; te: string }[] = [
  { value: 'toddy_tapper', en: 'Toddy tapper', te: 'కల్లు గీత కార్మికుడు' },
  { value: 'artisan', en: 'Artisan', te: 'హస్తకళాకారుడు' },
  { value: 'weaver', en: 'Weaver', te: 'నేతన్న' },
  { value: 'fisherman', en: 'Fisherman', te: 'మత్స్యకారుడు' },
  { value: 'other', en: 'Other', te: 'ఇతర' },
];

type YesNo = '' | 'yes' | 'no';
const yn = (v: YesNo): boolean | undefined => (v === '' ? undefined : v === 'yes');

interface Form {
  ap_resident: YesNo;
  gender: '' | 'male' | 'female';
  age: string;
  annual_income: string;
  monthly_income: string;
  govt_employee: YesNo;
  pucca_house: YesNo;
  pension_type: '' | PensionType;
  disability_pct: string;
  ration_card_type: '' | RationCardType;
  has_lpg: YesNo;
  caste: '' | Caste;
  education_level: '' | EducationLevel;
  registered_farmer: YesNo;
  registered_weaver: YesNo;
  income_tax_payer: YesNo;
  unemployed: YesNo;
  enrolled_other_scheme: YesNo;
  child_in_school: YesNo;
  foreign_admission: YesNo;
  occupation: '' | Occupation;
}

const emptyForm: Form = {
  ap_resident: '', gender: '', age: '', annual_income: '', monthly_income: '',
  govt_employee: '', pucca_house: '', pension_type: '', disability_pct: '',
  ration_card_type: '', has_lpg: '', caste: '', education_level: '',
  registered_farmer: '', registered_weaver: '', income_tax_payer: '',
  unemployed: '', enrolled_other_scheme: '', child_in_school: '',
  foreign_admission: '', occupation: '',
};

export default function EligibilityCalculator() {
  const { lang, t } = useLang();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [schemeId, setSchemeId] = useState('');
  const [form, setForm] = useState<Form>(emptyForm);
  const [result, setResult] = useState<ReturnType<typeof evaluateEligibility> | null>(null);

  useEffect(() => {
    getSchemesForCalculator().then(({ schemes }) => {
      const sorted = [...schemes].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
      setSchemes(sorted);
      if (sorted.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const wanted = params.get('scheme');
        setSchemeId(wanted && sorted.some((s) => s.id === wanted) ? wanted : sorted[0].id);
      }
    });
  }, []);

  const scheme = schemes.find((s) => s.id === schemeId);
  const fields = useMemo(
    () => (scheme ? relevantFields(scheme.eligibility_rules) : null),
    [scheme]
  );

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheme) return;
    const input: EligibilityInput = {
      ap_resident: yn(form.ap_resident),
      gender: form.gender || undefined,
      age: form.age ? Number(form.age) : undefined,
      annual_income: form.annual_income ? Number(form.annual_income) : undefined,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : undefined,
      govt_employee: yn(form.govt_employee),
      pucca_house: yn(form.pucca_house),
      pension_type: form.pension_type || undefined,
      disability_pct: form.disability_pct ? Number(form.disability_pct) : undefined,
      ration_card_type: form.ration_card_type || undefined,
      has_lpg: yn(form.has_lpg),
      caste: form.caste || undefined,
      education_level: form.education_level || undefined,
      registered_farmer: yn(form.registered_farmer),
      registered_weaver: yn(form.registered_weaver),
      income_tax_payer: yn(form.income_tax_payer),
      unemployed: yn(form.unemployed),
      enrolled_other_scheme: yn(form.enrolled_other_scheme),
      child_in_school: yn(form.child_in_school),
      foreign_admission: yn(form.foreign_admission),
      occupation: form.occupation || undefined,
    };
    setResult(evaluateEligibility(scheme, input, lang));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ap-blue">{t('eligibility')}</h1>
        {scheme && (
          <ListenButton
            text={
              lang === 'te'
                ? 'ఒక పథకాన్ని ఎంచుకుని, మీ వివరాలు నమోదు చేసి, అర్హతను తనిఖీ చేయవచ్చు.'
                : 'Choose a scheme, enter your details, and check eligibility.'
            }
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <Field label={lang === 'te' ? 'పథకాన్ని ఎంచుకోండి' : 'Select a scheme'}>
          <select
            value={schemeId}
            onChange={(e) => { setSchemeId(e.target.value); setResult(null); setForm(emptyForm); }}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon ? `${s.icon} ` : ''}{schemeName(s, lang)}
              </option>
            ))}
          </select>
        </Field>

        {scheme?.benefit && (
          <div className="rounded-lg bg-ap-orange/10 px-3 py-2 text-sm text-ap-orangeDark">
            <span className="font-semibold">
              {lang === 'te' ? 'ప్రయోజనం: ' : 'Benefit: '}
            </span>
            {lang === 'te' ? scheme.benefit_telugu : scheme.benefit}
          </div>
        )}

        {fields?.ap_resident && (
          <YesNoField label={lang === 'te' ? 'AP నివాసి?' : 'AP resident?'} value={form.ap_resident} onChange={(v) => set('ap_resident', v)} lang={lang} />
        )}

        {fields?.gender && (
          <Field label={lang === 'te' ? 'లింగం' : 'Gender'}>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value as Form['gender'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              <option value="female">{lang === 'te' ? 'మహిళ' : 'Female'}</option>
              <option value="male">{lang === 'te' ? 'పురుషుడు' : 'Male'}</option>
            </select>
          </Field>
        )}

        {fields?.pension_type && (
          <Field label={lang === 'te' ? 'పింఛన్ రకం' : 'Pension type'}>
            <select value={form.pension_type} onChange={(e) => set('pension_type', e.target.value as Form['pension_type'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              {PENSION_OPTIONS.filter((o) => scheme?.eligibility_rules.pension_types?.includes(o.value)).map((o) => (
                <option key={o.value} value={o.value}>{lang === 'te' ? o.te : o.en}</option>
              ))}
            </select>
          </Field>
        )}

        {(fields?.age || form.pension_type === 'old_age') && (
          <Field label={lang === 'te' ? 'వయస్సు' : 'Age'}>
            <input type="number" min={0} value={form.age} onChange={(e) => set('age', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required />
          </Field>
        )}

        {(fields?.disability_pct || form.pension_type === 'disabled') && (
          <Field label={lang === 'te' ? 'దివ్యాంగత్వం (%)' : 'Disability percentage (%)'}>
            <input type="number" min={0} max={100} value={form.disability_pct} onChange={(e) => set('disability_pct', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required />
          </Field>
        )}

        {fields?.monthly_income && (
          <Field label={lang === 'te' ? 'మాసిక ఆదాయం (₹)' : 'Monthly income (₹)'}>
            <input type="number" min={0} value={form.monthly_income} onChange={(e) => set('monthly_income', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required />
          </Field>
        )}

        {fields?.annual_income && (
          <Field label={lang === 'te' ? 'వార్షిక ఆదాయం (₹)' : 'Annual income (₹)'}>
            <input type="number" min={0} value={form.annual_income} onChange={(e) => set('annual_income', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required />
          </Field>
        )}

        {fields?.caste && (
          <Field label={lang === 'te' ? 'కుల వర్గం' : 'Caste category'}>
            <select value={form.caste} onChange={(e) => set('caste', e.target.value as Form['caste'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              {CASTE_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>
        )}

        {fields?.education_level && (
          <Field label={lang === 'te' ? 'విద్యార్హత' : 'Education level'}>
            <select value={form.education_level} onChange={(e) => set('education_level', e.target.value as Form['education_level'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              {EDUCATION_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{lang === 'te' ? o.te : o.en}</option>))}
            </select>
          </Field>
        )}

        {fields?.ration_card_type && (
          <Field label={lang === 'te' ? 'రేషన్ కార్డు రకం' : 'Ration card type'}>
            <select value={form.ration_card_type} onChange={(e) => set('ration_card_type', e.target.value as Form['ration_card_type'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              {RATION_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{lang === 'te' ? o.te : o.en}</option>))}
            </select>
          </Field>
        )}

        {fields?.occupation && (
          <Field label={lang === 'te' ? 'వృత్తి' : 'Occupation'}>
            <select value={form.occupation} onChange={(e) => set('occupation', e.target.value as Form['occupation'])} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" required>
              <option value="">--</option>
              {OCCUPATION_OPTIONS.filter((o) => scheme?.eligibility_rules.occupations?.includes(o.value)).map((o) => (
                <option key={o.value} value={o.value}>{lang === 'te' ? o.te : o.en}</option>
              ))}
            </select>
          </Field>
        )}

        {fields?.govt_employee && <YesNoField label={lang === 'te' ? 'ప్రభుత్వ ఉద్యోగా?' : 'Government employee?'} value={form.govt_employee} onChange={(v) => set('govt_employee', v)} lang={lang} />}
        {fields?.pucca_house && <YesNoField label={lang === 'te' ? 'పక్కా ఇల్లు ఉందా?' : 'Do you own a pucca house?'} value={form.pucca_house} onChange={(v) => set('pucca_house', v)} lang={lang} />}
        {fields?.has_lpg && <YesNoField label={lang === 'te' ? 'ఇప్పటికే LPG కనెక్షన్ ఉందా?' : 'Do you already have an LPG connection?'} value={form.has_lpg} onChange={(v) => set('has_lpg', v)} lang={lang} />}
        {fields?.registered_farmer && <YesNoField label={lang === 'te' ? 'నమోదైన రైతు?' : 'Registered farmer?'} value={form.registered_farmer} onChange={(v) => set('registered_farmer', v)} lang={lang} />}
        {fields?.registered_weaver && <YesNoField label={lang === 'te' ? 'నమోదైన నేతన్న?' : 'Registered weaver?'} value={form.registered_weaver} onChange={(v) => set('registered_weaver', v)} lang={lang} />}
        {fields?.income_tax_payer && <YesNoField label={lang === 'te' ? 'ఆదాయపు పన్ను చెల్లిస్తారా?' : 'Income tax payer?'} value={form.income_tax_payer} onChange={(v) => set('income_tax_payer', v)} lang={lang} />}
        {fields?.unemployed && <YesNoField label={lang === 'te' ? 'ప్రస్తుతం నిరుద్యోగా?' : 'Currently unemployed?'} value={form.unemployed} onChange={(v) => set('unemployed', v)} lang={lang} />}
        {fields?.enrolled_other_scheme && <YesNoField label={lang === 'te' ? 'మరో AP నగదు బదిలీ పథకంలో ఉన్నారా?' : 'Enrolled in another AP cash transfer scheme?'} value={form.enrolled_other_scheme} onChange={(v) => set('enrolled_other_scheme', v)} lang={lang} />}
        {fields?.child_in_school && <YesNoField label={lang === 'te' ? 'పాఠశాలలో చదువుతున్న పిల్లలు ఉన్నారా?' : 'Do you have a child enrolled in school?'} value={form.child_in_school} onChange={(v) => set('child_in_school', v)} lang={lang} />}
        {fields?.foreign_admission && <YesNoField label={lang === 'te' ? 'విదేశీ విశ్వవిద్యాలయ ప్రవేశం ఉందా?' : 'Do you have foreign university admission?'} value={form.foreign_admission} onChange={(v) => set('foreign_admission', v)} lang={lang} />}

        <button type="submit" className="w-full rounded-full bg-ap-orange py-2.5 font-semibold text-white hover:bg-ap-orangeDark">
          {lang === 'te' ? 'అర్హతను తనిఖీ చేయండి' : 'Check Eligibility'}
        </button>
      </form>

      {result && scheme && (
        <div className={`space-y-3 rounded-xl p-4 shadow-sm ${result.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold ${result.eligible ? 'text-green-700' : 'text-red-700'}`}>
              {result.eligible
                ? lang === 'te' ? `✓ మీరు ${schemeName(scheme, 'te')} కోసం అర్హులు` : `✓ You are ELIGIBLE for ${schemeName(scheme, 'en')}`
                : lang === 'te' ? `✗ అర్హులు కాదు: ${result.reason?.te}` : `✗ NOT ELIGIBLE: ${result.reason?.en}`}
            </p>
            <ListenButton text={result.eligible ? (lang === 'te' ? 'మీరు అర్హులు' : 'You are eligible') : (lang === 'te' ? result.reason?.te ?? '' : result.reason?.en ?? '')} />
          </div>
          {result.eligible && result.benefit && (
            <p className="text-sm font-medium text-green-800">
              {lang === 'te' ? 'ప్రయోజనం: ' : 'Benefit: '}
              {lang === 'te' ? result.benefit.te : result.benefit.en}
            </p>
          )}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-900">
            <p className="font-semibold">⚠️ గమనిక</p>
            <p className="lang-te">ఈ ఫలితం మార్గదర్శక సమాచారం మాత్రమే. అంతిమ అర్హత నిర్ణయం సచివాలయం అధికారులు చేస్తారు.</p>
            <p className="mt-1 font-semibold">⚠️ Note</p>
            <p>This result is indicative guidance only. Final eligibility is determined by Sachivalayam officials.</p>
          </div>
        </div>
      )}

      {scheme && (
        <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-ap-blue">
              {lang === 'te' ? 'అవసరమైన పత్రాలు' : 'Required Documents'}
            </p>
            <ListenButton text={scheme.required_documents.join(', ')} />
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
            {scheme.required_documents.map((doc) => (<li key={doc}>{doc}</li>))}
          </ul>
          <Link to="/nearest-center" className="mt-3 inline-block rounded-full bg-ap-blue/10 px-3 py-1.5 text-xs font-medium text-ap-blue hover:bg-ap-blue/20">
            {t('findNearestOffice')}
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ap-blue">{label}</label>
      {children}
    </div>
  );
}

function YesNoField({ label, value, onChange, lang }: { label: string; value: '' | 'yes' | 'no'; onChange: (v: '' | 'yes' | 'no') => void; lang: 'en' | 'te' }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        {(['yes', 'no'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${value === v ? 'border-ap-orange bg-ap-orange text-white' : 'border-gray-300 bg-white text-gray-700'}`}
          >
            {v === 'yes' ? (lang === 'te' ? 'అవును' : 'Yes') : (lang === 'te' ? 'కాదు' : 'No')}
          </button>
        ))}
      </div>
    </Field>
  );
}
