-- 1. certificate_requests: remove public read
DROP POLICY IF EXISTS "public read certs" ON public.certificate_requests;
CREATE POLICY "staff read certs" ON public.certificate_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
REVOKE ALL ON public.certificate_requests FROM anon;

-- 2. storage: explicit update/delete controls on the applications bucket
DROP POLICY IF EXISTS "applications owner update" ON storage.objects;
DROP POLICY IF EXISTS "applications owner delete" ON storage.objects;
DROP POLICY IF EXISTS "applications staff update" ON storage.objects;
DROP POLICY IF EXISTS "applications staff delete" ON storage.objects;

CREATE POLICY "applications owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'applications' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'applications' AND owner = auth.uid());

CREATE POLICY "applications owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'applications' AND owner = auth.uid());

CREATE POLICY "applications staff update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'applications' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'applications' AND public.is_staff(auth.uid()));

CREATE POLICY "applications staff delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'applications' AND public.is_staff(auth.uid()));

-- 3. SECURITY DEFINER functions: revoke EXECUTE where callers should not reach them directly
REVOKE ALL ON FUNCTION public.send_email(text, text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_stale_applications() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_message() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_application_status_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_certificate_status_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_grievance_status() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.record_application_status_history() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_draft_on_application_insert() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_application_token() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- anon must not reach signed-in-only helpers
REVOKE ALL ON FUNCTION public.set_staff_status(uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.citizen_add_submitted_document(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_staff_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.citizen_add_submitted_document(uuid, text, text) TO authenticated;

-- public application tracking stays available to visitors
GRANT EXECUTE ON FUNCTION public.lookup_application_by_token(text) TO anon, authenticated;