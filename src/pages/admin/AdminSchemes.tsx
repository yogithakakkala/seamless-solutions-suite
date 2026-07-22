import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Scheme } from '@/types';

const CASTES = ['SC', 'ST', 'BC', 'OC', 'EWS', 'Minority', 'All'];
const GENDERS = ['All', 'Male', 'Female'];

interface FormState {
  id: string;
  name: string;
  name_telugu: string;
  description: string;
  max_income: string;
  age_min: string;
  age_max: string;
  land_max_acres: string;
  caste_categories: string[];
  gender: string;
  other_conditions: string;
  required_documents: string[];
}

const emptyForm: FormState = {
  id: '',
  name: '',
  name_telugu: '',
  description: '',
  max_income: '',
  age_min: '',
  age_max: '',
  land_max_acres: '',
  caste_categories: [],
  gender: 'All',
  other_conditions: '',
  required_documents: [],
};

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [{ data: schemesData }, { data: appsData }] = await Promise.all([
      supabase.from('schemes').select('*').order('name'),
      supabase.from('applications').select('scheme_id'),
    ]);
    setSchemes((schemesData as Scheme[]) ?? []);
    const c: Record<string, number> = {};
    ((appsData as { scheme_id: string }[]) ?? []).forEach((a) => {
      c[a.scheme_id] = (c[a.scheme_id] ?? 0) + 1;
    });
    setCounts(c);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setNewDoc('');
  };

  const edit = (s: Scheme) => {
    setEditingId(s.id);
    setShowForm(true);
    setForm({
      id: s.id,
      name: s.name,
      name_telugu: s.name_telugu,
      description: s.description,
      max_income: s.eligibility_rules.max_income?.toString() ?? s.eligibility_rules.max_annual_income?.toString() ?? '',
      age_min: s.eligibility_rules.age_min?.toString() ?? s.eligibility_rules.min_age?.toString() ?? '',
      age_max: s.eligibility_rules.age_max?.toString() ?? s.eligibility_rules.max_age?.toString() ?? '',
      land_max_acres: s.eligibility_rules.land_max_acres?.toString() ?? '',
      caste_categories: s.eligibility_rules.caste_categories ?? [],
      gender: s.eligibility_rules.gender_female ? 'Female' : 'All',
      other_conditions: (s.eligibility_rules.other_conditions ?? []).join(', '),
      required_documents: s.required_documents ?? [],
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingId ?? (form.id || form.name.toLowerCase().replace(/\s+/g, '-')),
      name: form.name,
      name_telugu: form.name_telugu,
      description: form.description,
      required_documents: form.required_documents,
      eligibility_rules: {
        ...(form.max_income && { max_income: Number(form.max_income) }),
        ...(form.land_max_acres && { land_max_acres: Number(form.land_max_acres) }),
        ...(form.caste_categories.length && { caste_categories: form.caste_categories }),
        ...(form.age_min && { age_min: Number(form.age_min) }),
        ...(form.age_max && { age_max: Number(form.age_max) }),
        ...(form.gender === 'Female' && { gender_female: true }),
        ...(form.other_conditions && {
          other_conditions: form.other_conditions.split(',').map((c) => c.trim()).filter(Boolean),
        }),
      },
    };
    const { error } = await supabase.from('schemes').upsert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? 'Scheme updated' : 'Scheme added');
      resetForm();
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Are you sure? This will not delete existing applications for this scheme.')) return;
    const { error } = await supabase.from('schemes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Scheme deleted');
      load();
    }
  };

  const toggleCaste = (c: string) => {
    setForm((f) => ({
      ...f,
      caste_categories: f.caste_categories.includes(c)
        ? f.caste_categories.filter((x) => x !== c)
        : [...f.caste_categories, c],
    }));
  };

  const addDoc = () => {
    if (!newDoc.trim()) return;
    setForm((f) => ({ ...f, required_documents: [...f.required_documents, newDoc.trim()] }));
    setNewDoc('');
  };

  const removeDoc = (i: number) => {
    setForm((f) => ({ ...f, required_documents: f.required_documents.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ap-blue">
            Schemes Management <span className="lang-te text-base text-ap-orangeDark">/ పథకాల నిర్వహణ</span>
          </h1>
          <p className="text-sm text-gray-500">Add, edit, and remove welfare schemes.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ap-orangeDark"
          >
            + Add New Scheme
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={save} className="grid gap-3 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm sm:grid-cols-2">
          <h2 className="col-span-2 text-sm font-semibold text-ap-blue">
            {editingId ? 'Edit Scheme' : 'New Scheme'}
          </h2>
          <input placeholder="Scheme Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm" required />
          <input placeholder="Scheme Name (Telugu)" value={form.name_telugu} onChange={(e) => setForm({ ...form, name_telugu: e.target.value })} className="rounded-lg border border-gray-300 p-2 text-sm lang-te" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 rounded-lg border border-gray-300 p-2 text-sm" rows={2} />

          <fieldset className="col-span-2 space-y-2 rounded-lg border border-gray-200 p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-ap-blue/60">Eligibility Rules</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="text-xs">
                Max income (₹)
                <input type="number" value={form.max_income} onChange={(e) => setForm({ ...form, max_income: e.target.value })} className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm" />
              </label>
              <label className="text-xs">
                Min age
                <input type="number" value={form.age_min} onChange={(e) => setForm({ ...form, age_min: e.target.value })} className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm" />
              </label>
              <label className="text-xs">
                Max age
                <input type="number" value={form.age_max} onChange={(e) => setForm({ ...form, age_max: e.target.value })} className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm" />
              </label>
              <label className="text-xs">
                Max land (acres)
                <input type="number" step="0.1" value={form.land_max_acres} onChange={(e) => setForm({ ...form, land_max_acres: e.target.value })} className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm" />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">Caste categories</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {CASTES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCaste(c)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      form.caste_categories.includes(c)
                        ? 'border-ap-blue bg-ap-blue text-white'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <label className="text-xs">
                Gender
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 block w-32 rounded border border-gray-300 p-1.5 text-sm">
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-xs">
              Other conditions (comma separated)
              <input value={form.other_conditions} onChange={(e) => setForm({ ...form, other_conditions: e.target.value })} className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm" />
            </label>
          </fieldset>

          <fieldset className="col-span-2 rounded-lg border border-gray-200 p-3">
            <legend className="px-1 text-xs font-semibold uppercase text-ap-blue/60">Required Documents</legend>
            <ul className="mb-2 space-y-1">
              {form.required_documents.map((d, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-ap-blue/5 px-2 py-1 text-sm">
                  <span>{d}</span>
                  <button type="button" onClick={() => removeDoc(i)} className="text-xs text-red-600 hover:underline">Remove</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                placeholder="Add a document name"
                className="flex-1 rounded border border-gray-300 p-1.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addDoc(); }
                }}
              />
              <button type="button" onClick={addDoc} className="rounded-full bg-ap-blue px-3 py-1 text-xs font-semibold text-white">
                + Add
              </button>
            </div>
          </fieldset>

          <div className="col-span-2 flex gap-2">
            <button type="submit" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white">
              {editingId ? 'Save Changes' : 'Save Scheme'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-ap-blue/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-ap-blue/5 text-left text-xs uppercase tracking-wide text-ap-blue/60">
            <tr>
              <th className="px-4 py-2">Scheme</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Active Apps</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map((s) => (
              <tr key={s.id} className="border-t border-ap-blue/5">
                <td className="px-4 py-2">
                  <p className="font-medium text-ap-blue">{s.name}</p>
                  <p className="lang-te text-xs text-gray-500">{s.name_telugu}</p>
                </td>
                <td className="px-4 py-2 text-xs text-gray-600">{(s.description ?? '').slice(0, 80)}{(s.description ?? '').length > 80 ? '…' : ''}</td>
                <td className="px-4 py-2 font-semibold text-ap-blue">{counts[s.id] ?? 0}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => edit(s)} className="mr-1 rounded-full border border-ap-blue/20 px-3 py-1 text-xs text-ap-blue hover:bg-ap-blue/5">
                    Edit
                  </button>
                  <button onClick={() => remove(s.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {schemes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No schemes yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
