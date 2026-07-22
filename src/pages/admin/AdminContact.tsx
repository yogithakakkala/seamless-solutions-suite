import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationMessage } from '@/types';

interface Thread {
  application: Application;
  lastMessage: ApplicationMessage;
  unread: boolean;
}

export default function AdminContact() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: msgs } = await supabase
      .from('application_messages')
      .select('*')
      .order('created_at', { ascending: false });

    const messages = (msgs as ApplicationMessage[]) ?? [];
    // Group by application_id, keep most recent
    const byApp = new Map<string, ApplicationMessage[]>();
    for (const m of messages) {
      if (!byApp.has(m.application_id)) byApp.set(m.application_id, []);
      byApp.get(m.application_id)!.push(m);
    }

    const appIds = Array.from(byApp.keys());
    if (appIds.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const { data: apps } = await supabase
      .from('applications')
      .select('*, scheme:schemes(*), profile:profiles(full_name, email)')
      .in('id', appIds);

    const appMap = new Map<string, Application>();
    ((apps as unknown as Application[]) ?? []).forEach((a) => appMap.set(a.id, a));

    const list: Thread[] = appIds
      .map((id) => {
        const app = appMap.get(id);
        const list = byApp.get(id)!;
        const last = list[0];
        // unread: latest is from user AND no staff reply is more recent
        const unread = last.sender_type === 'user';
        return app ? { application: app, lastMessage: last, unread } : null;
      })
      .filter((t): t is Thread => t !== null)
      .sort((a, b) => (a.lastMessage.created_at < b.lastMessage.created_at ? 1 : -1));

    setThreads(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-contact-inbox')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'application_messages' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ap-blue">
          Contact Applicant <span className="lang-te text-base text-ap-orangeDark">/ అభ్యర్థిని సంప్రదించండి</span>
        </h1>
        <p className="text-sm text-gray-500">All ongoing citizen conversations.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ap-blue/20 bg-white p-8 text-center text-sm text-gray-500">
          No conversations yet. Message a citizen from an application detail page to start one.
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map(({ application, lastMessage, unread }) => (
            <li key={application.id}>
              <Link
                to={`/admin/applications/${application.id}`}
                className="flex items-start justify-between gap-3 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ap-blue">
                      {application.profile?.full_name || application.applicant_details?.full_name || 'Applicant'}
                    </p>
                    {unread && (
                      <span className="rounded-full bg-ap-orange px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{application.scheme?.name ?? application.scheme_id}</p>
                  <p className="mt-1 truncate text-sm text-gray-700">
                    <span className="font-medium">
                      {lastMessage.sender_type === 'staff' ? 'You: ' : ''}
                    </span>
                    {lastMessage.is_document_request
                      ? `📎 Requested: ${lastMessage.requested_document_type}`
                      : lastMessage.message}
                  </p>
                </div>
                <span className="whitespace-nowrap text-[11px] text-gray-400">
                  {new Date(lastMessage.created_at).toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
