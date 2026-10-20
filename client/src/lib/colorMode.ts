import { useSyncExternalStore } from "react";
export type ColorMode = "light" | "dark";
export const COLOR_MODE_KEY = "corner-league-color-mode";
const CHANGE = "corner-league:color-mode";
let memory: ColorMode | undefined;
function stored(): ColorMode | undefined {
  try {
    const value = localStorage.getItem(COLOR_MODE_KEY);
    return value === "light" || value === "dark" ? value : memory;
  } catch {
    return memory;
  }
}
export function currentColorMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  return (
    stored() ??
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
  );
}
export function applyColorMode() {
  if (typeof document === "undefined") return;
  const mode = currentColorMode();
  document.documentElement.dataset.colorMode = mode;
  document.documentElement.style.colorScheme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#16181c" : "#f7f4ec");
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute("content", mode);
}
export function setColorMode(mode: ColorMode) {
  memory = mode;
  try {
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    /* Session preference works with blocked storage. */
  }
  applyColorMode();
  window.dispatchEvent(new Event(CHANGE));
}
function subscribe(listener: () => void) {
  const update = () => {
    applyColorMode();
    listener();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === COLOR_MODE_KEY || event.key === null) {
      memory = undefined;
      update();
    }
  };
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  const system = () => {
    if (!stored()) update();
  };
  window.addEventListener(CHANGE, update);
  window.addEventListener("storage", storage);
  media?.addEventListener?.("change", system);
  return () => {
    window.removeEventListener(CHANGE, update);
    window.removeEventListener("storage", storage);
    media?.removeEventListener?.("change", system);
  };
}
export function useColorMode() {
  return useSyncExternalStore(
    subscribe,
    currentColorMode,
    () => "light" as ColorMode,
  );
}
