import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { SCHEMES_SEED } from '@/data/schemesSeed';
import { evaluateEligibility, schemeName, schemeBenefit, type EligibilityInput } from '@/lib/evaluateEligibility';
import type { Scheme, Caste, Gender } from '@/types';

const LS_KEY = 'sachi_recommender_v1';

type FormState = {
  age: string;
  annual_income: string;
  caste: Caste | '';
  gender: Gender | '';
  occupation: string;
  land_acres: string;
  child_in_school: boolean;
  construction_worker: boolean;
};

const emptyForm: FormState = {
  age: '', annual_income: '', caste: '', gender: '',
  occupation: '', land_acres: '0', child_in_school: false, construction_worker: false,
};

const CASTES: Caste[] = ['SC', 'ST', 'BC', 'OC', 'EWS', 'Minority'];
const OCCUPATIONS = [
  { v: 'farmer', en: 'Farmer', te: 'రైతు' },
  { v: 'construction', en: 'Construction Worker', te: 'నిర్మాణ కార్మికుడు' },
  { v: 'vendor', en: 'Street Vendor', te: 'వీధి వ్యాపారి' },
  { v: 'govt_employee', en: 'Government Employee', te: 'ప్రభుత్వ ఉద్యోగి' },
  { v: 'private', en: 'Private Employee', te: 'ప్రైవేట్ ఉద్యోగి' },
  { v: 'student', en: 'Student', te: 'విద్యార్థి' },
  { v: 'homemaker', en: 'Homemaker', te: 'గృహిణి' },
  { v: 'other', en: 'Other', te: 'ఇతర' },
];

function toInput(f: FormState): EligibilityInput {
  return {
    ap_resident: true,
    age: f.age ? Number(f.age) : undefined,
    annual_income: f.annual_income ? Number(f.annual_income) : undefined,
    monthly_income: f.annual_income ? Number(f.annual_income) / 12 : undefined,
    caste: (f.caste || undefined) as Caste | undefined,
    gender: (f.gender || undefined) as Gender | undefined,
    govt_employee: f.occupation === 'govt_employee',
    registered_farmer: f.occupation === 'farmer',
    child_in_school: f.child_in_school,
  };
}

export default function SchemeRecommender() {
  const { lang } = useLang();
  const [form, setForm] = useState<FormState>(() => {
    try { const s = localStorage.getItem(LS_KEY); if (s) return { ...emptyForm, ...JSON.parse(s) }; } catch { /* ignore */ }
    return emptyForm;
  });
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES_SEED);
  const [showResults, setShowResults] = useState(false);
  const [notEligibleOpen, setNotEligibleOpen] = useState(false);

  useEffect(() => {
    supabase.from('schemes').select('*').then(({ data }) => {
      if (data && data.length > 0) setSchemes(data as Scheme[]);
    });
  }, []);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(form)); } catch { /* ignore */ } }, [form]);

  const results = useMemo(() => {
    const input = toInput(form);
    const evals = schemes.map((s) => ({ scheme: s, result: evaluateEligibility(s, input, lang) }));
    const eligible = evals.filter((e) => e.result.eligible);
    const notEligible = evals.filter((e) => !e.result.eligible);

    // Almost: schemes failing on income by <= 20% margin
    const almost: typeof notEligible = [];
    const strictly: typeof notEligible = [];
    for (const e of notEligible) {
      const rules = e.scheme.eligibility_rules;
      const maxInc = rules.max_annual_income ?? rules.max_income;
      const inc = input.annual_income;
      if (maxInc && inc && inc > maxInc && inc <= maxInc * 1.2) {
        const diff = inc - maxInc;
        almost.push({
          ...e,
          result: {
            eligible: false,
            reason: {
              en: `Your income exceeds the limit by ₹${diff.toLocaleString('en-IN')}`,
              te: `మీ ఆదాయం పరిమితిని ₹${diff.toLocaleString('en-IN')} మించింది`,
            },
          },
        });
      } else {
        strictly.push(e);
      }
    }
    return { eligible, almost, strictly };
  }, [form, schemes, lang]);

  const canSubmit = form.age && form.annual_income && form.caste && form.gender && form.occupation;

  const prefillQuery = () => {
    const p: Record<string, string> = {
      full_name: '',
      income: form.annual_income,
    };
    const usp = new URLSearchParams(p);
    return usp.toString();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ap-blue">
          {lang === 'te' ? 'పథకం సిఫార్సు' : 'Scheme Recommender'}
          <span className="lang-te ml-2 text-sm text-ap-orangeDark">
            {lang === 'te' ? '/ Scheme Recommender' : '/ పథకం సిఫార్సు'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {lang === 'te'
            ? '8 సరళమైన ప్రశ్నలకు సమాధానం ఇవ్వండి, మీరు అర్హులైన అన్ని పథకాలను వెంటనే చూడండి.'
            : 'Answer 8 simple questions and see all schemes you qualify for instantly.'}
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setShowResults(true); }}
        className="grid gap-3 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">{lang === 'te' ? 'వయసు' : 'Age'}</label>
          <input type="number" min={1} max={120} required value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">
            {lang === 'te' ? 'వార్షిక కుటుంబ ఆదాయం (₹)' : 'Annual Household Income (₹)'}
          </label>
          <input type="number" min={0} required value={form.annual_income}
            onChange={(e) => setForm({ ...form, annual_income: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">{lang === 'te' ? 'కుల వర్గం' : 'Caste Category'}</label>
          <select required value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value as Caste })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm">
            <option value="">{lang === 'te' ? 'ఎంచుకోండి' : 'Select'}</option>
            {CASTES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">{lang === 'te' ? 'లింగం' : 'Gender'}</label>
          <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm">
            <option value="">{lang === 'te' ? 'ఎంచుకోండి' : 'Select'}</option>
            <option value="male">{lang === 'te' ? 'పురుషుడు' : 'Male'}</option>
            <option value="female">{lang === 'te' ? 'స్త్రీ' : 'Female'}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">{lang === 'te' ? 'వృత్తి' : 'Occupation'}</label>
          <select required value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm">
            <option value="">{lang === 'te' ? 'ఎంచుకోండి' : 'Select'}</option>
            {OCCUPATIONS.map((o) => <option key={o.v} value={o.v}>{lang === 'te' ? o.te : o.en}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ap-blue">{lang === 'te' ? 'భూమి (ఎకరాలలో)' : 'Land Owned (acres)'}</label>
          <input type="number" min={0} step="0.1" value={form.land_acres}
            onChange={(e) => setForm({ ...form, land_acres: e.target.value })}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm" />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 text-sm text-ap-blue">
          <input type="checkbox" checked={form.child_in_school}
            onChange={(e) => setForm({ ...form, child_in_school: e.target.checked })} />
          {lang === 'te' ? 'పాఠశాలకు వెళ్ళే పిల్లలు ఉన్నారా?' : 'Do you have school-going children?'}
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 text-sm text-ap-blue">
          <input type="checkbox" checked={form.construction_worker}
            onChange={(e) => setForm({ ...form, construction_worker: e.target.checked })} />
          {lang === 'te' ? 'నమోదిత నిర్మాణ కార్మికుడా?' : 'Registered construction worker?'}
        </label>
        <button type="submit" disabled={!canSubmit}
          className="sm:col-span-2 rounded-full bg-ap-orange py-2.5 font-semibold text-white hover:bg-ap-orangeDark disabled:opacity-60">
          {lang === 'te' ? 'నా పథకాలు కనుగొనండి' : 'Find My Schemes'}
        </button>
      </form>

      {showResults && (
        <div className="space-y-4">
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-green-700">
              <CheckCircle2 size={18} />
              {lang === 'te' ? `✅ మీరు అర్హులు (${results.eligible.length})` : `✅ You Qualify (${results.eligible.length})`}
            </h2>
            {results.eligible.length === 0 && (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
                {lang === 'te' ? 'ప్రస్తుత ఇన్‌పుట్‌లతో పూర్తిగా అర్హమైన పథకాలు కనుగొనబడలేదు.' : 'No fully qualifying schemes found with these inputs.'}
              </p>
            )}
            <ul className="space-y-2">
              {results.eligible.map(({ scheme }) => (
                <li key={scheme.id} className="rounded-xl border-2 border-green-200 bg-green-50/60 p-3 shadow-sm">
                  <p className="font-semibold text-ap-blue">{schemeName(scheme, lang)}</p>
                  <p className="mt-0.5 text-sm text-green-700">{schemeBenefit(scheme, toInput(form), lang)}</p>
                  {scheme.required_documents.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {lang === 'te' ? 'అవసరమైన పత్రాలు: ' : 'Required documents: '}
                      {scheme.required_documents.join(', ')}
                    </p>
                  )}
                  <Link
                    to={`/schemes/${scheme.id}/apply?${prefillQuery()}`}
                    className="mt-2 inline-block rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    {lang === 'te' ? 'దరఖాస్తు చేయి' : 'Apply Now'}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {results.almost.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-ap-orangeDark">
                <AlertTriangle size={18} />
                {lang === 'te' ? `⚠️ దాదాపు అర్హులు (${results.almost.length})` : `⚠️ Almost Eligible (${results.almost.length})`}
              </h2>
              <ul className="space-y-2">
                {results.almost.map(({ scheme, result }) => (
                  <li key={scheme.id} className="rounded-xl border border-orange-200 bg-orange-50/50 p-3">
                    <p className="font-semibold text-ap-blue">{schemeName(scheme, lang)}</p>
                    <p className="text-xs text-ap-orangeDark">{lang === 'te' ? result.reason?.te : result.reason?.en}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.strictly.length > 0 && (
            <section>
              <button onClick={() => setNotEligibleOpen(!notEligibleOpen)}
                className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><XCircle size={16} />
                  {lang === 'te' ? `❌ అర్హులు కాదు (${results.strictly.length})` : `❌ Not Eligible (${results.strictly.length})`}
                </span>
                {notEligibleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {notEligibleOpen && (
                <ul className="mt-2 space-y-1">
                  {results.strictly.map(({ scheme, result }) => (
                    <li key={scheme.id} className="rounded-lg border border-gray-200 bg-white p-2 text-xs">
                      <p className="font-medium text-gray-700">{schemeName(scheme, lang)}</p>
                      <p className="text-gray-500">{lang === 'te' ? result.reason?.te : result.reason?.en}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}