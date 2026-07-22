import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, stopSpeaking, isSpeechSynthesisSupported } from '@/lib/speech';
import { useLang } from '@/lib/i18n';

interface ListenButtonProps {
  /** Text to read aloud. Pass the Telugu string when lang is 'te' and English when 'en' -
   * callers already have both, so pass whichever matches the visible text. */
  text: string;
  className?: string;
}

/** 🔊 icon-button that reads a block of on-screen text aloud, for citizens who can't read. */
export default function ListenButton({ text, className = '' }: ListenButtonProps) {
  const { lang, t } = useLang();
  const [speaking, setSpeaking] = useState(false);

  if (!isSpeechSynthesisSupported()) return null; // fail silently, per spec

  const handleClick = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, lang, () => setSpeaking(false));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('listen')}
      title={t('listen')}
      className={`inline-flex items-center gap-1 rounded-full border border-ap-blue/30 bg-ap-blue/5 px-2.5 py-1 text-xs font-medium text-ap-blue hover:bg-ap-blue/10 ${className}`}
    >
      {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
      {t('listen')}
    </button>
  );
}
