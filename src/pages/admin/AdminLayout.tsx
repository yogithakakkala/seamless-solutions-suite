import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-ap-cream lg:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-auto px-4 py-6 text-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
