import { useEffect, useRef } from "react";

export const WHATS_NEW_ROUTE = "#/whats-new";
export const WHATS_NEW_SEEN_KEY = "scalo.whatsNewSeen";
export const LATEST_UPDATE = "search-backgrounds";

export function readLastSeenUpdate(): string | null {
  try {
    return localStorage.getItem(WHATS_NEW_SEEN_KEY);
  } catch {
    return null;
  }
}

export default function WhatsNewPage() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-inner">
          <a className="whats-new-link" href="#/">← Back to search</a>
          <h1 tabIndex={-1} ref={heading}>What’s new</h1>
        </div>
      </header>
      <main className="page-main whats-new-page">
        <section>
          <h2>Latest</h2>
          <article>
            <h3>Choose your search background</h3>
            <p>Pick route artwork or a plain background in Appearance.</p>
            <a className="whats-new-link" href="#/?appearance">Open Appearance →</a>
          </article>
        </section>
        <section>
          <h2>Earlier</h2>
          <article>
            <h3>Find more overnight connections</h3>
            <p>With overnight connections enabled, Scalo can find trips that start on the final day of your search and connect the next day.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
