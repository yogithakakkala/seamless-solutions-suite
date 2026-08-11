import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] px-4 py-8">
      <div className="w-[90%] max-w-[400px] rounded-2xl bg-white p-8 shadow-xl">
        <Link to="/" className="flex flex-col items-center gap-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ap-orange bg-ap-blue text-sm font-bold text-white">
            AP
          </span>
          <span className="mt-1 text-2xl font-bold text-ap-blue">SachiSeva</span>
          <span className="lang-te text-sm font-semibold text-ap-orange">సచిసేవ</span>
        </Link>
        <hr className="my-5 border-ap-blue/10" />
        {children}
      </div>
    </div>
  );
}
