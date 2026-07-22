import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-ap-cream md:flex-row">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
