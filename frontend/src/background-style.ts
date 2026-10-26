export type BackgroundStyle = "plain" | "artwork";
export const BACKGROUND_STORAGE_KEY = "scalo.backgroundStyle";

export function readBackgroundStyle(): BackgroundStyle {
  try {
    return localStorage.getItem(BACKGROUND_STORAGE_KEY) === "plain" ? "plain" : "artwork";
  } catch {
    return "artwork";
  }
}

export function applyBackgroundStyle(style: BackgroundStyle): void {
  document.documentElement.dataset.backgroundStyle = style;
}

export function setBackgroundStyle(style: BackgroundStyle): void {
  applyBackgroundStyle(style);
  try {
    localStorage.setItem(BACKGROUND_STORAGE_KEY, style);
  } catch {
    // Keep the selected style usable when browser storage is unavailable.
  }
}
