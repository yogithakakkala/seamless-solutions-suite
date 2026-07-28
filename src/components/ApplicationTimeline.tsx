import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import type { Application, ApplicationStatusHistory } from '@/types';

const STEP_LABELS: Record<string, { en: string; te: string }> = {
  submitted: { en: 'Submitted', te: 'సమర్పించబడింది' },
  under_review: { en: 'Under Review', te: 'సమీక్షలో ఉంది' },
  documents_requested: { en: 'Documents Requested', te: 'పత్రాలు అభ్యర్థించబడ్డాయి' },
  approved: { en: 'Approved', te: 'ఆమోదించబడింది' },
  rejected: { en: 'Rejected', te: 'తిరస్కరించబడింది' },
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysBetween(a: string, b: string) {
  const diff = Math.max(0, new Date(b).getTime() - new Date(a).getTime());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return { d, h };
}

export default function ApplicationTimeline({ application }: { application: Application }) {
  const { lang } = useLang();
  const [history, setHistory] = useState<ApplicationStatusHistory[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', application.id)
      .order('changed_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setHistory((data as ApplicationStatusHistory[]) ?? []);
      });
    const ch = supabase
      .channel('ash-' + application.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'application_status_history', filter: `application_id=eq.${application.id}` },
        (p) => setHistory((prev) => [...prev, p.new as ApplicationStatusHistory]))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [application.id]);

  const byStatus: Record<string, ApplicationStatusHistory | undefined> = {};
  history.forEach((h) => { byStatus[h.status] = h; });

  const isTerminal = application.status === 'approved' || application.status === 'rejected';
  const hasDocsReq = !!byStatus.documents_requested;

  type Step = { key: string; when?: string; state: 'done' | 'current' | 'future' | 'terminal'; color: string };
  const steps: Step[] = [];

  const isCurrent = (k: string) => application.status === k;

  steps.push({
    key: 'submitted',
    when: byStatus.submitted?.changed_at ?? application.created_at,
    state: isCurrent('submitted') ? 'current' : 'done',
    color: 'text-ap-blue bg-ap-blue',
  });

  const reviewSeen = !!byStatus.under_review || application.status === 'under_review' || isTerminal || hasDocsReq;
  steps.push({
    key: 'under_review',
    when: byStatus.under_review?.changed_at,
    state: isCurrent('under_review') ? 'current' : reviewSeen ? 'done' : 'future',
    color: 'text-blue-500 bg-blue-500',
  });

  if (hasDocsReq || isCurrent('documents_requested')) {
    steps.push({
      key: 'documents_requested',
      when: byStatus.documents_requested?.changed_at,
      state: isCurrent('documents_requested') ? 'current' : 'done',
      color: 'text-ap-orange bg-ap-orange',
    });
  }

  if (application.status === 'approved') {
    steps.push({ key: 'approved', when: byStatus.approved?.changed_at, state: 'terminal', color: 'text-green-600 bg-green-600' });
  } else if (application.status === 'rejected') {
    steps.push({ key: 'rejected', when: byStatus.rejected?.changed_at, state: 'terminal', color: 'text-red-600 bg-red-600' });
  } else {
    steps.push({ key: 'final', when: undefined, state: 'future', color: 'text-gray-400 bg-gray-300' });
  }

  return (
    <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">
        {lang === 'te' ? 'పురోగతి' : 'Progress'}
      </p>
      <ol className="relative space-y-4">
        {steps.map((s, idx) => {
          const label = s.key === 'final'
            ? { en: 'Approved / Rejected', te: 'ఆమోదం / తిరస్కరణ' }
            : STEP_LABELS[s.key] ?? { en: s.key, te: s.key };
          const prev = idx > 0 ? steps[idx - 1] : undefined;
          const elapsed = s.when && prev?.when ? daysBetween(prev.when, s.when) : null;
          const isDone = s.state === 'done' || s.state === 'terminal';
          const isCurr = s.state === 'current';
          return (
            <li key={s.key} className="relative flex gap-3">
              {idx < steps.length - 1 && (
                <span className={`absolute left-[11px] top-6 h-full w-0.5 ${isDone ? 'bg-ap-blue/40' : 'bg-gray-200'}`} />
              )}
              <div className="flex-shrink-0">
                {s.state === 'future' ? (
                  <Circle size={24} className="text-gray-300" />
                ) : s.key === 'rejected' ? (
                  <XCircle size={24} className="text-red-600" />
                ) : (
                  <span className={`relative flex h-6 w-6 items-center justify-center rounded-full ${s.color.split(' ')[1]} text-white ${isCurr ? 'ring-4 ring-offset-0 animate-pulse ring-current/30' : ''}`}>
                    <CheckCircle2 size={16} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isDone || isCurr ? 'text-ap-blue' : 'text-gray-400'}`}>
                  {lang === 'te' ? label.te : label.en}
                </p>
                {s.when ? (
                  <p className="text-xs text-gray-500">{fmtWhen(s.when)}</p>
                ) : (
                  <p className="text-xs text-gray-400">{lang === 'te' ? 'ఇంకా చేరలేదు' : 'Not yet reached'}</p>
                )}
                {elapsed && (elapsed.d > 0 || elapsed.h > 0) && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={10} />
                    {elapsed.d > 0
                      ? (lang === 'te' ? `మునుపటి దశ తర్వాత ${elapsed.d} రోజులు` : `${elapsed.d} day${elapsed.d > 1 ? 's' : ''} after previous step`)
                      : (lang === 'te' ? `${elapsed.h} గంటలు తర్వాత` : `${elapsed.h}h after previous step`)}
                  </p>
                )}
                {s.key === 'documents_requested' && byStatus.documents_requested?.document_requested && (
                  <p className="mt-0.5 text-xs italic text-ap-orangeDark">
                    → {byStatus.documents_requested.document_requested}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!isTerminal && (
        <p className="mt-4 rounded-lg bg-ap-blue/5 p-2.5 text-xs text-ap-blue/80">
          {lang === 'te'
            ? 'సారూప్య దరఖాస్తుల ఆధారంగా ఇది సాధారణంగా 7–10 పని దినాలు తీసుకుంటుంది.'
            : 'Based on similar applications, this typically takes 7–10 working days.'}
        </p>
      )}
    </div>
  );
}