import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ redirectTo: location.pathname + location.search }}
      />
    );
  }
  if (isStaff) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
