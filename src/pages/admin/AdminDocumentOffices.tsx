import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { DocumentOffice } from '@/types';

export default function AdminDocumentOffices() {
  const [offices, setOffices] = useState<DocumentOffice[]>([]);
  const [docType, setDocType] = useState('');
  const [officeType, setOfficeType] = useState('');

  const load = () => {
    supabase.from('document_offices').select('*').then(({ data }) => setOffices((data as DocumentOffice[]) ?? []));
  };
  useEffect(load, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('document_offices').insert({ document_type: docType, issuing_office_type: officeType });
    setDocType('');
    setOfficeType('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('document_offices').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">Manage Document Offices</h1>

      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <input placeholder="Document type" value={docType} onChange={(e) => setDocType(e.target.value)} className="flex-1 rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Issuing office type" value={officeType} onChange={(e) => setOfficeType(e.target.value)} className="flex-1 rounded-lg border border-gray-300 p-2 text-sm" required />
        <button type="submit" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white">Add</button>
      </form>

      <ul className="space-y-2">
        {offices.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <p className="text-sm"><strong>{o.document_type}</strong> → {o.issuing_office_type}</p>
            <button onClick={() => remove(o.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
