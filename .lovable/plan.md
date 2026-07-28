# SachiSeva: 5 New Features

Adding Scheme Recommender, Progress Timeline, Draft Save, Office Busy Indicator, and Grievance Escalation to the existing app. All bilingual (EN/TE), all with proper RLS, all realtime where applicable, all mobile responsive.

## 1. Database Migration (single migration)

New tables + columns + triggers + RLS + grants:

- **application_status_history**: `id, application_id, status, changed_at, changed_by_staff, note, document_requested`. RLS: citizens SELECT own via app join; staff SELECT/INSERT all. Trigger `AFTER INSERT OR UPDATE OF status ON applications` inserts history row. Backfill from existing applications.
- **application_drafts**: `id, user_id, scheme_id (text, matches schemes.id), draft_data jsonb, completion_percentage, created_at, updated_at`. UNIQUE(user_id, scheme_id). RLS: user_id = auth.uid() for all ops. Trigger on `applications INSERT`: delete matching draft.
- **sachivalayam_centers**: add `busy_level text default 'low' CHECK IN (low/moderate/busy)`, `busy_updated_at timestamptz default now()`, `busy_note text`. Enable realtime.
- **grievances**: `id, application_id, user_id, reason, status (raised/acknowledged/resolved), raised_at, acknowledged_at, resolved_at, admin_response`. RLS: citizens SELECT/INSERT own; staff SELECT/UPDATE all. Enable realtime.
- Enable realtime on `application_status_history`, `sachivalayam_centers`, `grievances`.
- `pg_cron` daily 9am: notify citizens of stale apps (>7 days, no active grievance) via existing `send_email` function.

## 2. Feature 1 — Scheme Recommender

- New page `src/pages/SchemeRecommender.tsx` with 8-question form (age, income, caste, gender, occupation, land, school children, construction worker). Persists to localStorage.
- Client-side evaluator reads `schemes.eligibility_rules` and groups results into Qualify / Almost / Not Eligible.
- "Apply Now" → `/schemes/:id/apply?prefill=<encoded>`, prefill consumed in `SchemeApply`.
- Add route in `src/App.tsx`, sidebar item in `CitizenSidebar.tsx`, Home card in `Home.tsx`.
- Extend `AIChatbot` system prompt + conversational recommender flow.

## 3. Feature 2 — Application Progress Timeline

- New component `ApplicationTimeline.tsx`: 4-step vertical timeline (Submitted → Under Review → Documents Requested (conditional) → Approved/Rejected), pulses on current, shows elapsed time between steps, estimated completion from historical averages via a small helper query.
- New component `MiniProgressBar.tsx` for `MyApplications` cards.
- Replace status badge in `ApplicationDetail.tsx` and `admin/AdminApplicationDetail.tsx` with `<ApplicationTimeline>`.
- Replace badge in `MyApplications.tsx` list with mini bar + step label.

## 4. Feature 3 — Draft Save

- `useDraftAutosave` hook: debounced 30s save + save on file upload; computes completion %.
- `SchemeApply.tsx`: on mount, check for draft → dialog "Continue / Start Fresh". "Draft saved [time]" toast indicator. `beforeunload` warning.
- `MyApplications.tsx`: new horizontal "Drafts" section with completion meter, Continue/Delete.
- `Home.tsx`: banner if drafts exist with Resume button.
- Draft auto-deleted server-side on application insert (trigger).

## 5. Feature 4 — Busy Indicator

- `admin/AdminCenters.tsx`: three-button busy toggle (Low/Moderate/Busy), 50-char note field, bulk "Update All" dropdown at top.
- `NearestCenter.tsx`: colored busy badge on cards + map popups, stale (>6h) shows "Status unknown", filter toggle "Show Less Crowded Only", realtime subscription to `sachivalayam_centers`.
- `Home.tsx`: proactive banner if nearest center busy/moderate based on geolocation.

## 6. Feature 5 — Grievance Escalation

- `MyApplications.tsx`: on stale (>7 days) cards with no active grievance, orange "Escalate" banner → bottom sheet modal with optional reason. After submit, replace with gray badge. Realtime subscription for status changes → toast.
- New admin page `admin/AdminGrievances.tsx`: table sorted by staleness, stat cards, Acknowledge/Resolve actions with response field. Add sidebar link with unacknowledged count badge (realtime).
- Email notifications on acknowledge/resolve via existing `send_email` DB function called from a trigger.

## 7. Bilingual + SachiBot

- All new strings have EN/TE variants using existing `useLang()` pattern.
- Update chat system prompt in `src/routes/api/chat.ts` to describe the 5 features and the FAQ questions.

## Technical details

- Migration follows the required order: CREATE TABLE → GRANT (authenticated + service_role) → ENABLE RLS → CREATE POLICY. Use `has_role`/`is_staff` for staff checks — no self-referencing subqueries.
- Draft `scheme_id` is `text` to match existing `schemes.id text` PK (not uuid as literal spec says).
- Timeline uses existing `applications.status` enum values already in the app: `submitted, under_review, documents_requested, approved, rejected`.
- Realtime enabled via `ALTER PUBLICATION supabase_realtime ADD TABLE ...`.
- `pg_cron` job uses `net.http_post` is NOT needed — it calls existing `public.send_email` PL/pgSQL directly in a loop.
- No new npm dependencies required; reuse existing shadcn Dialog/Sheet/Toast (`sonner`).
- No changes to auto-generated Supabase files. No changes to routing model (still react-router-dom with TanStack memory history).
