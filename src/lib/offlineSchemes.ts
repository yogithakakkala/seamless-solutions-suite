import { SCHEMES_SEED } from '@/data/schemesSeed';
import type { Scheme } from '@/types';

// The bundled seed is the source of truth for the eligibility engine — it
// carries the rich rules (pension_type_benefits, ration_card_types, etc.)
// that the DB schema does not model. Admin edits to the live Supabase table
// still work through the Schemes list / admin pages, but the calculator
// always uses the bundled catalogue so eligibility logic stays consistent.
export async function getSchemesForCalculator(): Promise<{
  schemes: Scheme[];
  source: 'live' | 'cache' | 'bundled';
}> {
  return { schemes: SCHEMES_SEED, source: 'bundled' };
}

export async function primeSchemesCache(): Promise<void> {
  // No-op — the bundled seed is always available offline.
}
