import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CertificateRequest, CertificateStatus } from '@/types';

function generateToken() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `SC-${year}-${rand}`;
}

export default function AdminCertificates() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const load = () => {
    supabase
      .from('certificate_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .then(({ data }) => setRequests((data as CertificateRequest[]) ?? []));
  };

  useEffect(load, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('certificate_requests').insert({
      token_number: generateToken(),
      citizen_name: name,
      certificate_type: type,
      status: 'pending',
    });
    setName('');
    setType('');
    load();
  };

  const updateStatus = async (id: string, status: CertificateStatus) => {
    // Emails the citizen when marked "ready" if contact info is on file
    // (see supabase/migrations/0001_init.sql trigger).
    await supabase.from('certificate_requests').update({ status }).eq('id', id);
    load();
  };

  const saveNotes = async (id: string, notes: string) => {
    await supabase.from('certificate_requests').update({ notes }).eq('id', id);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">Manage Certificate Requests</h1>

      <form onSubmit={create} className="flex flex-wrap gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <input placeholder="Citizen name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Certificate type" value={type} onChange={(e) => setType(e.target.value)} className="flex-1 rounded-lg border border-gray-300 p-2 text-sm" required />
        <button type="submit" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white">Create (auto token)</button>
      </form>

      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="space-y-2 rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ap-blue">{r.token_number} · {r.citizen_name}</p>
                <p className="text-xs text-gray-500">{r.certificate_type}</p>
              </div>
              <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as CertificateStatus)} className="rounded-lg border border-gray-300 p-1.5 text-xs">
                <option value="pending">pending</option>
                <option value="ready">ready</option>
                <option value="collected">collected</option>
              </select>
            </div>
            <input
              placeholder="Internal notes (not visible to citizen)"
              defaultValue={r.notes ?? ''}
              onBlur={(e) => saveNotes(r.id, e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-xs"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
