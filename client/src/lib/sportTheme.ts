import type { CSSProperties } from "react";

export type SportTheme = {
  accent: string;
  bright: string;
  label: string;
};
// RGB channels let Tailwind opacity utilities work with the selected sport.
// Accent text and white button labels meet 4.5:1 contrast on cream surfaces.
export const SPORT_THEMES: Readonly<Record<string, SportTheme>> = {
  "jet-ski": { accent: "14 105 122", bright: "103 232 249", label: "Aqua" },
  motocross: { accent: "163 58 22", bright: "253 186 116", label: "Copper" },
  "boat-racing": {
    accent: "34 80 160",
    bright: "147 197 253",
    label: "Marine blue",
  },
  "track-running": {
    accent: "105 56 162",
    bright: "216 180 254",
    label: "Violet",
  },
  "onewheel-racing": {
    accent: "67 97 27",
    bright: "190 242 100",
    label: "Lime",
  },
  "rc-racing": { accent: "148 34 69", bright: "253 164 175", label: "Rose" },
  soccer: { accent: "25 107 70", bright: "110 231 183", label: "Emerald" },
  hockey: { accent: "37 90 130", bright: "125 211 252", label: "Ice blue" },
  marathon: { accent: "137 62 26", bright: "253 186 116", label: "Terracotta" },
  baseball: { accent: "154 39 52", bright: "252 165 165", label: "Crimson" },
  "american-football": {
    accent: "110 75 27",
    bright: "252 211 77",
    label: "Gold",
  },
  basketball: {
    accent: "161 62 19",
    bright: "253 186 116",
    label: "Court orange",
  },
  golf: { accent: "29 104 70", bright: "134 239 172", label: "Fairway green" },
};
export function sportTheme(key: string): SportTheme {
  return Object.prototype.hasOwnProperty.call(SPORT_THEMES, key)
    ? SPORT_THEMES[key]
    : SPORT_THEMES["jet-ski"];
}
export function sportThemeStyle(key: string): CSSProperties {
  const theme = sportTheme(key);
  return {
    "--cl-sport-accent": theme.accent,
    "--cl-sport-bright": theme.bright,
    "--cl-accent": theme.accent,
  } as CSSProperties;
}
