import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

import appCss from "../styles.css?url";
import { LangProvider } from "@/lib/i18n";
import { primeSchemesCache } from "@/lib/offlineSchemes";
import { AuthProvider } from "@/hooks/useAuth";
import App from "@/App";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SachiSeva — Andhra Pradesh Sachivalayam Services" },
      {
        name: "description",
        content:
          "Bilingual (Telugu + English) portal for AP welfare schemes, application tracking, certificates, and finding your nearest Sachivalayam center.",
      },
      { property: "og:title", content: "SachiSeva — Andhra Pradesh Sachivalayam Services" },
      {
        property: "og:description",
        content: "Bilingual (Telugu + English) portal for AP welfare schemes, application tracking, certificates, and finding your nearest Sachivalayam center.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SachiSeva — Andhra Pradesh Sachivalayam Services" },
      { name: "twitter:description", content: "Bilingual (Telugu + English) portal for AP welfare schemes, application tracking, certificates, and finding your nearest Sachivalayam center." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/09761a35-6498-4c8b-9374-867fc1f3dfce/id-preview-cc7a3494--78c53b0e-1727-4da5-bc96-2da2878eba58.lovable.app-1783385294524.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/09761a35-6498-4c8b-9374-867fc1f3dfce/id-preview-cc7a3494--78c53b0e-1727-4da5-bc96-2da2878eba58.lovable.app-1783385294524.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    primeSchemesCache();
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ap-cream">
        <p className="text-sm text-ap-blue/70">Loading SachiSeva…</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <LangProvider>
            <App />
          </LangProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
