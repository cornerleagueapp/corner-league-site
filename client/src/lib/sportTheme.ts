import type { CSSProperties } from "react";
import { sportVisual, SPORT_VISUALS } from "./sportVisuals";

export type SportTheme = {
  accent: string;
  bright: string;
  label: string;
};
// RGB channels let Tailwind opacity utilities work with the selected sport.
// Accent text and white button labels meet 4.5:1 contrast on cream surfaces.
export const SPORT_THEMES: Readonly<Record<string, SportTheme>> =
  Object.fromEntries(
    Object.entries(SPORT_VISUALS).map(([key, visual]) => [
      key,
      { accent: visual.accent, bright: visual.bright, label: visual.label },
    ]),
  );
export function sportTheme(key: string): SportTheme {
  return Object.prototype.hasOwnProperty.call(SPORT_THEMES, key)
    ? SPORT_THEMES[key]
    : SPORT_THEMES["jet-ski"];
}
export function sportThemeStyle(key: string): CSSProperties {
  const theme = sportVisual(key);
  return {
    "--cl-sport-accent": theme.accent,
    "--cl-sport-bright": theme.bright,
    "--cl-accent": theme.accent,
    "--sport-nav": theme.nav,
    "--sport-nav-ink": theme.navInk,
    "--sport-nav-muted": theme.navMuted,
    "--sport-nav-accent": key === "hockey" ? theme.accent : theme.bright,
  } as CSSProperties;
}
