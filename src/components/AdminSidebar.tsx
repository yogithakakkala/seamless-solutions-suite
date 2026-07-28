import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileCog,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Languages,
  ShieldCheck,
  AlertOctagon,
  Building2,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const items = [
  { to: '/admin', en: 'Applications', te: 'అర్జీలు', Icon: LayoutDashboard, end: true },
  { to: '/admin/grievances', en: 'Grievances', te: 'ఫిర్యాదులు', Icon: AlertOctagon, badgeKey: 'grievances' as const },
  { to: '/admin/contact', en: 'Contact Applicant', te: 'అభ్యర్థిని సంప్రదించండి', Icon: MessageSquare },
  { to: '/admin/schemes', en: 'Schemes Management', te: 'పథకాల నిర్వహణ', Icon: FileCog },
  { to: '/admin/centers', en: 'Centers', te: 'కేంద్రాలు', Icon: Building2 },
  { to: '/admin/status', en: 'Status Update', te: 'స్థితి నవీకరణ', Icon: RefreshCw },
];

export default function AdminSidebar() {
  const { lang, toggle } = useLang();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [unackCount, setUnackCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase.from('grievances').select('id', { count: 'exact', head: true }).eq('status', 'raised');
      setUnackCount(count ?? 0);
    };
    load();
    const ch = supabase.channel('sb-griev').on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff';
  const initial = (displayName[0] || 'S').toUpperCase();

  const content = (
    <div className="flex h-full w-[250px] flex-col bg-ap-blue text-white shadow-lg">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ap-orange bg-white text-sm font-bold text-ap-blue">
            AP
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Admin Panel</p>
            <p className="lang-te text-[11px] text-ap-orange">అడ్మిన్ పానెల్</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ap-orange text-xs font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-ap-orange/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
              <ShieldCheck size={10} /> Staff
            </span>
          </div>
        </div>

        <button
          onClick={toggle}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          <Languages size={14} />
          {lang === 'en' ? 'తెలుగు' : 'English'}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map(({ to, en, te, Icon, end, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'border-ap-orange bg-white/15 text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate">{en}</p>
              <p className="lang-te truncate text-[10px] opacity-70">{te}</p>
            </div>
            {badgeKey === 'grievances' && unackCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unackCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20"
        >
          <LogOut size={18} />
          <div className="leading-tight">
            <p>Logout</p>
            <p className="lang-te text-[10px] opacity-70">లాగ్అవుట్</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ap-blue/10 bg-ap-blue px-4 py-3 text-white md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <p className="text-base font-bold">Admin Panel</p>
        <div className="w-10" />
      </div>

      <aside className="sticky top-0 hidden h-screen md:block">{content}</aside>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-ap-blue shadow"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {content}
          </div>
        </>
      )}
    </>
  );
}
