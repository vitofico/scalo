import { useEffect, useState } from "react";
import { BACKGROUND_STORAGE_KEY, applyBackgroundStyle, readBackgroundStyle, setBackgroundStyle, type BackgroundStyle } from "../background-style";

export default function Appearance() {
  const [background, setBackground] = useState<BackgroundStyle>(readBackgroundStyle);
  useEffect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key !== BACKGROUND_STORAGE_KEY && event.key !== null) return;
      const style = readBackgroundStyle();
      applyBackgroundStyle(style);
      setBackground(style);
    };
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  }, []);
  return (
    <details className="appearance">
      <summary>Appearance</summary>
      <div className="appearance-panel">
        <h2>Background style</h2>
        <div className="appearance-choices" role="group" aria-label="Background style">
          {(["plain", "artwork"] as const).map((style) => (
            <button key={style} type="button" aria-pressed={background === style}
              data-testid={`background-${style}`}
              onClick={() => { setBackgroundStyle(style); setBackground(style); }}>
              <span className="background-preview" data-style={style} aria-hidden="true" />
              {style === "plain" ? "Plain" : "Artwork"}
            </button>
          ))}
        </div>
        <p>Follows your system’s light or dark colours.</p>
      </div>
    </details>
  );
}
