import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SachivalayamCenter } from '@/types';

const emptyForm = { name: '', name_telugu: '', address: '', area: '', district: 'Visakhapatnam', latitude: '', longitude: '', phone: '' };

export default function AdminCenters() {
  const [centers, setCenters] = useState<SachivalayamCenter[]>([]);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    supabase.from('sachivalayam_centers').select('*').order('area').then(({ data }) => setCenters((data as SachivalayamCenter[]) ?? []));
  };
  useEffect(load, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('sachivalayam_centers').insert({
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    });
    setForm(emptyForm);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this center?')) return;
    await supabase.from('sachivalayam_centers').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">Manage Sachivalayam Centers</h1>
      <p className="text-sm text-gray-500">
        Use this to verify/correct pins seeded for Gajuwaka, Sheela Nagar, Kurmannapalem and Visakhapatnam,
        and to add any of the remaining ward secretariats not yet listed.
      </p>

      <form onSubmit={add} className="grid gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm sm:grid-cols-2">
        <input placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Name (Telugu)" value={form.name_telugu} onChange={(e) => setForm({ ...form, name_telugu: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm lang-te" />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Area / locality" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" />
        <input placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" />
        <button type="submit" className="col-span-2 rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white">Add Center</button>
      </form>

      <ul className="space-y-2">
        {centers.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <div>
              <p className="font-medium text-ap-blue">{c.name} <span className="text-xs text-gray-400">({c.area})</span></p>
              <p className="text-xs text-gray-500">{c.latitude}, {c.longitude}</p>
            </div>
            <button onClick={() => remove(c.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
