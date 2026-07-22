import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

export default function AdminStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_staff, created_at')
      .eq('is_staff', true)
      .order('created_at', { ascending: false });
    setStaff((data as Profile[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const { error: rpcError } = await supabase.rpc('set_staff_status', {
      _target_id: userId.trim(),
      _new_value: true,
    });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setInfo('Staff access granted (if that User ID exists).');
    setUserId('');
    load();
  };

  const revoke = async (id: string) => {
    if (id === user?.id) {
      if (!confirm('This will remove your own staff access and sign you out of the admin panel. Continue?')) return;
    }
    await supabase.rpc('set_staff_status', { _target_id: id, _new_value: false });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ap-blue">Staff Accounts</h1>
      <p className="text-sm text-gray-500">
        New staff should usually sign up via the Create Account page with the admin key. Use this only to
        promote an existing citizen account (paste their User ID, visible in Supabase Auth) or to revoke access.
      </p>

      <form onSubmit={grant} className="flex flex-wrap gap-2 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <input
          placeholder="User ID (uuid)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 p-2 text-sm"
          required
        />
        <button type="submit" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white">
          Grant Staff Access
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}

      <ul className="space-y-2">
        {staff.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border border-ap-blue/10 bg-white p-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-ap-blue">{s.full_name ?? '(no name)'}</p>
              <p className="text-xs text-gray-400">{s.email ?? s.id}</p>
            </div>
            <button onClick={() => revoke(s.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600">
              Revoke
            </button>
          </li>
        ))}
        {staff.length === 0 && <p className="text-sm text-gray-500">No staff accounts yet.</p>}
      </ul>
    </div>
  );
}
