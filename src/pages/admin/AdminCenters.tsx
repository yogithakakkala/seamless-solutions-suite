import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { SachivalayamCenter } from '@/types';

const emptyForm = { name: '', name_telugu: '', address: '', area: '', district: 'Visakhapatnam', latitude: '', longitude: '', phone: '' };

type BusyLevel = 'less' | 'moderate' | 'busy';

export default function AdminCenters() {
  const [centers, setCenters] = useState<SachivalayamCenter[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = () => {
    supabase.from('sachivalayam_centers').select('*').order('area').then(({ data }) => setCenters((data as SachivalayamCenter[]) ?? []));
  };
  useEffect(load, []);

  const setBusy = async (id: string, level: BusyLevel) => {
    setSavingId(id);
    const note = noteDrafts[id];
    const patch: Record<string, unknown> = { busy_level: level, busy_updated_at: new Date().toISOString() };
    if (note !== undefined) patch.busy_note = note || null;
    const { error } = await supabase.from('sachivalayam_centers').update(patch).eq('id', id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else { toast.success('Busy level updated'); load(); }
  };

  const bulkAll = async (level: BusyLevel) => {
    if (!confirm(`Set ALL centers to "${level}"?`)) return;
    const { error } = await supabase.from('sachivalayam_centers')
      .update({ busy_level: level, busy_updated_at: new Date().toISOString() })
      .not('id', 'is', null);
    if (error) toast.error(error.message);
    else { toast.success('All centers updated'); load(); }
  };

  const badgeCls = (l?: string | null) =>
    l === 'busy' ? 'bg-red-100 text-red-700' : l === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700';

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

      <div className="flex flex-wrap gap-2 rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
        <span className="text-xs font-semibold text-ap-blue">Bulk actions:</span>
        <button onClick={() => bulkAll('less')} className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">🟢 All Less Crowded</button>
        <button onClick={() => bulkAll('moderate')} className="rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-white">🟡 All Moderate</button>
        <button onClick={() => bulkAll('busy')} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">🔴 All Busy</button>
      </div>

      <ul className="space-y-2">
        {centers.map((c) => (
          <li key={c.id} className="rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ap-blue">
                  {c.name}
                  <span className="text-xs text-gray-400"> ({c.area})</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeCls(c.busy_level)}`}>
                    {c.busy_level || 'less'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">{c.latitude}, {c.longitude}</p>
                {c.busy_updated_at && (
                  <p className="text-[10px] text-gray-400">Busy updated: {new Date(c.busy_updated_at).toLocaleString()}</p>
                )}
              </div>
              <button onClick={() => remove(c.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600">Delete</button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button disabled={savingId === c.id} onClick={() => setBusy(c.id, 'less')} className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200">🟢 Less</button>
              <button disabled={savingId === c.id} onClick={() => setBusy(c.id, 'moderate')} className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200">🟡 Moderate</button>
              <button disabled={savingId === c.id} onClick={() => setBusy(c.id, 'busy')} className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">🔴 Busy</button>
              <input
                placeholder='Optional note (e.g. "Aadhaar server slow")'
                defaultValue={c.busy_note ?? ''}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                className="flex-1 min-w-[180px] rounded-lg border border-gray-300 p-1.5 text-xs"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
