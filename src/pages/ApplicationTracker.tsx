import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { ApplicationStatus, PublicApplicationLookup } from '@/types';
import ListenButton from '@/components/ListenButton';

const statusStyle: Record<ApplicationStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-700',
  documents_requested: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabel: Record<ApplicationStatus, { en: string; te: string }> = {
  submitted: { en: 'Submitted', te: 'సమర్పించబడింది' },
  under_review: { en: 'Under Review', te: 'సమీక్షలో ఉంది' },
  documents_requested: { en: 'Documents Requested', te: 'పత్రాలు అభ్యర్థించబడ్డాయి' },
  approved: { en: 'Approved', te: 'ఆమోదించబడింది' },
  rejected: { en: 'Rejected', te: 'తిరస్కరించబడింది' },
};

export default function ApplicationTracker() {
  const { lang, t } = useLang();
  const [token, setToken] = useState('');
  const [result, setResult] = useState<PublicApplicationLookup | null | 'not_found'>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = token.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc('lookup_application_by_token', { _token: q });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setResult('not_found');
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      setResult(row as PublicApplicationLookup);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ap-blue">
            {lang === 'te' ? 'దరఖాస్తు ట్రాకర్' : 'Application Tracker'}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            {lang === 'te'
              ? 'మీ దరఖాస్తు నంబర్‌ను నమోదు చేసి ప్రస్తుత స్థితిని చూడండి.'
              : 'Enter your application number to see its current status.'}
          </p>
        </div>
        <ListenButton
          text={
            lang === 'te'
              ? 'మీ దరఖాస్తు స్థితిని తనిఖీ చేయడానికి దరఖాస్తు నంబర్ నమోదు చేయండి.'
              : 'Enter your application number to check its status.'
          }
        />
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          placeholder="APP-2026-000123"
          className="flex-1 rounded-lg border border-gray-300 p-2.5 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ap-orangeDark disabled:opacity-60"
        >
          {t('checkStatus') || (lang === 'te' ? 'తనిఖీ చేయండి' : 'Check status')}
        </button>
      </form>

      {result === 'not_found' && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {lang === 'te'
            ? 'ఈ నంబర్‌తో ఏ దరఖాస్తు కనుగొనబడలేదు. దయచేసి మళ్లీ తనిఖీ చేయండి.'
            : 'No application found for this number. Please double-check and try again.'}
        </p>
      )}

      {result && result !== 'not_found' && (
        <div className="space-y-3 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-ap-blue/60">
                {lang === 'te' ? 'దరఖాస్తు నంబర్' : 'Application number'}
              </p>
              <p className="font-mono text-sm font-semibold text-ap-blue">{result.token_number}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[result.status]}`}>
              {lang === 'te' ? statusLabel[result.status].te : statusLabel[result.status].en}
            </span>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-ap-blue/60">
                {lang === 'te' ? 'పథకం' : 'Scheme'}
              </p>
              <p className="font-medium text-gray-800">{result.scheme_name ?? result.scheme_id}</p>
            </div>
            {result.applicant_name && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ap-blue/60">
                  {lang === 'te' ? 'దరఖాస్తుదారు' : 'Applicant'}
                </p>
                <p className="font-medium text-gray-800">{result.applicant_name}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-ap-blue/60">
                {lang === 'te' ? 'సమర్పించిన తేదీ' : 'Submitted on'}
              </p>
              <p className="text-gray-700">{new Date(result.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ap-blue/60">
                {lang === 'te' ? 'చివరి నవీకరణ' : 'Last updated'}
              </p>
              <p className="text-gray-700">{new Date(result.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
