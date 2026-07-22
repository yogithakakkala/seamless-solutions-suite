import { useRef, useState } from 'react';
import { Mic, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/lib/i18n';
import {
  createRecognizer,
  speak,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  type SpeechRecognizer,
} from '@/lib/speech';

interface Turn {
  heard: string;
  reply: string;
}

/** Rule-based keyword matching -> canned bilingual answers + a route to navigate to. */
function matchIntent(text: string, lang: 'en' | 'te'): { reply: string; route?: string } {
  const q = text.toLowerCase();

  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has('apply', 'scheme', 'దరఖాస్తు', 'పథకం')) {
    return {
      route: '/schemes',
      reply:
        lang === 'te'
          ? 'పథకాల పేజీకి తీసుకెళ్తున్నాను. అక్కడ ఒక పథకాన్ని ఎంచుకుని దరఖాస్తు బటన్ నొక్కండి.'
          : "Taking you to the Schemes page. Pick a scheme there and tap Apply.",
    };
  }
  if (has('nearest', 'center', 'సమీప', 'కేంద్రం')) {
    return {
      route: '/nearest-center',
      reply:
        lang === 'te'
          ? 'మీ సమీప సచివాలయ కేంద్రాన్ని చూపిస్తున్నాను.'
          : 'Showing your nearest Sachivalayam center now.',
    };
  }
  if (has('document', 'need', 'పత్రాలు', 'కావాలి')) {
    return {
      route: '/documents',
      reply:
        lang === 'te'
          ? 'పత్రాల జాబితా పేజీని తెరుస్తున్నాను. ఏ పథకానికి పత్రాలు కావాలో అక్కడ చూడవచ్చు.'
          : 'Opening the Document Checklist page — you can see required documents there.',
    };
  }
  if (has('status', 'application', 'స్థితి', 'దరఖాస్తు స్థితి')) {
    return {
      route: '/my-applications',
      reply:
        lang === 'te'
          ? 'మీ దరఖాస్తుల స్థితిని చూపిస్తున్నాను.'
          : 'Showing the status of your applications.',
    };
  }
  if (has('request', 'staff', 'అభ్యర్థించండి', 'సిబ్బంది')) {
    return {
      route: '/my-applications',
      reply:
        lang === 'te'
          ? 'మీ దరఖాస్తును తెరిచి, సందేశం పంపే బాక్స్‌లో సిబ్బందికి పత్రం అవసరమని తెలియజేయవచ్చు.'
          : 'Open your application and use the message box there to ask staff for anything you need — they\u2019ll see it right away.',
    };
  }
  if (has('certificate', 'ధృవీకరణ')) {
    return {
      route: '/certificate',
      reply:
        lang === 'te'
          ? 'ధృవీకరణ పత్రం స్థితిని తనిఖీ చేయడానికి టోకెన్ నంబర్ నమోదు చేయండి.'
          : 'Enter your token number on the Certificate Tracker to check status.',
    };
  }

  return {
    reply:
      lang === 'te'
        ? 'క్షమించండి, నాకు అర్థం కాలేదు. దరఖాస్తు, పత్రాలు, సమీప కేంద్రం లేదా స్థితి గురించి అడగండి.'
        : "Sorry, I didn't understand. Try asking about applying, documents, nearest center, or application status.",
  };
}

export default function VoiceAssistant() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);

  const supported = isSpeechRecognitionSupported();

  const startListening = () => {
    const recognizer = createRecognizer(lang);
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setListening(true);

    recognizer.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      const { reply, route } = matchIntent(heard, lang);
      setTurns((prev) => [...prev, { heard, reply }]);
      if (isSpeechSynthesisSupported()) speak(reply, lang);
      if (route) navigate(route);
    };
    recognizer.onerror = () => setListening(false);
    recognizer.onend = () => setListening(false);
    recognizer.start();
  };

  const stopListening = () => {
    recognizerRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-ap-blue/15 bg-white p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-ap-blue">
              {lang === 'te' ? 'వాయిస్ సహాయకుడు' : 'Voice Assistant'}
            </p>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {!supported ? (
            <p className="text-sm text-gray-600">
              {lang === 'te'
                ? 'మీ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ మద్దతు లేదు.'
                : 'Voice input is not supported in this browser.'}
            </p>
          ) : (
            <>
              <div className="mb-3 max-h-56 space-y-2 overflow-y-auto text-sm">
                {turns.length === 0 && (
                  <p className="text-gray-500">
                    {lang === 'te'
                      ? 'మైక్ నొక్కి మాట్లాడండి: "నేను పథకానికి ఎలా దరఖాస్తు చేయాలి?"'
                      : 'Tap the mic and ask: "How do I apply for a scheme?"'}
                  </p>
                )}
                {turns.map((turn, i) => (
                  <div key={i} className="rounded-lg bg-ap-blue/5 p-2">
                    <p className="text-gray-500">“{turn.heard}”</p>
                    <p className="mt-1 font-medium text-ap-blue">{turn.reply}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={listening ? stopListening : startListening}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-2 font-medium text-white ${
                  listening ? 'bg-red-500 pulse-mic' : 'bg-ap-orange'
                }`}
              >
                <Mic size={18} />
                {listening
                  ? lang === 'te'
                    ? 'వింటోంది...'
                    : 'Listening...'
                  : lang === 'te'
                    ? 'మాట్లాడటానికి నొక్కండి'
                    : 'Tap to speak'}
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('help')}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ap-orange text-white shadow-lg hover:bg-ap-orangeDark"
      >
        <Mic size={24} />
      </button>
    </>
  );
}
