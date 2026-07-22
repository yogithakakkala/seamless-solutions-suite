import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Blocks staff accounts from viewing citizen-facing pages.
 * Non-staff users (including anonymous) can pass through.
 */
export default function RequireCitizen({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, profileLoading } = useAuth();
  if (loading || (user && profileLoading)) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }
  if (user && isStaff) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
