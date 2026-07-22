import { ReactNode } from 'react';
import CitizenSidebar from './CitizenSidebar';
import AIChatbot from './AIChatbot';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ap-cream md:flex-row">
      <CitizenSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </div>
      <AIChatbot />
    </div>
  );
}
