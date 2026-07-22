import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const [scheme, setScheme] = useState<Scheme | undefined>(
    SCHEMES_SEED.find((s) => s.id === schemeId)
  );
  const [details, setDetails] = useState({ full_name: '', phone: '', address: '', income: '' });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
      const submittedDocuments: SubmittedDocument[] = [];
      for (const doc of scheme.required_documents) {
        const file = files[doc];
        if (file) {
          const path = `${user.id}/${scheme.id}/${doc}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(path, file, { upsert: true });
          if (uploadError) throw uploadError;
          submittedDocuments.push({ document_type: doc, file_url: path });
        }
      }

      const { error: insertError } = await supabase.from('applications').insert({
        user_id: user.id,
        scheme_id: scheme.id,
        status: 'submitted',
        applicant_details: details,
        submitted_documents: submittedDocuments as unknown as never,
      });
      if (insertError) throw insertError;

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
        <button
          onClick={() => navigate('/my-applications')}
          className="mt-3 rounded-full bg-ap-blue px-4 py-2 text-sm font-medium text-white hover:bg-ap-blueLight"
        >
          {t('myApplications')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
