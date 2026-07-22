import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { SCHEMES_SEED } from '@/data/schemesSeed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Scheme } from '@/types';
import ListenButton from '@/components/ListenButton';

export default function Schemes() {
  const { lang, t } = useLang();
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES_SEED);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('schemes')
      .select('*')
      .then(({ data }) => {
        // Merge DB rows into bundled catalogue by id. Bundled entries carry the
        // rich category/icon/benefit metadata that the DB table doesn't model.
        if (!data || data.length === 0) return;
        const byId = new Map(SCHEMES_SEED.map((s) => [s.id, s] as const));
        for (const row of data as Scheme[]) {
          const bundled = byId.get(row.id);
          byId.set(row.id, {
            ...bundled,
            ...row,
            category: bundled?.category ?? row.category,
            icon: bundled?.icon ?? row.icon,
            benefit: bundled?.benefit ?? row.benefit,
            benefit_telugu: bundled?.benefit_telugu ?? row.benefit_telugu,
            priority: bundled?.priority ?? row.priority,
          });
        }
        setSchemes(Array.from(byId.values()));
      });
  }, []);

  const sorted = useMemo(
    () => [...schemes].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99)),
    [schemes]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    sorted.forEach((s) => s.category && set.add(s.category));
    return ['all', ...Array.from(set)];
  }, [sorted]);

  const filtered = category === 'all' ? sorted : sorted.filter((s) => s.category === category);
  const superSix = sorted.filter((s) => s.priority && s.priority <= 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ap-blue">{t('schemes')}</h1>
        <Link to="/documents" className="rounded-full border border-ap-blue/20 px-3 py-1 text-xs font-medium text-ap-blue hover:bg-ap-blue/5">
          {lang === 'te' ? 'ధృవీకరణ పత్రాలు →' : 'Certificates →'}
        </Link>
      </div>

      {category === 'all' && superSix.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ap-orange">
            {lang === 'te' ? '⭐ సూపర్ 6 పథకాలు' : '⭐ Super 6 Schemes'}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {superSix.map((s) => <SchemeCard key={s.id} scheme={s} lang={lang} t={t} highlight />)}
          </ul>
        </section>
      )}

      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${category === c ? 'border-ap-blue bg-ap-blue text-white' : 'border-ap-blue/20 bg-white text-ap-blue'}`}
          >
            {c === 'all' ? (lang === 'te' ? 'అన్నీ' : 'All') : c}
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => <SchemeCard key={s.id} scheme={s} lang={lang} t={t} />)}
      </ul>
    </div>
  );
}

function SchemeCard({ scheme, lang, t, highlight }: { scheme: Scheme; lang: 'en' | 'te'; t: (k: 'apply') => string; highlight?: boolean }) {
  return (
    <li className={`rounded-xl border bg-white p-4 shadow-sm ${highlight ? 'border-ap-orange/40 ring-1 ring-ap-orange/20' : 'border-ap-blue/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {scheme.icon && <span className="text-2xl leading-none">{scheme.icon}</span>}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ap-blue">{lang === 'te' ? scheme.name_telugu : scheme.name}</p>
              <p className="lang-te truncate text-xs text-gray-500">{lang === 'te' ? scheme.name : scheme.name_telugu}</p>
            </div>
          </div>
          {scheme.category && (
            <span className="mt-2 inline-block rounded-full bg-ap-blue/10 px-2 py-0.5 text-[10px] font-medium text-ap-blue">
              {scheme.category}
            </span>
          )}
        </div>
        <ListenButton text={lang === 'te' ? scheme.name_telugu : scheme.name} />
      </div>
      {scheme.benefit && (
        <p className="mt-2 text-sm font-semibold text-ap-orangeDark">
          💰 {lang === 'te' ? scheme.benefit_telugu : scheme.benefit}
        </p>
      )}
      <p className="mt-1 text-sm text-gray-600 line-clamp-3">{lang === 'te' ? (scheme.description_telugu ?? scheme.description) : scheme.description}</p>
      <div className="mt-3 flex gap-2">
        <Link to={`/eligibility?scheme=${scheme.id}`} className="rounded-full border border-ap-blue/20 px-3 py-1.5 text-xs font-medium text-ap-blue hover:bg-ap-blue/5">
          {lang === 'te' ? 'అర్హత తనిఖీ' : 'Check eligibility'}
        </Link>
        <Link to={`/schemes/${scheme.id}/apply`} className="rounded-full bg-ap-orange px-4 py-1.5 text-xs font-medium text-white hover:bg-ap-orangeDark">
          {t('apply')}
        </Link>
      </div>
    </li>
  );
}
