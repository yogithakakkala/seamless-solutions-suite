// Minimal ambient shims for the Web Speech API used by the voice assistant.
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: { [index: number]: { transcript: string } };
    length: number;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SpeechRecognition extends SpeechRecognitionLike {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SpeechRecognitionEvent extends SpeechRecognitionEventLike {}
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export {};
