import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, X, MessageCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  createRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
  type SpeechRecognizer,
} from "@/lib/speech";

type Msg = { role: "user" | "assistant"; content: string };

export default function AIChatbot() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const micSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            lang === "te"
              ? "నమస్తే! నేను SachiSeva సహాయకుడిని. పథకాలు, పత్రాలు, సమీప కేంద్రం లేదా దరఖాస్తు స్థితి గురించి అడగండి."
              : "Hi! I'm the SachiSeva Assistant. Ask me about schemes, documents, the nearest center, or your application status.",
        },
      ]);
    }
  }, [open, lang, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => () => stopSpeaking(), []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const nextMsgs: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, lang }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const reply = (data.reply ?? "").trim();
      if (!reply) {
        setError(lang === "te" ? "సమాధానం రాలేదు." : "No reply received.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (ttsOn && ttsSupported) speak(reply, lang);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!micSupported) return;
    stopSpeaking();
    const rec = createRecognizer(lang);
    if (!rec) return;
    recognizerRef.current = rec;
    setListening(true);
    rec.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      setListening(false);
      void send(heard);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const stopListening = () => {
    recognizerRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-ap-blue/15 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ap-blue px-4 py-3 text-white">
            <div>
              <p className="font-semibold">
                {lang === "te" ? "SachiSeva సహాయకుడు" : "SachiSeva Assistant"}
              </p>
              <p className="text-xs text-white/70">
                {lang === "te" ? "AI ద్వారా బదులు" : "Powered by AI"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ttsSupported && (
                <button
                  onClick={() => {
                    if (ttsOn) stopSpeaking();
                    setTtsOn((v) => !v);
                  }}
                  aria-label="Toggle voice"
                  className="rounded-full p-1 hover:bg-white/10"
                >
                  {ttsOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              )}
              <button
                onClick={() => {
                  stopSpeaking();
                  setOpen(false);
                }}
                aria-label="Close"
                className="rounded-full p-1 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-96 flex-1 space-y-3 overflow-y-auto bg-ap-cream/40 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-ap-blue text-white"
                      : "bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ap-blue [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ap-blue [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ap-blue" />
                  </span>
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>
            )}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  lang === "te" ? "పథకానికి దరఖాస్తు ఎలా చేయాలి?" : "How do I apply for a scheme?",
                  lang === "te" ? "నా దరఖాస్తు స్థితి తెలుసుకో" : "Check my application status",
                  lang === "te" ? "సమీప సచివాలయం కనుగొనండి" : "Find nearest Sachivalayam",
                  lang === "te" ? "నాకు ఏ పత్రాలు కావాలి?" : "What documents do I need?",
                  lang === "te" ? "నా సర్టిఫికేట్ ట్రాక్ చేయి" : "Track my certificate",
                  lang === "te" ? "నేను ఏ పథకాలకు అర్హుడిని?" : "What schemes am I eligible for?",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-full border border-ap-blue/30 bg-white px-3 py-1 text-xs text-ap-blue hover:bg-ap-blue/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>


          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-ap-blue/10 bg-white p-2"
          >
            {micSupported && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                aria-label="Microphone"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                  listening ? "bg-red-500 pulse-mic" : "bg-ap-orange hover:bg-ap-orangeDark"
                }`}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === "te" ? "మీ ప్రశ్న టైప్ చేయండి..." : "Type your question..."
              }
              className="flex-1 rounded-full border border-ap-blue/20 bg-ap-cream/50 px-4 py-2 text-sm outline-none focus:border-ap-blue"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ap-blue text-white disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={lang === "te" ? "సహాయకుడు" : "Assistant"}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ap-orange text-white shadow-lg hover:bg-ap-orangeDark"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
