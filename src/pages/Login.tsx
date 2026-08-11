import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { fetchIsStaff } from '@/hooks/useAuth';
import AuthShell from './AuthShell';

export default function Login() {

  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo;
  const flash = (location.state as { flash?: string } | null)?.flash;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(flash ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (flash) window.history.replaceState({}, '');
  }, [flash]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(
        lang === 'te'
          ? 'తప్పు ఇమెయిల్ లేదా పాస్‌వర్డ్. మళ్ళీ ప్రయత్నించండి.'
          : 'Incorrect email or password. Please try again.',
      );
      setLoading(false);
      return;
    }

    const isStaff = await fetchIsStaff(data.user.id);
    navigate(redirectTo ?? (isStaff ? '/admin' : '/home'), { replace: true });
    setLoading(false);
  };





  return (
    <AuthShell>
      <h1 className="text-xl font-bold text-ap-blue">Login / <span className="lang-te">లాగిన్</span></h1>
      <p className="mt-1 text-xs text-gray-500">
        Log in to apply for schemes and track your applications.
      </p>
      <p className="lang-te mt-0.5 text-xs text-gray-400">
        పథకాలకు దరఖాస్తు చేయడానికి లాగిన్ అవ్వండి.
      </p>

      {notice && <p className="mt-4 rounded-lg bg-green-50 p-2.5 text-sm text-green-700">{notice}</p>}

      <form onSubmit={handleLogin} className="mt-4 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email / ఇమెయిల్"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Password / పాస్‌వర్డ్"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-ap-blue"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-lg bg-ap-orange font-bold text-white hover:bg-ap-orangeDark disabled:opacity-60"
        >
          {loading ? '...' : 'Login / లాగిన్'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-ap-orange hover:underline">
          Sign Up
        </Link>{' '}
        <span className="lang-te">/ ఖాతా లేదా? నమోదు చేయండి</span>
      </p>
    </AuthShell>
  );
}
