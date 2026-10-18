export type SportVisual = {
  label: string;
  tile: number;
  eventSport: string;
  nav: string;
  navInk: string;
  navMuted: string;
  bright: string;
  accent: string;
  initials: string;
};
export const SPORT_VISUALS: Readonly<Record<string, SportVisual>> = {
  "jet-ski": {
    label: "Jet Ski",
    tile: 0,
    eventSport: "jet ski",
    nav: "3 31 48",
    navInk: "247 251 255",
    navMuted: "190 211 225",
    bright: "103 232 249",
    accent: "0 101 173",
    initials: "JS",
  },
  basketball: {
    label: "Basketball",
    tile: 1,
    eventSport: "basketball",
    nav: "76 27 7",
    navInk: "255 249 243",
    navMuted: "240 204 177",
    bright: "253 186 116",
    accent: "174 57 8",
    initials: "BB",
  },
  "american-football": {
    label: "Football",
    tile: 2,
    eventSport: "american football",
    nav: "44 31 13",
    navInk: "255 250 237",
    navMuted: "225 207 171",
    bright: "252 211 77",
    accent: "119 78 15",
    initials: "FB",
  },
  baseball: {
    label: "Baseball",
    tile: 3,
    eventSport: "baseball",
    nav: "84 15 23",
    navInk: "255 247 248",
    navMuted: "239 198 204",
    bright: "252 165 165",
    accent: "154 28 43",
    initials: "BS",
  },
  golf: {
    label: "Golf",
    tile: 4,
    eventSport: "golf",
    nav: "4 49 33",
    navInk: "243 255 248",
    navMuted: "188 220 202",
    bright: "134 239 172",
    accent: "22 101 57",
    initials: "GF",
  },
  hockey: {
    label: "Hockey",
    tile: 5,
    eventSport: "hockey",
    nav: "185 224 248",
    navInk: "8 35 55",
    navMuted: "30 65 89",
    bright: "125 211 252",
    accent: "12 88 137",
    initials: "HK",
  },
  soccer: {
    label: "Soccer",
    tile: 6,
    eventSport: "soccer",
    nav: "47 20 66",
    navInk: "253 247 255",
    navMuted: "221 198 236",
    bright: "216 180 254",
    accent: "113 36 151",
    initials: "SC",
  },
  motocross: {
    label: "Motocross",
    tile: 7,
    eventSport: "motocross",
    nav: "61 28 13",
    navInk: "255 249 242",
    navMuted: "231 205 185",
    bright: "253 186 116",
    accent: "163 58 22",
    initials: "MX",
  },
  "boat-racing": {
    label: "Boat Racing",
    tile: 8,
    eventSport: "boat racing",
    nav: "14 34 65",
    navInk: "247 251 255",
    navMuted: "188 211 239",
    bright: "147 197 253",
    accent: "34 80 160",
    initials: "BR",
  },
  "track-running": {
    label: "Track & Running",
    tile: 9,
    eventSport: "track running",
    nav: "45 27 65",
    navInk: "252 247 255",
    navMuted: "217 198 235",
    bright: "216 180 254",
    accent: "105 56 162",
    initials: "TR",
  },
  marathon: {
    label: "Marathon",
    tile: 10,
    eventSport: "marathon",
    nav: "59 31 19",
    navInk: "255 249 243",
    navMuted: "232 206 190",
    bright: "253 186 116",
    accent: "137 62 26",
    initials: "MR",
  },
  "onewheel-racing": {
    label: "Onewheel Racing",
    tile: 11,
    eventSport: "onewheel racing",
    nav: "29 46 13",
    navInk: "249 255 239",
    navMuted: "207 226 182",
    bright: "190 242 100",
    accent: "67 97 27",
    initials: "OW",
  },
  "rc-racing": {
    label: "RC Racing",
    tile: 12,
    eventSport: "rc racing",
    nav: "61 17 34",
    navInk: "255 247 251",
    navMuted: "235 194 213",
    bright: "253 164 175",
    accent: "148 34 69",
    initials: "RC",
  },
};
const GENERIC: SportVisual = {
  ...SPORT_VISUALS["jet-ski"],
  label: "Sports",
  tile: 13,
  initials: "CL",
};
export function sportVisual(key: string): SportVisual {
  return Object.prototype.hasOwnProperty.call(SPORT_VISUALS, key)
    ? SPORT_VISUALS[key]
    : GENERIC;
}
export function sportLogo(key: string) {
  return `/branding/sport-logo-${Object.prototype.hasOwnProperty.call(SPORT_VISUALS, key) ? key : "default"}.svg`;
}
