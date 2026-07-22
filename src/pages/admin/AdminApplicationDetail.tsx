import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Paperclip, Send, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationMessage, ApplicationStatus } from '@/types';

const statuses: ApplicationStatus[] = ['submitted', 'under_review', 'documents_requested', 'approved', 'rejected'];

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}

export default function AdminApplicationDetail() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [text, setText] = useState('');
  const [requestDoc, setRequestDoc] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [userTyping, setUserTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadAll = async () => {
    if (!applicationId) return;
    const [{ data: app }, { data: msgs }] = await Promise.all([
      supabase
        .from('applications')
        .select('*, scheme:schemes(*), profile:profiles(full_name, email)')
        .eq('id', applicationId)
        .maybeSingle(),
      supabase
        .from('application_messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true }),
    ]);
    if (app) setApplication(app as unknown as Application);
    setMessages((msgs as ApplicationMessage[]) ?? []);
  };

  useEffect(() => {
    loadAll();
    if (!applicationId) return;

    const channel = supabase
      .channel('application-detail-' + applicationId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `id=eq.${applicationId}` },
        (payload) => setApplication((prev) => (prev ? { ...prev, ...(payload.new as Application) } : prev)),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'application_messages', filter: `application_id=eq.${applicationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ApplicationMessage]),
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if ((payload.payload as { sender?: string })?.sender === 'user') {
          setUserTyping(true);
          window.setTimeout(() => setUserTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, userTyping]);

  const updateStatus = async (status: ApplicationStatus) => {
    if (!applicationId) return;
    await supabase.from('applications').update({ status }).eq('id', applicationId);
  };

  const sendMessage = async () => {
    if (!text.trim() || !applicationId) return;
    await supabase.from('application_messages').insert({
      application_id: applicationId,
      sender_type: 'staff',
      message: text.trim(),
    });
    setText('');
  };

  const sendDocumentRequest = async () => {
    if (!requestDoc.trim() || !applicationId) return;
    await supabase.from('application_messages').insert({
      application_id: applicationId,
      sender_type: 'staff',
      message: requestNote.trim() || null,
      is_document_request: true,
      requested_document_type: requestDoc.trim(),
    });
    await supabase.from('applications').update({ status: 'documents_requested' }).eq('id', applicationId);
    setRequestDoc('');
    setRequestNote('');
    toast.success('Document request sent to applicant');
  };

  const shareTokenWithApplicant = async () => {
    if (!application?.token_number || !applicationId) {
      toast.error('No token number available yet.');
      return;
    }
    await supabase.from('application_messages').insert({
      application_id: applicationId,
      sender_type: 'staff',
      message: `Your application has been registered. Your token number is: ${application.token_number}. You can use this on the Application Tracker page to check status anytime.`,
    });
    toast.success('Token shared with applicant.');
  };

  const documentUrl = async (path: string) => {
    const { data } = await supabase.storage.from('applications').createSignedUrl(path, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const onTyping = () => {
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: 'staff' } });
  };

  if (!application) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <Link to="/admin/applications" className="text-sm text-ap-blue hover:underline">← Back to all applications</Link>

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-ap-blue/10 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-ap-blue">
            {application.profile?.full_name || application.applicant_details?.full_name || 'Applicant'}
          </h1>
          <p className="text-xs text-gray-500">{application.profile?.email}</p>
          <p className="mt-1 text-sm text-gray-700">
            <span className="text-xs uppercase text-gray-400">Scheme: </span>
            {application.scheme?.name ?? application.scheme_id}
          </p>
          {application.token_number && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-ap-orange/10 px-3 py-1 font-mono text-sm font-bold text-ap-orangeDark">
                Token: {application.token_number}
              </span>
              <button
                onClick={shareTokenWithApplicant}
                className="inline-flex items-center gap-1 rounded-full bg-ap-blue px-3 py-1 text-xs font-semibold text-white hover:bg-ap-blue/90"
              >
                <Share2 size={12} /> Share Token with Applicant
              </button>
            </div>
          )}
        </div>
        <select
          value={application.status}
          onChange={(e) => updateStatus(e.target.value as ApplicationStatus)}
          className="rounded-lg border border-gray-300 p-2 text-sm font-semibold"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Main layout: chat left/center, actions right */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Chat thread */}
        <div className="rounded-xl border border-ap-blue/10 bg-white shadow-sm">
          <div className="border-b border-ap-blue/10 px-4 py-2.5">
            <p className="text-sm font-semibold text-ap-blue">Message thread with applicant</p>
          </div>
          <div className="flex h-[440px] flex-col gap-2 overflow-y-auto bg-ap-cream/40 p-4">
            {messages.length === 0 && (
              <p className="my-auto text-center text-sm text-gray-500">
                No messages yet. Send a message or request a document below.
              </p>
            )}
            {messages.map((m) => {
              const isStaff = m.sender_type === 'staff';
              const isDocReq = m.is_document_request;
              return (
                <div key={m.id} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[85%] items-end gap-2 ${isStaff ? '' : 'flex-row-reverse'}`}>
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                        isStaff ? 'bg-ap-orange' : 'bg-ap-blue'
                      }`}
                    >
                      {isStaff ? 'S' : 'C'}
                    </div>
                    <div>
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          isDocReq
                            ? 'rounded-bl-sm border-2 border-ap-orange bg-orange-50 text-gray-800'
                            : isStaff
                              ? 'rounded-bl-sm border border-ap-blue/10 bg-white text-gray-800'
                              : 'rounded-br-sm bg-ap-blue text-white'
                        }`}
                      >
                        {isDocReq && (
                          <p className="mb-0.5 flex items-center gap-1 font-semibold text-ap-orangeDark">
                            <Paperclip size={12} /> Requested: {m.requested_document_type}
                          </p>
                        )}
                        {m.message && <p className="whitespace-pre-wrap break-words">{m.message}</p>}
                        {m.file_url && !isDocReq && (
                          <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                            <Paperclip size={12} />
                            <button onClick={() => documentUrl(m.file_url!)} className="underline">
                              {m.file_url.split('/').pop()}
                            </button>
                          </p>
                        )}
                      </div>
                      <p className={`mt-0.5 text-[10px] text-gray-400 ${isStaff ? '' : 'text-right'}`}>
                        {isStaff ? 'Staff' : 'Applicant'} · {timeLabel(m.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {userTyping && (
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-sm bg-ap-blue/10 px-3 py-2 text-xs italic text-gray-500">
                  Applicant is typing…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-ap-blue/10 p-3">
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message to the citizen..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-ap-blue focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="flex items-center gap-1 rounded-full bg-ap-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              <Send size={14} /> Send
            </button>
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-dashed border-ap-orange/60 bg-orange-50/40 p-3">
            <p className="text-xs font-semibold text-ap-orangeDark">Request a specific document</p>
            <input
              value={requestDoc}
              onChange={(e) => setRequestDoc(e.target.value)}
              placeholder='e.g. "Updated Income Certificate"'
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
            <input
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="Optional note to the citizen"
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
            <button
              onClick={sendDocumentRequest}
              disabled={!requestDoc.trim()}
              className="w-full rounded-full bg-ap-orange px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Request document (sets status to "documents requested")
            </button>
          </div>

          <div className="rounded-xl border border-ap-blue/10 bg-white p-3 text-sm shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">Applicant details</p>
            {Object.entries(application.applicant_details ?? {}).map(([k, v]) =>
              v ? (
                <p key={k} className="text-gray-700">
                  <span className="font-medium capitalize">{k.replace('_', ' ')}: </span>
                  {v}
                </p>
              ) : null,
            )}
            {Object.keys(application.applicant_details ?? {}).length === 0 && (
              <p className="text-gray-400">No details submitted.</p>
            )}
          </div>

          <div className="rounded-xl border border-ap-blue/10 bg-white p-3 text-sm shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">Submitted documents</p>
            {(application.submitted_documents ?? []).length === 0 && (
              <p className="text-gray-400">No documents submitted yet.</p>
            )}
            <ul className="space-y-1">
              {(application.submitted_documents ?? []).map((d, i) => (
                <li key={i}>
                  <button onClick={() => documentUrl(d.file_url)} className="text-ap-blue hover:underline">
                    {d.document_type}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
