import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApplicationStatus, CertificateStatus } from '@/types';

const appStatuses: ApplicationStatus[] = ['submitted', 'under_review', 'documents_requested', 'approved', 'rejected'];
const certStatuses: CertificateStatus[] = ['pending', 'ready', 'collected'];

interface Counts {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  totalCertificates: number;
  certificatesByStatus: Record<string, number>;
  totalCitizens: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      const [apps, certs, citizens] = await Promise.all([
        supabase.from('applications').select('status'),
        supabase.from('certificate_requests').select('status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_staff', false),
      ]);

      const applicationsByStatus: Record<string, number> = {};
      for (const s of appStatuses) applicationsByStatus[s] = 0;
      (apps.data ?? []).forEach((a) => {
        applicationsByStatus[a.status] = (applicationsByStatus[a.status] ?? 0) + 1;
      });

      const certificatesByStatus: Record<string, number> = {};
      for (const s of certStatuses) certificatesByStatus[s] = 0;
      (certs.data ?? []).forEach((c) => {
        certificatesByStatus[c.status] = (certificatesByStatus[c.status] ?? 0) + 1;
      });

      setCounts({
        totalApplications: apps.data?.length ?? 0,
        applicationsByStatus,
        totalCertificates: certs.data?.length ?? 0,
        certificatesByStatus,
        totalCitizens: citizens.count ?? 0,
      });
    })();
  }, []);

  if (!counts) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ap-blue">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total applications" value={counts.totalApplications} />
        <StatCard label="Total certificate requests" value={counts.totalCertificates} />
        <StatCard label="Registered citizens" value={counts.totalCitizens} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">Applications by status</p>
          <ul className="space-y-1.5 text-sm">
            {appStatuses.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{s.replace('_', ' ')}</span>
                <span className="font-semibold text-ap-blue">{counts.applicationsByStatus[s]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">Certificates by status</p>
          <ul className="space-y-1.5 text-sm">
            {certStatuses.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{s}</span>
                <span className="font-semibold text-ap-blue">{counts.certificatesByStatus[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ap-blue/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ap-blue">{value}</p>
    </div>
  );
}
