import { ReactNode } from 'react';
import CitizenSidebar from './CitizenSidebar';
import AIChatbot from './AIChatbot';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-ap-cream lg:flex-row">
      <CitizenSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto h-auto w-full max-w-5xl min-w-0 px-4 pt-6 pb-6 text-sm">{children}</main>
      </div>
      <AIChatbot />
    </div>
  );
}
