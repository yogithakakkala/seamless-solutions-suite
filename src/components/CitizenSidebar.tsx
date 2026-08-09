import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  ListChecks,
  Calculator,
  Sparkles,
  ClipboardList,
  BadgeCheck,
  MapPin,
  FolderClock,
  Bot,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Languages,
  User,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';

const items = [
  { to: '/', en: 'Home', te: 'హోమ్', Icon: Home, end: true },
  { to: '/schemes', en: 'Schemes', te: 'పథకాలు', Icon: ListChecks },
  { to: '/eligibility', en: 'Eligibility Calculator', te: 'అర్హత గణన', Icon: Calculator },
  { to: '/recommender', en: 'Scheme Recommender', te: 'పథకం సిఫార్సు', Icon: Sparkles },
  { to: '/documents', en: 'Document Checklist', te: 'పత్రాల చెక్‌లిస్ట్', Icon: ClipboardList },
  { to: '/track', en: 'Application Tracker', te: 'దరఖాస్తు ట్రాకర్', Icon: BadgeCheck },
  { to: '/nearest-center', en: 'Nearest Center', te: 'సమీప కేంద్రం', Icon: MapPin },
  { to: '/my-applications', en: 'My Applications', te: 'నా దరఖాస్తులు', Icon: FolderClock, showUnread: true },
  { to: '/sachibot', en: 'SachiBot', te: 'సచీబాట్', Icon: Bot },
  { to: '/help', en: 'Help', te: 'సహాయం', Icon: HelpCircle },
];

export default function CitizenSidebar() {
  const { lang, toggle } = useLang();
  const { user, profile, signOut } = useAuth();
  const { totalUnread } = useUnreadUpdates();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || (lang === 'te' ? 'అతిథి' : 'Guest');
  const initial = (displayName[0] || '?').toUpperCase();

  const content = (
    <div className="flex h-full w-[250px] flex-col bg-white shadow-lg">
      <div className="border-b border-ap-blue/10 p-4">
        <NavLink to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ap-orange bg-ap-blue text-sm font-bold text-white">
            AP
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-ap-blue">SachiSeva AP</p>
            <p className="lang-te text-[11px] text-ap-orangeDark">సచిసేవ ఆంధ్రప్రదేశ్</p>
          </div>
        </NavLink>

        {user && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-ap-blue/5 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ap-orange text-xs font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ap-blue">{displayName}</p>
              <p className="truncate text-[10px] text-gray-500">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-full border border-ap-blue/20 px-3 py-1.5 text-xs font-medium text-ap-blue hover:bg-ap-blue/5"
        >
          <Languages size={14} />
          {lang === 'en' ? 'తెలుగు' : 'English'}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map(({ to, en, te, Icon, end, showUnread }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'border-ap-orange bg-ap-blue/10 text-ap-blue'
                  : 'border-transparent text-gray-600 hover:bg-ap-blue/5 hover:text-ap-blue'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate">{en}</p>
              <p className="lang-te truncate text-[10px] text-gray-500">{te}</p>
            </div>
            {showUnread && totalUnread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ap-blue/10 p-2">
        {user ? (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            <div className="leading-tight">
              <p>Logout</p>
              <p className="lang-te text-[10px] text-red-400">లాగ్అవుట్</p>
            </div>
          </button>
        ) : (
          <NavLink
            to="/login"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg bg-ap-orange px-3 py-2.5 text-sm font-semibold text-white hover:bg-ap-orangeDark"
          >
            <User size={18} />
            {lang === 'te' ? 'లాగిన్' : 'Login'}
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile + tablet top bar (56px) */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ap-blue/10 bg-white px-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ap-blue hover:bg-ap-blue/5"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <NavLink to="/" className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ap-orange bg-ap-blue text-xs font-bold text-white">
            AP
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-bold text-ap-blue">SachiSeva</p>
            <p className="lang-te truncate text-[10px] text-ap-orangeDark">సచిసేవ</p>
          </div>
        </NavLink>
        <button
          onClick={toggle}
          className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-ap-blue/20 px-2.5 text-sm font-medium text-ap-blue hover:bg-ap-blue/5"
          aria-label="Toggle language"
        >
          <Languages size={16} />
          {lang === 'en' ? 'తె' : 'EN'}
        </button>
        {user ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ap-orange text-xs font-bold text-white">
            {initial}
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-ap-orange px-3 text-sm font-semibold text-white"
          >
            <User size={16} />
          </NavLink>
        )}
      </div>

      {/* Desktop sidebar (always visible above 1024px) */}
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">{content}</aside>

      {/* Mobile/tablet drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-ap-blue shadow"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            {content}
          </div>
        </>
      )}
    </>
  );
}
