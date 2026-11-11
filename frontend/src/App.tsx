import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompareProvider } from "./context/CompareContext";
import SearchPage from "./pages/SearchPage";
import ComparePage from "./pages/ComparePage";
import WhatsNewPage, { WHATS_NEW_ROUTE, WHATS_NEW_SEEN_KEY, LATEST_UPDATE, readLastSeenUpdate } from "./pages/WhatsNewPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
}

export default function App() {
  const route = useHashRoute();
  const [lastSeen, setLastSeen] = useState(readLastSeenUpdate);
  const showingWhatsNew = route === WHATS_NEW_ROUTE;

  useEffect(() => {
    if (!showingWhatsNew) return;
    setLastSeen(LATEST_UPDATE);
    try {
      localStorage.setItem(WHATS_NEW_SEEN_KEY, LATEST_UPDATE);
    } catch {
      // The dot still clears for this session.
    }
  }, [showingWhatsNew]);

  useEffect(() => {
    function follow(event: StorageEvent) {
      if (event.key === WHATS_NEW_SEEN_KEY || event.key === null) {
        setLastSeen(readLastSeenUpdate());
      }
    }
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CompareProvider>
        {route === "#/compare" ? <ComparePage /> : (
          <SearchPage
            hidden={showingWhatsNew}
            unreadUpdates={lastSeen !== LATEST_UPDATE}
            revealAppearance={route === "#/?appearance"}
          />
        )}
        {showingWhatsNew && <WhatsNewPage />}
      </CompareProvider>
    </QueryClientProvider>
  );
}
