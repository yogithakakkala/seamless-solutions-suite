import { NavLink } from 'react-router-dom';
import {
  ListChecks,
  Calculator,
  ClipboardList,
  BadgeCheck,
  MapPin,
  FolderClock,
} from 'lucide-react';
import { useLang } from '@/lib/i18n';

const items = [
  { to: '/schemes', key: 'schemes' as const, Icon: ListChecks },
  { to: '/eligibility', key: 'eligibility' as const, Icon: Calculator },
  { to: '/documents', key: 'documents' as const, Icon: ClipboardList },
  { to: '/certificate', key: 'certificate' as const, Icon: BadgeCheck },
  { to: '/nearest-center', key: 'nearestCenter' as const, Icon: MapPin },
  { to: '/my-applications', key: 'myApplications' as const, Icon: FolderClock },
];

export default function Nav() {
  const { t } = useLang();

  return (
    <nav className="sticky bottom-0 z-40 border-t border-ap-blue/10 bg-white">
      <div className="mx-auto flex max-w-5xl overflow-x-auto">
        {items.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-[76px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium ${
                isActive ? 'text-ap-orange' : 'text-ap-blue/60'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-center leading-tight">{t(key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
