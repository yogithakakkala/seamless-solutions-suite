import { useLang } from '@/lib/i18n';
import type { ApplicationStatus } from '@/types';

const STEPS: { key: ApplicationStatus | 'final'; en: string; te: string }[] = [
  { key: 'submitted', en: 'Submitted', te: 'సమర్పించబడింది' },
  { key: 'under_review', en: 'Under Review', te: 'సమీక్ష' },
  { key: 'documents_requested', en: 'Docs Requested', te: 'పత్రాలు' },
  { key: 'final', en: 'Decision', te: 'నిర్ణయం' },
];

export default function MiniProgressBar({ status }: { status: ApplicationStatus }) {
  const { lang } = useLang();
  let current = 0;
  if (status === 'submitted') current = 0;
  else if (status === 'under_review') current = 1;
  else if (status === 'documents_requested') current = 2;
  else if (status === 'approved' || status === 'rejected') current = 3;

  const isDecision = status === 'approved' || status === 'rejected';
  const rejected = status === 'rejected';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i <= current;
          const isLast = i === STEPS.length - 1;
          const dotColor = !done
            ? 'bg-gray-300'
            : i === 3 && rejected
              ? 'bg-red-500'
              : i === 3
                ? 'bg-green-500'
                : i === current
                  ? 'bg-ap-orange'
                  : 'bg-ap-blue';
          return (
            <div key={s.key} className="flex items-center">
              <span className={`h-2 w-2 rounded-full ${dotColor} ${i === current && !isDecision ? 'animate-pulse ring-2 ring-ap-orange/40' : ''}`} />
              {!isLast && <span className={`h-0.5 w-4 ${i < current ? 'bg-ap-blue/60' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>
      <span className="text-[10px] font-medium text-gray-600">
        {lang === 'te' ? STEPS[current].te : STEPS[current].en}
        {isDecision && (rejected ? (lang === 'te' ? ' (తిరస్కరణ)' : ' (rejected)') : (lang === 'te' ? ' (ఆమోదం)' : ' (approved)'))}
      </span>
    </div>
  );
}