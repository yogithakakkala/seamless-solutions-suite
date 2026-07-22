import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus } from '@/types';

export default function AdminStatusUpdate() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingFor, setRequestingFor] = useState<string | null>(null);
  const [docName, setDocName] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, scheme:schemes(*), profile:profiles(full_name, email)')
      .in('status', ['submitted', 'under_review'])
      .order('created_at', { ascending: false });
    setApps((data as unknown as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-status-update')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Status updated successfully / స్థితి విజయవంతంగా నవీకరించబడింది.');
  };

  const submitDocRequest = async (id: string) => {
    if (!docName.trim()) return;
    await supabase.from('application_messages').insert({
      application_id: id,
      sender_type: 'staff',
      message: null,
      is_document_request: true,
      requested_document_type: docName.trim(),
    });
    await supabase.from('applications').update({ status: 'documents_requested' }).eq('id', id);
    toast.success('Document request sent.');
    setRequestingFor(null);
    setDocName('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ap-blue">
          Application Status Update <span className="lang-te text-base text-ap-orangeDark">/ స్థితి నవీకరణ</span>
        </h1>
        <p className="text-sm text-gray-500">Rapidly process pending applications.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ap-blue/20 bg-white p-8 text-center text-sm text-gray-500">
          No pending applications. All caught up! 🎉
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.id} className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ap-blue">
                    {app.profile?.full_name || app.applicant_details?.full_name || 'Applicant'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {app.scheme?.name ?? app.scheme_id} · {new Date(app.created_at).toLocaleString()}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-yellow-800">
                    {app.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRequestingFor(requestingFor === app.id ? null : app.id)}
                    className="rounded-full bg-ap-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-ap-orangeDark"
                  >
                    Request Documents
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'approved')}
                    className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, 'rejected')}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {requestingFor === app.id && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-dashed border-ap-orange/50 p-3">
                  <input
                    autoFocus
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Document name (e.g. Updated Income Certificate)"
                    className="flex-1 rounded-lg border border-gray-300 p-2 text-sm"
                  />
                  <button
                    onClick={() => submitDocRequest(app.id)}
                    disabled={!docName.trim()}
                    className="rounded-full bg-ap-orange px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Send Request
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
