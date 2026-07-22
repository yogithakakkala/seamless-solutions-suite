import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus } from '@/types';

const statuses: ApplicationStatus[] = ['submitted', 'under_review', 'documents_requested', 'approved', 'rejected'];

const statusStyle: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-700',
  documents_requested: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const labels: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  documents_requested: 'Documents Requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, scheme:schemes(*), profile:profiles(full_name, email)')
      .order('created_at', { ascending: false });
    setApplications((data as unknown as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin-applications-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'applications' },
        async (payload) => {
          // Fetch full row with joins
          const { data } = await supabase
            .from('applications')
            .select('*, scheme:schemes(*), profile:profiles(full_name, email)')
            .eq('id', (payload.new as { id: string }).id)
            .maybeSingle();
          if (data) {
            const app = data as unknown as Application;
            setApplications((prev) => [app, ...prev.filter((a) => a.id !== app.id)]);
            toast.success(
              `New application received from ${app.profile?.full_name || app.applicant_details?.full_name || 'a citizen'}`,
            );
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications' },
        (payload) =>
          setApplications((prev) =>
            prev.map((a) =>
              a.id === (payload.new as { id: string }).id ? { ...a, ...(payload.new as Application) } : a,
            ),
          ),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    for (const s of statuses) c[s] = 0;
    applications.forEach((a) => {
      c[a.status] = (c[a.status] ?? 0) + 1;
    });
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (filter !== 'all' && app.status !== filter) return false;
      if (!q) return true;
      const applicantName = app.profile?.full_name ?? app.applicant_details?.full_name ?? '';
      const schemeName = app.scheme?.name ?? app.scheme_id;
      return applicantName.toLowerCase().includes(q) || schemeName.toLowerCase().includes(q);
    });
  }, [applications, filter, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ap-blue">
          Applications <span className="lang-te text-base text-ap-orangeDark">/ అర్జీలు</span>
        </h1>
        <p className="text-sm text-gray-500">Live view of all citizen applications.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {statuses.map((s) => (
          <div key={s} className="rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ap-blue/60">
              {labels[s]}
            </p>
            <p className="mt-1 text-2xl font-bold text-ap-blue">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {(['all', ...statuses] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === s ? 'bg-ap-blue text-white' : 'bg-white text-ap-blue border border-ap-blue/20 hover:bg-ap-blue/5'
              }`}
            >
              {s === 'all' ? `All (${counts.all})` : labels[s]}
            </button>
          ))}
        </div>
        <input
          placeholder="Search applicant or scheme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto rounded-lg border border-gray-300 p-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ap-blue/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-ap-blue/5 text-left text-xs uppercase tracking-wide text-ap-blue/60">
              <tr>
                <th className="px-4 py-2">App #</th>
                <th className="px-4 py-2">Applicant</th>
                <th className="px-4 py-2">Scheme</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-t border-ap-blue/5 hover:bg-ap-blue/[.03]">
                  <td className="px-4 py-2">
                    <Link
                      to={`/admin/applications/${app.id}`}
                      className="font-mono text-xs font-semibold text-ap-orangeDark hover:underline"
                    >
                      {app.token_number ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link to={`/admin/applications/${app.id}`} className="block font-medium text-ap-blue hover:underline">
                      {app.profile?.full_name || app.applicant_details?.full_name || app.user_id.slice(0, 8) + '…'}
                    </Link>
                    <span className="text-xs text-gray-400">{app.profile?.email}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    <p>{app.scheme?.name ?? app.scheme_id}</p>
                    <p className="lang-te text-[11px] text-gray-500">{app.scheme?.name_telugu}</p>
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(app.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyle[app.status]}`}>
                      {labels[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      to={`/admin/applications/${app.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-ap-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-ap-blue/90"
                    >
                      <MessageCircle size={12} /> Chat
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
