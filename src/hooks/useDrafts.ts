import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ApplicationDraft } from '@/types';

export function useDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setDrafts([]); setLoading(false); return; }
    const { data } = await supabase
      .from('application_drafts')
      .select('*, scheme:schemes(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setDrafts((data as unknown as ApplicationDraft[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    await supabase.from('application_drafts').delete().eq('id', id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return { drafts, loading, reload: load, remove };
}