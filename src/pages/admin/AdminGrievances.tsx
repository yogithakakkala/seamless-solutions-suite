import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Application, Grievance, Scheme, Profile } from '@/types';

type FullGrievance = Grievance & {
  application?: (Application & { scheme?: Scheme; profile?: Pick<Profile, 'full_name' | 'email'> }) | null;
};

export default function AdminGrievances() {
  const [items, setItems] = useState<FullGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('grievances')
      .select('*, application:applications(*, scheme:schemes(*), profile:profiles(full_name, email))')
      .order('raised_at', { ascending: false });
    setItems((data as unknown as FullGrievance[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('admin-grievances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const acknowledge = async (id: string) => {
    const { error } = await supabase.from('grievances')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Grievance acknowledged. Citizen has been notified.');
  };

  const resolve = async (id: string) => {
    const { error } = await supabase.from('grievances')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_response: response || null })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Grievance resolved. Citizen has been notified.');
      setResolveOpen(null); setResponse('');
    }
  };

  const raised = items.filter((g) => g.status === 'raised').length;
  const acknowledged = items.filter((g) => g.status === 'acknowledged').length;
  const resolved = items.filter((g) => g.status === 'resolved').length;

  const sorted = [...items].sort((a, b) => {
    const aUpd = a.application?.updated_at ? new Date(a.application.updated_at).getTime() : 0;
    const bUpd = b.application?.updated_at ? new Date(b.application.updated_at).getTime() : 0;
    return aUpd - bUpd; // oldest update first = most urgent
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">Grievances / ఫిర్యాదులు</h1>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{raised}</p>
          <p className="text-xs text-red-800">Raised / నమోదైనవి</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{acknowledged}</p>
          <p className="text-xs text-yellow-800">Acknowledged / గుర్తించబడినవి</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{resolved}</p>
          <p className="text-xs text-green-800">Resolved / పరిష్కరించబడినవి</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-ap-blue/10 bg-white p-6 text-center text-sm text-gray-500">
          No grievances yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ap-blue/10 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-ap-blue/5 text-left text-xs uppercase tracking-wide text-ap-blue/70">
              <tr>
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Scheme</th>
                <th className="px-3 py-2">Days Stale</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Raised</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => {
                const app = g.application;
                const days = app ? Math.floor((Date.now() - new Date(app.updated_at).getTime()) / 86400000) : 0;
                return (
                  <tr key={g.id} className="border-t border-ap-blue/10">
                    <td className="px-3 py-2">{app?.profile?.full_name || app?.profile?.email || '—'}</td>
                    <td className="px-3 py-2">{app?.scheme?.name || app?.scheme_id}</td>
                    <td className="px-3 py-2 font-semibold text-red-600">{days}d</td>
                    <td className="px-3 py-2 max-w-[240px] truncate" title={g.reason ?? ''}>{g.reason || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        g.status === 'raised' ? 'bg-red-100 text-red-700'
                        : g.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{new Date(g.raised_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2 space-y-1">
                      {app && (
                        <Link to={`/admin/applications/${app.id}`}
                          className="block rounded-full bg-ap-blue px-3 py-1 text-center text-xs font-semibold text-white hover:bg-ap-blue/90">
                          Open Application
                        </Link>
                      )}
                      {g.status === 'raised' && (
                        <button onClick={() => acknowledge(g.id)}
                          className="block w-full rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-600">
                          Acknowledge / గుర్తించు
                        </button>
                      )}
                      {g.status !== 'resolved' && (
                        resolveOpen === g.id ? (
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                            <textarea
                              placeholder="Optional response to citizen"
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              className="w-full rounded-md border border-gray-300 p-1.5 text-xs"
                              rows={2}
                            />
                            <div className="mt-1 flex gap-1">
                              <button onClick={() => resolve(g.id)}
                                className="flex-1 rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white">
                                Confirm
                              </button>
                              <button onClick={() => { setResolveOpen(null); setResponse(''); }}
                                className="rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-600">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setResolveOpen(g.id)}
                            className="block w-full rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">
                            Resolve / పరిష్కరించు
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}