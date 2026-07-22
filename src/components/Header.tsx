import { Link, useNavigate } from 'react-router-dom';
import { Languages, LogOut, User, ShieldCheck } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { lang, toggle, t } = useLang();
  const { user, isStaff, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ap-blue/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ap-orange bg-ap-blue text-sm font-bold text-white">
            AP
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-ap-blue">SachiSeva</p>
            <p className="lang-te text-xs text-ap-orangeDark">సచిసేవ</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="flex items-center gap-1 rounded-full border border-ap-blue/20 px-3 py-1.5 text-sm font-medium text-ap-blue hover:bg-ap-blue/5"
            aria-label="Toggle language"
          >
            <Languages size={16} />
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>

          {user ? (
            <>
              {isStaff && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-full bg-ap-blue/5 px-3 py-1.5 text-sm font-medium text-ap-blue hover:bg-ap-blue/10"
                >
                  <ShieldCheck size={16} />
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-full bg-ap-blue/5 px-3 py-1.5 text-sm font-medium text-ap-blue hover:bg-ap-blue/10"
              >
                <LogOut size={16} />
                {t('logout')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 rounded-full bg-ap-orange px-3 py-1.5 text-sm font-medium text-white hover:bg-ap-orangeDark"
            >
              <User size={16} />
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
