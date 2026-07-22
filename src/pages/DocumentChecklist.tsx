import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, MapPin, Plus, Upload } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { COMMON_DOCUMENTS } from '@/data/documentOffices';
import { useMissingDocuments } from '@/hooks/useMissingDocuments';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ListenButton from '@/components/ListenButton';

export default function DocumentChecklist() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { status, markHave, loggedIn } = useMissingDocuments(COMMON_DOCUMENTS.map((d) => d.en));
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const total = status.length;
  const ready = status.filter((s) => s.present).length;
  const allReady = total > 0 && ready === total;

  const uploadFor = async (docType: string, file: File) => {
    if (!user) return;
    setUploadingFor(docType);
    try {
      const path = `${user.id}/user-docs/${docType}-${file.name}`;
      const { error } = await supabase.storage.from('applications').upload(path, file, { upsert: true });
      if (error) throw error;
      await supabase
        .from('user_documents')
        .insert({ user_id: user.id, document_type: docType, file_url: path });
      // Refresh via markHave-like state - simplest is a full re-fetch by page reload of the hook;
      // useMissingDocuments already listens on user; force by toggling openId to null.
      setOpenId(null);
      window.location.reload();
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ap-blue">
          {lang === 'te' ? 'పత్రాల చెక్‌లిస్ట్' : 'Document Checklist'}
        </h1>
        <ListenButton
          text={
            lang === 'te'
              ? 'ఇక్కడ మీ పత్రాల చెక్‌లిస్ట్ ఉంది. మీకు ఉన్న పత్రాలను గుర్తు పెట్టండి.'
              : 'Here is your document checklist. Mark or upload documents you already have.'
          }
        />
      </div>

      {!loggedIn ? (
        <div className="rounded-xl border border-ap-blue/10 bg-white p-5 text-center shadow-sm">
          <p className="mb-3 text-gray-700">
            {lang === 'te'
              ? 'మీ పత్రాలను ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.'
              : 'Log in to track your documents.'}
          </p>
          <Link to="/login" className="rounded-full bg-ap-orange px-4 py-2 text-sm font-medium text-white">
            {lang === 'te' ? 'లాగిన్' : 'Login'}
          </Link>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-ap-blue">
                {lang === 'te'
                  ? `${total} లో ${ready} పత్రాలు సిద్ధంగా ఉన్నాయి`
                  : `${ready} of ${total} documents ready`}
              </p>
              <p className="text-xs text-gray-500">{Math.round((ready / Math.max(total, 1)) * 100)}%</p>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-ap-orange transition-all"
                style={{ width: `${(ready / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </div>

          {allReady && (
            <div className="flex items-start gap-3 rounded-xl border-2 border-green-400 bg-green-50 p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 flex-shrink-0 text-green-600" size={22} />
              <p className="text-sm font-semibold text-green-800">
                {lang === 'te'
                  ? '✅ మీ దగ్గర అన్ని సాధారణ పత్రాలు సిద్ధంగా ఉన్నాయి! ఇప్పుడు మీరు పథకాలకు దరఖాస్తు చేయవచ్చు.'
                  : '✅ You have all common documents ready! You can now apply for schemes.'}
              </p>
            </div>
          )}

          {/* Document cards */}
          <ul className="space-y-2">
            {status.map((s) => {
              const doc = COMMON_DOCUMENTS.find((d) => d.en === s.docType);
              const teName = doc?.te ?? s.docType;
              const isOpen = openId === s.docType;
              return (
                <li
                  key={s.docType}
                  className="overflow-hidden rounded-xl border border-ap-blue/10 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ap-blue/10 text-ap-blue">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ap-blue">
                        {s.docType}
                        <span className="lang-te text-xs font-normal text-gray-500"> / {teName}</span>
                      </p>
                    </div>
                    {s.present ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} /> {lang === 'te' ? 'ఉంది' : 'Have it'}
                      </span>
                    ) : (
                      <button
                        onClick={() => setOpenId(isOpen ? null : s.docType)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-ap-orange text-white hover:bg-ap-orangeDark"
                        aria-label="Expand options"
                      >
                        <Plus size={16} className={`transition ${isOpen ? 'rotate-45' : ''}`} />
                      </button>
                    )}
                  </div>

                  {isOpen && !s.present && (
                    <div className="space-y-3 border-t border-ap-blue/10 bg-ap-blue/[.03] p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => markHave(s.docType)}
                          className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-white px-4 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 size={14} /> {lang === 'te' ? 'ఉంది అని గుర్తించండి' : 'Mark as Available'}
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-ap-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-ap-blue/90">
                          <Upload size={14} />
                          {uploadingFor === s.docType
                            ? lang === 'te' ? 'అప్‌లోడ్...' : 'Uploading...'
                            : lang === 'te' ? 'పత్రాన్ని అప్‌లోడ్ చేయండి' : 'Upload Document'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFor(s.docType, f);
                            }}
                          />
                        </label>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-xs text-gray-600">
                        <p>
                          <span className="font-semibold text-ap-blue">
                            {lang === 'te' ? 'ఎక్కడ పొందాలి: ' : 'Where to get this: '}
                          </span>
                          {s.office.issuing_office_type}
                        </p>
                        <Link
                          to="/nearest-center"
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-ap-orange px-3 py-1 text-[11px] font-semibold text-white hover:bg-ap-orangeDark"
                        >
                          <MapPin size={12} /> {lang === 'te' ? 'సమీప కేంద్రాన్ని కనుగొనండి' : 'Find Nearest Center'}
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
