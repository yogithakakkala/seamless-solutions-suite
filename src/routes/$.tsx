import { createFileRoute } from "@tanstack/react-router";

// Catch-all so every URL matches. The actual UI is mounted by BrowserRouter
// inside __root.tsx — this route only exists to make TanStack Router happy.
export const Route = createFileRoute("/$")({
  component: () => null,
});
