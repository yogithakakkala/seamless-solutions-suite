import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireAuth from '@/components/RequireAuth';
import RequireCitizen from '@/components/RequireCitizen';
import { UnreadUpdatesProvider } from '@/hooks/useUnreadUpdates';


import Home from '@/pages/Home';
import Landing from '@/pages/Landing';
import { useAuth } from '@/hooks/useAuth';
import Schemes from '@/pages/Schemes';
import SchemeApply from '@/pages/SchemeApply';
import EligibilityCalculator from '@/pages/EligibilityCalculator';
import SchemeRecommender from '@/pages/SchemeRecommender';
import DocumentChecklist from '@/pages/DocumentChecklist';
import ApplicationTracker from '@/pages/ApplicationTracker';
const NearestCenter = lazy(() => import('@/pages/NearestCenter'));
import MyApplications from '@/pages/MyApplications';
import ApplicationDetail from '@/pages/ApplicationDetail';
import Help from '@/pages/Help';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import SachiBot from '@/pages/SachiBot';

import AdminLayout from '@/pages/admin/AdminLayout';
import AdminSchemes from '@/pages/admin/AdminSchemes';
import AdminApplications from '@/pages/admin/AdminApplications';
import AdminApplicationDetail from '@/pages/admin/AdminApplicationDetail';
import AdminContact from '@/pages/admin/AdminContact';
import AdminStatusUpdate from '@/pages/admin/AdminStatusUpdate';
import AdminCenters from '@/pages/admin/AdminCenters';
import AdminGrievances from '@/pages/admin/AdminGrievances';

const citizen = (node: React.ReactNode) => <Layout><RequireCitizen>{node}</RequireCitizen></Layout>;
const citizenAuth = (node: React.ReactNode) => <Layout><RequireCitizen><RequireAuth>{node}</RequireAuth></RequireCitizen></Layout>;

function RootGate() {
  const { user, isStaff, loading, profileLoading } = useAuth();
  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ap-cream">
        <p className="text-sm text-ap-blue/70">Loading…</p>
      </div>
    );
  }
  if (user) return <Navigate to={isStaff ? '/admin' : '/home'} replace />;
  return <Landing />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, profileLoading } = useAuth();
  if (loading || (user && profileLoading)) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }
  if (user) return <Navigate to={isStaff ? '/admin' : '/home'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <UnreadUpdatesProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<RootGate />} />
        <Route path="/home" element={citizenAuth(<Home />)} />
        <Route path="/schemes" element={citizenAuth(<Schemes />)} />
        <Route path="/schemes/:schemeId/apply" element={citizenAuth(<SchemeApply />)} />
        <Route path="/eligibility" element={citizenAuth(<EligibilityCalculator />)} />
        <Route path="/recommender" element={citizenAuth(<SchemeRecommender />)} />
        <Route path="/documents" element={citizenAuth(<DocumentChecklist />)} />
        <Route path="/track" element={citizenAuth(<ApplicationTracker />)} />
        <Route path="/certificate" element={citizenAuth(<ApplicationTracker />)} />

        <Route path="/nearest-center" element={citizenAuth(<Suspense fallback={<p className="p-4 text-sm text-ap-blue/60">Loading map…</p>}><NearestCenter /></Suspense>)} />
        <Route path="/my-applications" element={citizenAuth(<MyApplications />)} />
        <Route path="/my-applications/:applicationId" element={citizenAuth(<ApplicationDetail />)} />
        <Route path="/sachibot" element={citizenAuth(<SachiBot />)} />
        <Route path="/help" element={citizen(<Help />)} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminApplications />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="applications/:applicationId" element={<AdminApplicationDetail />} />
          <Route path="grievances" element={<AdminGrievances />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="schemes" element={<AdminSchemes />} />
          <Route path="centers" element={<AdminCenters />} />
          <Route path="status" element={<AdminStatusUpdate />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UnreadUpdatesProvider>
  );
}
