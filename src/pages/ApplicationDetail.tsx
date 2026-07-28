import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, FileUp, Paperclip, Send } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import type { Application, ApplicationMessage } from '@/types';

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}

export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const { lang, t } = useLang();
  const { user } = useAuth();
  const { markSeen } = useUnreadUpdates();
  const [application, setApplication] = useState<Application | null>(null);
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [text, setText] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [staffTyping, setStaffTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadAll = async () => {
    if (!isSupabaseConfigured || !applicationId) return;
    const [{ data: app }, { data: msgs }] = await Promise.all([
      supabase.from('applications').select('*, scheme:schemes(*)').eq('id', applicationId).maybeSingle(),
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
    if (!isSupabaseConfigured || !applicationId) return;

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
        if ((payload.payload as { sender?: string })?.sender === 'staff') {
          setStaffTyping(true);
          window.setTimeout(() => setStaffTyping(false), 2500);
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

  // Mark seen whenever data updates while viewing
  useEffect(() => {
    if (applicationId) markSeen(applicationId);
  }, [applicationId, application?.updated_at, messages.length, markSeen]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, staffTyping]);

  const send = async () => {
    if (!text.trim() || !user || !applicationId) return;
    await supabase.from('application_messages').insert({
      application_id: applicationId,
      sender_type: 'user',
      message: text.trim(),
    });
    setText('');
  };

  const pendingDocRequest = useMemo(() => {
    // Latest unresolved document request from staff (no matching submitted doc after it)
    const requests = messages.filter((m) => m.is_document_request && m.requested_document_type);
    if (requests.length === 0) return null;
    const latest = requests[requests.length - 1];
    const submittedAfter = (application?.submitted_documents ?? []).some(
      (d) => d.document_type === latest.requested_document_type,
    );
    return submittedAfter ? null : latest;
  }, [messages, application?.submitted_documents]);

  const uploadRequestedDocument = async (documentType: string, file: File) => {
    if (!user || !application || !applicationId) return;
    setUploadingFor(documentType);
    try {
      const path = `${user.id}/${application.scheme_id}/${documentType}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('applications').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      await supabase.rpc('citizen_add_submitted_document', {
        _application_id: applicationId,
        _document_type: documentType,
        _file_url: path,
      });
      const updatedDocs = [
        ...(application.submitted_documents ?? []).filter((d) => d.document_type !== documentType),
        { document_type: documentType, file_url: path },
      ];
      setApplication({ ...application, submitted_documents: updatedDocs });

      await supabase.from('application_messages').insert({
        application_id: applicationId,
        sender_type: 'user',
        message: `📎 Document uploaded: ${file.name}`,
        file_url: path,
      });
    } finally {
      setUploadingFor(null);
    }
  };

  const onTyping = () => {
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { sender: 'user' } });
  };

  if (!application) {
    return <p className="text-sm text-gray-500">{lang === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...'}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ap-blue">
          {application.scheme ? (lang === 'te' ? application.scheme.name_telugu : application.scheme.name) : application.scheme_id}
        </h1>
      </div>

      <ApplicationTimeline application={application} />

      {pendingDocRequest && (
        <div className="rounded-xl border-2 border-ap-orange bg-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 flex-shrink-0 text-ap-orangeDark" size={22} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ap-orangeDark">
                {lang === 'te' ? '⚠️ చర్య అవసరం — పత్రం అభ్యర్థించారు' : '⚠️ Action Required: Document requested'}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                <span className="font-semibold">{pendingDocRequest.requested_document_type}</span>
                {pendingDocRequest.message ? ` — ${pendingDocRequest.message}` : ''}
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-ap-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ap-orangeDark">
                <FileUp size={16} />
                {uploadingFor === pendingDocRequest.requested_document_type
                  ? lang === 'te' ? 'అప్‌లోడ్...' : 'Uploading...'
                  : lang === 'te' ? 'పత్రాన్ని అప్‌లోడ్ చేయండి' : 'Upload Document'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pendingDocRequest.requested_document_type)
                      uploadRequestedDocument(pendingDocRequest.requested_document_type, file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Chat thread — primary focus */}
      <div className="rounded-xl border border-ap-blue/10 bg-white shadow-sm">
        <div className="border-b border-ap-blue/10 px-4 py-2.5">
          <p className="text-sm font-semibold text-ap-blue">
            {lang === 'te' ? 'సందేశాలు (సిబ్బందితో)' : 'Messages with Staff'}
          </p>
        </div>
        <div className="flex h-[420px] flex-col gap-2 overflow-y-auto bg-ap-cream/40 p-4">
          {messages.length === 0 && (
            <p className="my-auto text-center text-sm text-gray-500">
              {lang === 'te' ? 'ఇంకా సందేశాలు లేవు. మీ ప్రశ్నను పంపండి.' : 'No messages yet. Send a question below.'}
            </p>
          )}
          {messages.map((m) => {
            const isUser = m.sender_type === 'user';
            const isDocReq = m.is_document_request;
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      isUser ? 'bg-ap-blue' : 'bg-ap-orange'
                    }`}
                  >
                    {isUser ? 'You' : 'S'}
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        isDocReq
                          ? 'rounded-bl-sm border-2 border-ap-orange bg-orange-50 text-gray-800'
                          : isUser
                            ? 'rounded-br-sm bg-ap-blue text-white'
                            : 'rounded-bl-sm border border-ap-blue/10 bg-white text-gray-800'
                      }`}
                    >
                      {isDocReq && (
                        <p className="mb-0.5 flex items-center gap-1 font-semibold text-ap-orangeDark">
                          <Paperclip size={12} /> {lang === 'te' ? 'పత్ర అభ్యర్థన' : 'Document requested'}: {m.requested_document_type}
                        </p>
                      )}
                      {m.message && <p className="whitespace-pre-wrap break-words">{m.message}</p>}
                      {m.file_url && !isDocReq && (
                        <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                          <Paperclip size={12} /> {m.file_url.split('/').pop()}
                        </p>
                      )}
                    </div>
                    <p className={`mt-0.5 text-[10px] text-gray-400 ${isUser ? 'text-right' : ''}`}>
                      {isUser ? (lang === 'te' ? 'మీరు' : 'You') : (lang === 'te' ? 'సిబ్బంది' : 'Staff')}
                      {' · '}
                      {timeLabel(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {staffTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-ap-blue/10 bg-white px-3 py-2 text-xs italic text-gray-500 shadow-sm">
                {lang === 'te' ? 'సిబ్బంది టైప్ చేస్తున్నారు...' : 'Staff is typing…'}
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
                send();
              }
            }}
            placeholder={lang === 'te' ? 'సందేశం టైప్ చేయండి...' : 'Type a message...'}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-ap-blue focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="flex items-center gap-1 rounded-full bg-ap-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Send size={14} />
            {lang === 'te' ? 'పంపండి' : 'Send'}
          </button>
        </div>
      </div>

      {/* Submitted details / documents (below chat, secondary) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ap-blue/10 bg-white p-4 text-sm shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">
            {lang === 'te' ? 'మీరు సమర్పించిన వివరాలు' : 'What you submitted'}
          </p>
          {Object.entries(application.applicant_details ?? {}).map(([k, v]) =>
            v ? (
              <p key={k} className="text-gray-700">
                <span className="font-medium capitalize">{k.replace('_', ' ')}: </span>
                {v}
              </p>
            ) : null,
          )}
        </div>
        <div className="rounded-xl border border-ap-blue/10 bg-white p-4 text-sm shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ap-blue/60">
            {lang === 'te' ? 'సమర్పించిన పత్రాలు' : 'Submitted documents'}
          </p>
          {(application.submitted_documents ?? []).length === 0 ? (
            <p className="text-gray-400">{lang === 'te' ? 'ఇంకా లేవు.' : 'None yet.'}</p>
          ) : (
            <ul className="list-disc space-y-0.5 pl-5 text-gray-700">
              {application.submitted_documents.map((d, i) => (
                <li key={i}>{d.document_type}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link to="/my-applications" className="inline-block text-sm text-ap-blue underline">
        ← {t('myApplications')}
      </Link>
    </div>
  );
}
