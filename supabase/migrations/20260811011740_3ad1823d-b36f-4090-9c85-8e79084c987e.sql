-- Function EXECUTE defaults to PUBLIC; revoke from PUBLIC then re-grant only where needed.
REVOKE ALL ON FUNCTION public.notify_stale_applications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_grievance_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_application_status_history() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_draft_on_application_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_email(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_application_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_application_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_certificate_status_change() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.set_staff_status(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.citizen_add_submitted_document(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_staff_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.citizen_add_submitted_document(uuid, text, text) TO authenticated;

-- Public token tracking remains intentionally callable by visitors.
REVOKE ALL ON FUNCTION public.lookup_application_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_application_by_token(text) TO anon, authenticated;