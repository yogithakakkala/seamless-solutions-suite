import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // The app uses `react-router-dom`'s `BrowserRouter` for all UI routing.
  // If TanStack Router also subscribes to `window.history`, every
  // BrowserRouter navigation triggers TanStack's `Transitioner` to call
  // `startTransition`/`setState` from a `useSyncExternalStore` update
  // happening during BrowserRouter's render pass — React logs
  // "Cannot update a component while rendering a different component"
  // and, worse, can spin in a render loop that freezes the page (e.g.
  // the Document Checklist never opens because the `/documents`
  // navigation re-enters TanStack Router forever).
  //
  // Give TanStack Router a memory history so it renders the initial
  // route (the catch-all shell in `src/routes/$.tsx`) once and then
  // never reacts to browser URL changes. BrowserRouter owns the URL.
  const initialPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return router;
};
