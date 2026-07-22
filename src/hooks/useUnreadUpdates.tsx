import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Application, ApplicationMessage } from '@/types';

interface AppSummary {
  id: string;
  scheme_name: string;
  updated_at: string;
  last_staff_message_at: string | null;
}

interface UnreadCtx {
  unreadByApp: Record<string, number>;
  totalUnread: number;
  markSeen: (appId: string) => void;
}

const Ctx = createContext<UnreadCtx>({ unreadByApp: {}, totalUnread: 0, markSeen: () => {} });

const lastSeenKey = (uid: string, appId: string) => `sachiseva:lastSeen:${uid}:${appId}`;

function getLastSeen(uid: string, appId: string): number {
  const v = typeof window !== 'undefined' ? window.localStorage.getItem(lastSeenKey(uid, appId)) : null;
  return v ? Number(v) : 0;
}

function setLastSeenNow(uid: string, appId: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(lastSeenKey(uid, appId), String(Date.now()));
}

export function UnreadUpdatesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setApps([]);
      return;
    }
    const uid = user.id;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('applications')
        .select('id, updated_at, scheme:schemes(name, name_telugu)')
        .eq('user_id', uid);
      if (cancelled || !data) return;
      setApps(
        (data as unknown as Array<{ id: string; updated_at: string; scheme: { name: string } | null }>).map((a) => ({
          id: a.id,
          scheme_name: a.scheme?.name ?? 'your application',
          updated_at: a.updated_at,
          last_staff_message_at: null,
        })),
      );
    })();

    const channel = supabase
      .channel('unread-updates-' + uid)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const row = payload.new as Application;
          setApps((prev) => prev.map((a) => (a.id === row.id ? { ...a, updated_at: row.updated_at } : a)));
          const app = apps.find((a) => a.id === row.id);
          toast(`Update on your ${app?.scheme_name ?? 'application'}`, {
            description: `Status: ${row.status.replace('_', ' ')} — tap to view`,
            action: { label: 'View', onClick: () => navigate(`/my-applications/${row.id}`) },
          });
          setTick((t) => t + 1);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'application_messages' },
        (payload) => {
          const msg = payload.new as ApplicationMessage;
          if (msg.sender_type !== 'staff') return;
          setApps((prev) => {
            const match = prev.find((a) => a.id === msg.application_id);
            if (!match) return prev; // not this user's application (RLS should already filter, but be safe)
            toast(`New message on your ${match.scheme_name}`, {
              description: msg.is_document_request
                ? `📎 Document requested: ${msg.requested_document_type ?? ''}`
                : (msg.message ?? '').slice(0, 90),
              action: { label: 'View', onClick: () => navigate(`/my-applications/${msg.application_id}`) },
            });
            return prev.map((a) =>
              a.id === msg.application_id ? { ...a, last_staff_message_at: msg.created_at } : a,
            );
          });
          setTick((t) => t + 1);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unreadByApp = useMemo(() => {
    if (!user) return {};
    const uid = user.id;
    const map: Record<string, number> = {};
    for (const a of apps) {
      const seen = getLastSeen(uid, a.id);
      const updatedTs = new Date(a.updated_at).getTime();
      const msgTs = a.last_staff_message_at ? new Date(a.last_staff_message_at).getTime() : 0;
      let count = 0;
      if (updatedTs > seen) count += 1;
      if (msgTs > seen) count += 1;
      if (count > 0) map[a.id] = count;
    }
    return map;
    // tick forces re-eval after localStorage writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, user?.id, tick]);

  const totalUnread = useMemo(() => Object.values(unreadByApp).reduce((s, n) => s + n, 0), [unreadByApp]);

  const markSeen = useCallback(
    (appId: string) => {
      if (!user) return;
      setLastSeenNow(user.id, appId);
      setTick((t) => t + 1);
    },
    [user],
  );

  return <Ctx.Provider value={{ unreadByApp, totalUnread, markSeen }}>{children}</Ctx.Provider>;
}

export function useUnreadUpdates() {
  return useContext(Ctx);
}
