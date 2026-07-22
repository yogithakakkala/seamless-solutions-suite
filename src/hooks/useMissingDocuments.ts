import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DOCUMENT_OFFICES_SEED } from '@/data/documentOffices';
import type { DocumentOffice, UserDocument } from '@/types';
import { useAuth } from './useAuth';

/**
 * Given a list of required document names, returns which ones the logged-in
 * user already has on file (user_documents table) vs which are missing, plus
 * the issuing office for each missing one. Used by:
 *  - Document Checklist page (all 6 common documents)
 *  - Scheme Application form (that scheme's required_documents)
 * Deliberately a single hook so the "missing doc -> office" logic isn't duplicated.
 */
export function useMissingDocuments(requiredDocuments: string[]) {
  const { user } = useAuth();
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);
  const [offices, setOffices] = useState<DocumentOffice[]>(DOCUMENT_OFFICES_SEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      if (isSupabaseConfigured) {
        const { data: officeData } = await supabase.from('document_offices').select('*');
        if (!cancelled && officeData && officeData.length > 0) setOffices(officeData as DocumentOffice[]);

        if (user) {
          const { data: docData } = await supabase
            .from('user_documents')
            .select('*')
            .eq('user_id', user.id);
          if (!cancelled && docData) setUserDocs(docData as UserDocument[]);
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, requiredDocuments.join(',')]);

  const status = requiredDocuments.map((docType) => {
    const present = userDocs.some((d) => d.document_type === docType);
    // Most documents map to a specific issuing office (seeded in
    // document_offices). For anything without a specific mapping — e.g. a
    // scheme-specific document we don't have a row for yet — MeeSeva
    // Centers handle general-purpose certificate/document services across
    // Andhra Pradesh, so we still point the citizen somewhere useful instead
    // of showing no guidance at all.
    const office =
      offices.find((o) => o.document_type === docType) ?? {
        id: `fallback-${docType}`,
        document_type: docType,
        issuing_office_type: 'MeeSeva Center',
        notes: 'No specific office is on file for this document yet — MeeSeva Centers handle most general document services.',
      };
    return { docType, present, office };
  });

  const markHave = async (docType: string) => {
    if (!user || !isSupabaseConfigured) return;
    const { data } = await supabase
      .from('user_documents')
      .insert({ user_id: user.id, document_type: docType, file_url: 'confirmed-by-user' })
      .select()
      .single();
    if (data) setUserDocs((prev) => [...prev, data as UserDocument]);
  };

  return { status, loading, markHave, loggedIn: !!user };
}
