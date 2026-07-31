import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, AlertOctagon } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';
import { useDrafts } from '@/hooks/useDrafts';
import MiniProgressBar from '@/components/MiniProgressBar';
import type { Application, Grievance } from '@/types';

export default function MyApplications() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const { unreadByApp } = useUnreadUpdates();
  const { drafts, remove: removeDraft } = useDrafts();
  const [applications, setApplications] = useState<Application[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalateFor, setEscalateFor] = useState<Application | null>(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [submittingEscalation, setSubmittingEscalation] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const userId = user.id;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const [{ data: apps }, { data: griev }] = await Promise.all([
        supabase.from('applications').select('*, scheme:schemes(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('grievances').select('*').eq('user_id', userId),
      ]);
      setApplications((apps as unknown as Application[]) ?? []);
      setGrievances((griev as Grievance[]) ?? []);
      setLoading(false);
    }
    load();

    channel = supabase
      .channel('applications-user-' + userId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setApplications((prev) =>
            prev.map((a) => (a.id === payload.new.id ? { ...a, ...(payload.new as Application) } : a))
          );
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'grievances', filter: `user_id=eq.${userId}` },
        (payload) => {
          const g = payload.new as Grievance;
          if (payload.eventType === 'UPDATE' && g.status === 'acknowledged') {
            toast.success(lang === 'te' ? 'మీ ఫిర్యాదు గుర్తించబడింది.' : 'Your grievance has been acknowledged.');
          } else if (payload.eventType === 'UPDATE' && g.status === 'resolved') {
            toast.success(lang === 'te' ? 'మీ ఫిర్యాదు పరిష్కరించబడింది.' : 'Your grievance has been resolved.');
          }
          load();
        })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, lang]);

  const submitEscalation = async () => {
    if (!escalateFor || !user) return;
    setSubmittingEscalation(true);
    const { error } = await supabase.from('grievances').insert({
      application_id: escalateFor.id,
      user_id: user.id,
      reason: escalateReason.trim() || null,
    });
    setSubmittingEscalation(false);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === 'te' ? 'ఫిర్యాదు విజయవంతంగా నమోదైంది.' : 'Grievance raised successfully.');
      setEscalateFor(null); setEscalateReason('');
      // reload grievances
      const { data } = await supabase.from('grievances').select('*').eq('user_id', user.id);
      setGrievances((data as Grievance[]) ?? []);
    }
  };

  const activeGrievanceFor = (appId: string) =>
    grievances.find((g) => g.application_id === appId && g.status !== 'resolved');

  if (!user) {
    return (
      <div className="rounded-xl border border-ap-blue/10 bg-white p-5 text-center shadow-sm">
        <p className="mb-3 text-gray-700">
          {lang === 'te' ? 'మీ దరఖాస్తులను చూడటానికి లాగిన్ అవ్వండి.' : 'Log in to see your applications.'}
        </p>
        <Link to="/login" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-medium text-white">
          {t('login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">{t('myApplications')}</h1>

      {drafts.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ap-orangeDark">
            {lang === 'te' ? 'ముసాయిదాలు' : 'Drafts'}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {drafts.map((d) => {
              const savedAgo = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / 60000);
              return (
                <div key={d.id} className="min-w-[220px] rounded-xl border border-ap-orange/30 bg-orange-50 p-3 shadow-sm">
                  <p className="truncate text-sm font-semibold text-ap-blue">
                    {d.scheme ? (lang === 'te' ? d.scheme.name_telugu : d.scheme.name) : d.scheme_id}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative h-10 w-10">
                      <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#fed7aa" strokeWidth="4" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#ea580c" strokeWidth="4"
                          strokeDasharray={`${(d.completion_percentage / 100) * 94.2} 94.2`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ap-orangeDark">
                        {d.completion_percentage}%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {lang === 'te'
                        ? `${savedAgo < 60 ? savedAgo + ' నిమిషాల' : Math.floor(savedAgo / 60) + ' గంటల'} ముందు`
                        : `Saved ${savedAgo < 60 ? savedAgo + 'm' : Math.floor(savedAgo / 60) + 'h'} ago`}
                    </p>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Link to={`/schemes/${d.scheme_id}/apply`}
                      className="flex-1 rounded-full bg-ap-orange px-2 py-1 text-center text-xs font-semibold text-white">
                      {lang === 'te' ? 'కొనసాగించు' : 'Continue'}
                    </Link>
                    <button onClick={() => removeDraft(d.id)} className="rounded-full border border-red-200 p-1.5 text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">{lang === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...'}</p>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-ap-blue/10 bg-white p-5 text-center shadow-sm">
          <p className="mb-3 text-gray-600">
            {lang === 'te' ? 'మీకు ఇంకా దరఖాస్తులు లేవు.' : "You don't have any applications yet."}
          </p>
          <Link to="/schemes" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-medium text-white">
            {t('schemes')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => {
            const unread = unreadByApp[app.id] ?? 0;
            const daysStale = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / 86400000);
            const stale = (app.status === 'submitted' || app.status === 'under_review') && daysStale > 7;
            const grievance = activeGrievanceFor(app.id);
            return (
              <li key={app.id}>
                <div className="rounded-xl border border-ap-blue/10 bg-white shadow-sm hover:shadow-md">
                  <Link to={`/my-applications/${app.id}`} className="block p-4">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 truncate font-medium text-ap-blue">
                        {app.scheme ? (lang === 'te' ? app.scheme.name_telugu : app.scheme.name) : app.scheme_id}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {app.token_number && (
                        <span className="font-mono font-semibold text-ap-blue">{app.token_number} · </span>
                      )}
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <MiniProgressBar status={app.status} />
                    </div>
                  </Link>
                  {stale && (
                    <div className="border-t border-orange-200 bg-orange-50 px-4 py-2">
                      {grievance ? (
                        <span className="inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                          {lang === 'te' ? 'ఫిర్యాదు నమోదు' : 'Grievance Raised'}
                        </span>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-ap-orangeDark">
                            ⚠️ {lang === 'te' ? `${daysStale} రోజులుగా అప్‌డేట్ లేదు` : `No update in ${daysStale} days`}
                          </p>
                          <button
                            onClick={() => setEscalateFor(app)}
                            className="flex items-center gap-1 rounded-full bg-ap-orange px-3 py-1 text-xs font-semibold text-white hover:bg-ap-orangeDark"
                          >
                            <AlertOctagon size={12} />
                            {lang === 'te' ? 'ఫిర్యాదు చేయి' : 'Escalate'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {escalateFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h3 className="text-base font-bold text-ap-blue">
              {lang === 'te' ? 'ఫిర్యాదు నమోదు చేయండి' : 'Raise a Grievance'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {lang === 'te'
                ? 'ఫిర్యాదు నమోదు చేయడం వల్ల సంబంధిత అధికారి మీ దరఖాస్తును తక్షణమే సమీక్షిస్తారు.'
                : 'Raising a grievance will alert the concerned Sachivalayam officer to review your application urgently.'}
            </p>
            <label className="mt-3 block text-xs font-semibold text-ap-blue">
              {lang === 'te' ? 'మీకు ఏమి కావాలో చెప్పండి (ఐచ్ఛికం)' : 'Tell us what you need (optional)'}
            </label>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => { setEscalateFor(null); setEscalateReason(''); }}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-600">
                {lang === 'te' ? 'రద్దు' : 'Cancel'}
              </button>
              <button onClick={submitEscalation} disabled={submittingEscalation}
                className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {lang === 'te' ? 'ఫిర్యాదు సమర్పించు' : 'Submit Grievance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
