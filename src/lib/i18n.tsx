import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Lang } from '@/types';

const STRINGS: Record<string, { en: string; te: string }> = {
  appName: { en: 'SachiSeva', te: 'సచిసేవ' },
  home: { en: 'Home', te: 'హోమ్' },
  schemes: { en: 'Schemes', te: 'పథకాలు' },
  eligibility: { en: 'Eligibility Calculator', te: 'అర్హత గణన' },
  documents: { en: 'Document Checklist', te: 'పత్రాల జాబితా' },
  certificate: { en: 'Application Tracker', te: 'దరఖాస్తు ట్రాకర్' },
  nearestCenter: { en: 'Nearest Center', te: 'సమీప కేంద్రం' },
  myApplications: { en: 'My Applications', te: 'నా దరఖాస్తులు' },
  help: { en: 'Help', te: 'సహాయం' },
  listen: { en: 'Listen', te: 'వినండి' },
  offlineMode: { en: 'Offline Mode — showing saved data', te: 'ఆఫ్‌లైన్ మోడ్ — సేవ్ చేసిన డేటా చూపిస్తోంది' },
  login: { en: 'Login', te: 'లాగిన్' },
  logout: { en: 'Logout', te: 'లాగ్అవుట్' },
  findNearestOffice: { en: 'Find Nearest Office', te: 'సమీప కార్యాలయాన్ని కనుగొనండి' },
  apply: { en: 'Apply', te: 'దరఖాస్తు చేయండి' },
  checkStatus: { en: 'Check Status', te: 'స్థితిని తనిఖీ చేయండి' },
  missing: { en: 'Missing', te: 'లేదు' },
  present: { en: 'Available', te: 'ఉంది' },
};

export function t(key: keyof typeof STRINGS, lang: Lang): string {
  return STRINGS[key]?.[lang] ?? key;
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof STRINGS) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('sachiseva-lang') as Lang) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('sachiseva-lang', lang);
  }, [lang]);

  const value: LangContextValue = {
    lang,
    setLang,
    toggle: () => setLang((prev) => (prev === 'en' ? 'te' : 'en')),
    t: (key) => t(key, lang),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
