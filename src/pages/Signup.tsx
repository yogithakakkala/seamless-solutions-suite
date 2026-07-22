import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError(lang === 'te' ? 'పూర్తి పేరు అవసరం.' : 'Full name is required.');
      return;
    }
    if (password.length < 6) {
      setError(
        lang === 'te'
          ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు.'
          : 'Password must be at least 6 characters.',
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'te' ? 'పాస్‌వర్డ్‌లు సరిపోలలేదు.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account.');
      setLoading(false);
      return;
    }

    if (adminKey.trim() && data.session) {
      await supabase.functions.invoke('claim-staff-role', {
        body: { key: adminKey.trim() },
      });
    }

    // Force a clean login flow so redirect logic runs against a fresh session.
    await supabase.auth.signOut();

    navigate('/login', {
      replace: true,
      state: {
        flash:
          lang === 'te'
            ? 'ఖాతా సృష్టించబడింది! ఇప్పుడు లాగిన్ అవ్వండి.'
            : 'Account created! You can now log in.',
      },
    });
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-xl border border-ap-blue/10 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ap-blue">
        {lang === 'te' ? 'ఖాతా సృష్టించండి' : 'Create Account'}
      </h1>

      <form onSubmit={handleSignup} className="space-y-3">
        <input
          required
          placeholder={lang === 'te' ? 'పూర్తి పేరు' : 'Full name'}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
        />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={lang === 'te' ? 'ఇమెయిల్' : 'Email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder={lang === 'te' ? 'పాస్‌వర్డ్ (కనీసం 6)' : 'Password (min 6)'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 pr-10 text-sm"
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
        <input
          type={showPassword ? 'text' : 'password'}
          required
          placeholder={lang === 'te' ? 'పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
        />
        <div>
          <input
            type="password"
            placeholder={lang === 'te' ? 'సిబ్బంది కీ (ఐచ్ఛికం)' : 'Staff Key (optional)'}
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            {lang === 'te'
              ? 'పౌరులు దీన్ని ఖాళీగా వదిలేయండి.'
              : 'Leave blank if you are a citizen.'}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ap-orange py-2.5 font-semibold text-white hover:bg-ap-orangeDark disabled:opacity-60"
        >
          {loading ? '...' : lang === 'te' ? 'ఖాతా సృష్టించండి' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        {lang === 'te' ? 'ఇప్పటికే ఖాతా ఉందా?' : 'Already have an account?'}{' '}
        <Link
          to="/login"
          state={location.state}
          className="font-semibold text-ap-orange hover:underline"
        >
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
