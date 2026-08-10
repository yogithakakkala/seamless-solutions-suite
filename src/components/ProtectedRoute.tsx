import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, profileLoading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center text-sm text-gray-600">
        Connect Supabase (see .env.example) to enable the staff Admin Panel.
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profileLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!isStaff) return <Navigate to="/home" replace />;

  return <>{children}</>;
}
