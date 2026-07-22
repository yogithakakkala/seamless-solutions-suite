import { createFileRoute } from "@tanstack/react-router";

// Index route so "/" matches; BrowserRouter inside __root.tsx handles UI.
export const Route = createFileRoute("/")({
  component: () => null,
});
