import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';
import type { Application } from '@/types';

const statusStyle: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-700',
  documents_requested: 'bg-orange-100 text-orange-800 ring-2 ring-orange-400 animate-pulse',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function MyApplications() {
  const { lang, t } = useLang();
  const { user } = useAuth();
  const { unreadByApp } = useUnreadUpdates();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const userId = user.id;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data } = await supabase
        .from('applications')
        .select('*, scheme:schemes(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setApplications((data as unknown as Application[]) ?? []);
      setLoading(false);
    }
    load();

    // Realtime: reflect status changes made by staff without a page refresh
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
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

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
            return (
              <li key={app.id}>
                <Link
                  to={`/my-applications/${app.id}`}
                  className="flex items-center justify-between rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ap-blue">
                        {app.scheme ? (lang === 'te' ? app.scheme.name_telugu : app.scheme.name) : app.scheme_id}
                      </p>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[app.status]}`}>
                    {app.status === 'documents_requested'
                      ? lang === 'te'
                        ? '⚠ చర్య అవసరం'
                        : '⚠ Action needed'
                      : app.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
