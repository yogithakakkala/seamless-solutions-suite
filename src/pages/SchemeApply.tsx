import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useLang } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SCHEMES_SEED } from '@/data/schemesSeed';
import { useAuth } from '@/hooks/useAuth';
import MissingDocumentsWarning from '@/components/MissingDocumentsWarning';
import type { Scheme, SubmittedDocument } from '@/types';

export default function SchemeApply() {
  const { schemeId } = useParams();
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scheme, setScheme] = useState<Scheme | undefined>(
    SCHEMES_SEED.find((s) => s.id === schemeId)
  );
  const [details, setDetails] = useState({
    full_name: searchParams.get('full_name') || '',
    phone: searchParams.get('phone') || '',
    address: searchParams.get('address') || '',
    income: searchParams.get('income') || '',
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploadedDocs, setUploadedDocs] = useState<SubmittedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tokenNumber, setTokenNumber] = useState<string | null>(null);
  const [newAppId, setNewAppId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [draftDialog, setDraftDialog] = useState<null | { updated_at: string; id: string; data: Record<string, unknown> }>(null);
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !schemeId) return;
    supabase
      .from('schemes')
      .select('*')
      .eq('id', schemeId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setScheme(data as Scheme);
      });
  }, [schemeId]);

  // Load existing draft
  useEffect(() => {
    if (!user || !schemeId) return;
    supabase.from('application_drafts')
      .select('*')
      .eq('user_id', user.id).eq('scheme_id', schemeId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDraftDialog({ updated_at: data.updated_at, id: data.id, data: data.draft_data as Record<string, unknown> });
          draftIdRef.current = data.id;
        }
      });
  }, [user, schemeId]);

  // Compute completion %
  const computeCompletion = () => {
    if (!scheme) return 0;
    const requiredFields = ['full_name', 'phone', 'address', 'income'] as const;
    const filled = requiredFields.filter((f) => details[f]).length;
    const requiredDocs = scheme.required_documents.length;
    const docsUploaded = uploadedDocs.length + Object.values(files).filter(Boolean).length;
    const totalItems = requiredFields.length + requiredDocs;
    const doneItems = filled + Math.min(docsUploaded, requiredDocs);
    return Math.round((doneItems / Math.max(totalItems, 1)) * 100);
  };

  const saveDraft = async () => {
    if (!user || !scheme) return;
    const payload = {
      user_id: user.id,
      scheme_id: scheme.id,
      draft_data: { details, uploaded: uploadedDocs } as unknown as never,
      completion_percentage: computeCompletion(),
    };
    const { data, error: err } = await supabase.from('application_drafts')
      .upsert(payload, { onConflict: 'user_id,scheme_id' })
      .select().maybeSingle();
    if (!err && data) {
      draftIdRef.current = data.id;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSavedIndicator(now);
      window.setTimeout(() => setSavedIndicator(null), 3000);
      dirtyRef.current = false;
    }
  };

  // Debounced 30s autosave
  useEffect(() => {
    if (submitted || !user || !scheme) return;
    dirtyRef.current = true;
    const t = window.setTimeout(() => { if (dirtyRef.current) saveDraft(); }, 30000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, uploadedDocs]);

  // beforeunload warning if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !submitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [submitted]);

  const applyDraft = () => {
    if (!draftDialog) return;
    const d = draftDialog.data as { details?: typeof details; uploaded?: SubmittedDocument[] };
    if (d.details) setDetails({ ...details, ...d.details });
    if (d.uploaded) setUploadedDocs(d.uploaded);
    setDraftDialog(null);
  };
  const discardDraft = async () => {
    if (draftDialog) await supabase.from('application_drafts').delete().eq('id', draftDialog.id);
    draftIdRef.current = null;
    setDraftDialog(null);
  };

  if (!scheme) {
    return <p className="text-sm text-gray-500">{lang === 'te' ? 'పథకం కనుగొనబడలేదు.' : 'Scheme not found.'}</p>;
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-ap-blue/10 bg-white p-5 text-center shadow-sm">
        <p className="mb-3 text-gray-700">
          {lang === 'te'
            ? 'దరఖాస్తు చేయడానికి దయచేసి లాగిన్ అవ్వండి.'
            : 'Please log in to apply for this scheme.'}
        </p>
        <Link
          to="/login"
          state={{ redirectTo: `/schemes/${scheme.id}/apply` }}
          className="rounded-full bg-ap-orange px-4 py-2 text-sm font-medium text-white hover:bg-ap-orangeDark"
        >
          {t('login')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!isSupabaseConfigured) throw new Error('Supabase not configured');

      // Only documents known upfront (the scheme's required_documents) are
      // collected here. Anything staff realize they still need afterward is
      // requested through the message thread on the citizen's application.
      const submittedDocuments: SubmittedDocument[] = [...uploadedDocs];
      for (const doc of scheme.required_documents) {
        const file = files[doc];
        if (file) {
          const path = `${user.id}/${scheme.id}/${doc}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(path, file, { upsert: true });
          if (uploadError) throw uploadError;
          const idx = submittedDocuments.findIndex((s) => s.document_type === doc);
          if (idx >= 0) submittedDocuments[idx] = { document_type: doc, file_url: path };
          else submittedDocuments.push({ document_type: doc, file_url: path });
          // Also save draft after each file upload
          setUploadedDocs(submittedDocuments);
          await saveDraft();
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          scheme_id: scheme.id,
          status: 'submitted',
          applicant_details: details,
          submitted_documents: submittedDocuments as unknown as never,
        })
        .select('id, token_number')
        .single();
      if (insertError) throw insertError;

      setTokenNumber(inserted?.token_number ?? null);
      setNewAppId(inserted?.id ?? null);
      dirtyRef.current = false;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="font-semibold text-green-700">
          {lang === 'te' ? 'దరఖాస్తు విజయవంతంగా సమర్పించబడింది!' : 'Application submitted successfully!'}
        </p>
        <p className="mt-1 text-sm text-green-700/80">
          {lang === 'te'
            ? 'సిబ్బంది దీన్ని సమీక్షిస్తారు. అదనపు పత్రాలు అవసరమైతే, మీకు మెసేజ్ వస్తుంది.'
            : "Staff will review it — if they need anything else, you'll get a message on this application."}
        </p>
        {tokenNumber && (
          <div className="mx-auto mt-3 max-w-xs rounded-xl border border-green-300 bg-white p-3">
            <p className="text-xs font-medium text-gray-600">
              {lang === 'te' ? 'మీ దరఖాస్తు నంబర్' : 'Your application number'}
            </p>
            <p className="mt-1 select-all font-mono text-lg font-bold text-ap-blue">{tokenNumber}</p>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(tokenNumber);
                toast.success(lang === 'te' ? 'కాపీ చేయబడింది' : 'Copied');
              }}
              className="mt-2 rounded-full border border-ap-blue/30 px-3 py-1 text-xs font-semibold text-ap-blue"
            >
              {lang === 'te' ? 'కాపీ చేయండి' : 'Copy'}
            </button>
            <p className="mt-2 text-[11px] text-gray-500">
              {lang === 'te'
                ? 'ట్రాకర్ పేజీలో ఈ నంబర్‌తో స్థితిని ఎప్పుడైనా చూడవచ్చు.'
                : 'Use this number on the Tracker page to check status anytime.'}
            </p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => navigate('/my-applications')}
            className="rounded-full bg-ap-blue px-4 py-2 text-sm font-medium text-white hover:bg-ap-blueLight"
          >
            {t('myApplications')}
          </button>
          {tokenNumber && (
            <button
              onClick={() => navigate(`/track?token=${encodeURIComponent(tokenNumber)}`)}
              className="rounded-full border border-ap-blue/30 px-4 py-2 text-sm font-medium text-ap-blue"
            >
              {lang === 'te' ? 'దరఖాస్తును ట్రాక్ చేయండి' : 'Track application'}
            </button>
          )}
          {newAppId && (
            <button
              onClick={() => navigate(`/my-applications/${newAppId}`)}
              className="rounded-full border border-ap-blue/30 px-4 py-2 text-sm font-medium text-ap-blue"
            >
              {lang === 'te' ? 'వివరాలు చూడండి' : 'View details'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {savedIndicator && (
        <div className="fixed right-4 top-4 z-40 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {lang === 'te' ? `ముసాయిదా సేవ్ అయింది ${savedIndicator}` : `Draft saved ${savedIndicator}`}
        </div>
      )}

      {draftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-base font-bold text-ap-blue">
              {lang === 'te' ? 'అసంపూర్ణ దరఖాస్తు' : 'Unfinished application'}
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              {lang === 'te'
                ? `మీకు ఈ పథకానికి అసంపూర్ణ దరఖాస్తు ఉంది (చివరిగా ${new Date(draftDialog.updated_at).toLocaleString()}). కొనసాగించాలా?`
                : `You have an unfinished application for this scheme (last saved ${new Date(draftDialog.updated_at).toLocaleString()}). Continue where you left off?`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={discardDraft} className="rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-700">
                {lang === 'te' ? 'కొత్తగా ప్రారంభించు' : 'Start Fresh'}
              </button>
              <button onClick={applyDraft} className="rounded-full bg-ap-orange px-3 py-1.5 text-xs font-semibold text-white">
                {lang === 'te' ? 'ముసాయిదా కొనసాగించు' : 'Continue Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-ap-blue">{lang === 'te' ? scheme.name_telugu : scheme.name}</h1>
      <p className="text-sm text-gray-600">{scheme.description}</p>

      <MissingDocumentsWarning requiredDocuments={scheme.required_documents} />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ap-blue">
              {lang === 'te' ? 'పూర్తి పేరు' : 'Full name'}
            </label>
            <input
              required
              value={details.full_name}
              onChange={(e) => setDetails({ ...details, full_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ap-blue">
              {lang === 'te' ? 'ఫోన్ నంబర్' : 'Phone number'}
            </label>
            <input
              required
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-ap-blue">
              {lang === 'te' ? 'చిరునామా' : 'Address'}
            </label>
            <input
              required
              value={details.address}
              onChange={(e) => setDetails({ ...details, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ap-blue">
              {lang === 'te' ? 'వార్షిక ఆదాయం (₹)' : 'Annual income (₹)'}
            </label>
            <input
              type="number"
              value={details.income}
              onChange={(e) => setDetails({ ...details, income: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            />
          </div>
        </div>

        {scheme.required_documents.length > 0 && (
          <div className="space-y-3 border-t border-ap-blue/10 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ap-blue/60">
              {lang === 'te' ? 'అవసరమైన పత్రాలు' : 'Required documents'}
            </p>
            {scheme.required_documents.map((doc) => (
              <div key={doc}>
                <label className="mb-1 block text-sm font-medium text-ap-blue">{doc}</label>
                <input
                  type="file"
                  onChange={(e) => setFiles((prev) => ({ ...prev, [doc]: e.target.files?.[0] ?? null }))}
                  className="w-full text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ap-orange py-2.5 font-semibold text-white hover:bg-ap-orangeDark disabled:opacity-60"
        >
          {submitting ? '...' : t('apply')}
        </button>
      </form>
    </div>
  );
}
