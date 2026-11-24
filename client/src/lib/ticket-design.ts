/** Shared ticket design contract. Kept identical in API, OS and consumer. */
export type TicketBlockKind =
  | "header"
  | "image"
  | "event"
  | "guest"
  | "text"
  | "qr"
  | "footer"
  | "sponsor"
  | "divider";
export type TicketBlock = {
  id: string;
  kind: TicketBlockKind;
  text?: string;
  image?: string;
  walletRole?: "hero" | "logo" | "none";
  background?: string;
  backgroundMode?: "transparent" | "tinted" | "solid";
  backgroundOpacity?: number;
  artworkOpacity?: number;
  color?: string;
  align?: "left" | "center" | "right";
  padding?: number;
  fontSize?: number;
  height?: number;
  qrSize?: number;
  fit?: "cover" | "contain";
  position?: number;
  horizontal?: number;
  zoom?: number;
  overlay?: number;
  eventStyle?: "plain" | "matchup" | "plaque";

  hidden?: boolean;
  display?: "all" | "web" | "wallet";
};
export type StudioDesign = {
  version?: 1;
  sections?: TicketBlock[];
  font?: "modern" | "editorial" | "athletic";
  backgroundImage?: string;
  radius?: number;
  edge?: "cut" | "rounded";
  topAccent?: boolean;
  bottomAccent?: boolean;

  timeZone?: string;
  backgroundColor?: string;
  textColor?: string;
  footerText?: string;
  coverFit?: "contain" | "cover";
  coverPosition?: number;
  showDescription?: boolean;
  layout?: "classic" | "split" | "minimal";
};
export type TicketData = {
  organizationName: string;
  eventName: string;
  typeName: string;
  startsAt: string;
  location: string;
  guestName?: string;
  description?: string;
  passLabel?: string;
  passInstructions?: string;
  entryStart?: string | null;
  entryEnd?: string | null;
  ticketId?: string;
  qr?: string | null;
  status?: string;
  accentColor?: string;
};
export const BLOCK_NAMES: Record<TicketBlockKind, string> = {
  header: "Header",
  image: "Artwork",
  event: "Event details",
  guest: "Guest details",
  text: "Text block",
  qr: "QR & entry",
  footer: "Footer",
  sponsor: "Sponsor",
  divider: "Divider",
};
export const FIELD_NAMES = [
  "organizationName",
  "eventName",
  "ticketType",
  "date",
  "venue",
  "guestName",
] as const;
export function studioPreset(
  style: "courtside" | "clubhouse" | "matchpoint" = "courtside",
): StudioDesign {
  const palette = {
    courtside: ["#101B38", "#FFFFFF", "athletic"],
    clubhouse: ["#F8F5EB", "#173F36", "editorial"],
    matchpoint: ["#F6F8FF", "#122C62", "modern"],
  }[style];
  return {
    version: 1,
    layout: "classic",
    font: palette[2] as StudioDesign["font"],
    backgroundColor: palette[0],
    textColor: palette[1],
    radius: 20,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    sections: [
      {
        id: "header",
        kind: "header",
        text: "{{organizationName}}",
        fontSize: 18,
      },
      {
        id: "artwork",
        kind: "image",
        height: style === "clubhouse" ? 330 : 420,
        fit: "cover",
      },
      {
        id: "event",
        kind: "event",
        fontSize: style === "courtside" ? 30 : 26,
        eventStyle: style === "courtside" ? "matchup" : "plaque",
        background:
          style === "clubhouse"
            ? "#DAD4BE"
            : style === "matchpoint"
              ? "#122C62"
              : "#293754",
        color: style === "clubhouse" ? "#173F36" : "#FFFFFF",
      },
      ...(style === "matchpoint"
        ? [{ id: "rule", kind: "divider" as const }]
        : []),
      { id: "guest", kind: "guest", text: "{{guestName}}", fontSize: 18 },
      { id: "qr", kind: "qr" },
      {
        id: "footer",
        kind: "footer",
        text: "One guest · One entry · Keep this QR private",
        fontSize: 12,
      },
    ],
  };
}
export function assetReference(
  value?: string,
): { org: string; id: string } | null {
  const m =
    /^https:\/\/storage\.googleapis\.com\/[a-z0-9._-]+\/admission_designs\/([a-f0-9-]{36})\/([a-f0-9-]{36})\.png$/.exec(
      value || "",
    );
  return m ? { org: m[1], id: m[2] } : null;
}
export function designImages(d: StudioDesign): string[] {
  return [
    ...new Set(
      [d.backgroundImage, ...(d.sections || []).map((s) => s.image)].filter(
        (s): s is string => !!s,
      ),
    ),
  ];
}
export function ticketDate(value?: string | null, timeZone = "UTC") {
  const date = new Date(value || "");
  return Number.isFinite(+date)
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        timeZone,
        timeZoneName: "short",
      }).format(date)
    : "";
}
export function dynamicText(value: string, data: TicketData, timeZone = "UTC") {
  const fields: Record<string, string> = {
    organizationName: data.organizationName,
    eventName: data.eventName,
    ticketType: data.typeName,
    date: ticketDate(data.startsAt, timeZone),
    venue: data.location,
    guestName: data.guestName || "Ticket holder",
  };
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] || "");
}
const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const hex = (value: unknown, fallback: string) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const bound = (
  v: number | undefined,
  min: number,
  max: number,
  fallback: number,
) => (Number.isFinite(v) ? Math.max(min, Math.min(max, v!)) : fallback);
/** No HTML, arbitrary CSS, external fonts or executable SVG can enter the output. */
export function renderStudioTicket(
  d: StudioDesign,
  data: TicketData,
  images: Record<string, string> = {},
) {
  const ink = hex(d.textColor, "#092031"),
    paper = hex(d.backgroundColor, "#FFFDF8"),
    accent = hex(data.accentColor, "#6D28D9");
  const family =
    d.font === "editorial" ? "Georgia, serif" : "Arial, sans-serif";
  let y = 6;
  const parts: string[] = [];
  const rect = (
    x: number,
    top: number,
    w: number,
    h: number,
    color: string,
    r = 0,
  ) =>
    `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>`;
  function lines(value: string, size: number, max: number) {
    const out: string[] = [];
    for (const paragraph of value.slice(0, 2000).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        let token = "";
        for (const c of word) {
          token += c;
          if (token.length * size * 0.58 > max) {
            if (line) {
              out.push(line);
              line = "";
            }
            out.push(token);
            token = "";
          }
        }
        if (!token) continue;
        if ((line.length + token.length + 1) * size * 0.58 > max && line) {
          out.push(line);
          line = token;
        } else line += (line ? " " : "") + token;
      }
      out.push(line);
    }
    return out;
  }
  function text(
    value: string,
    size: number,
    color: string,
    align: "left" | "center" | "right",
    pad: number,
    bold = false,
  ) {
    const rows = lines(value, size, 420 - pad * 2),
      x = align === "left" ? pad : align === "right" ? 420 - pad : 210;
    parts.push(
      `<text x="${x}" y="${y + size}" fill="${color}" font-family="${family}" font-stretch="${d.font === "athletic" && bold ? "condensed" : "normal"}" font-size="${size}" font-weight="${bold ? "700" : "400"}" text-anchor="${align === "left" ? "start" : align === "right" ? "end" : "middle"}">${rows.map((row, i) => `<tspan x="${x}" dy="${i ? size * 1.35 : 0}">${esc(row)}</tspan>`).join("")}</text>`,
    );
    y += rows.length * size * 1.35;
  }
  function picture(
    url: string | undefined,
    top: number,
    height: number,
    fit: string,
    position: number,
    horizontal: number,
    zoom: number,
    opacity: number,
  ) {
    if (!url) return false;
    const src = images[url] || (assetReference(url) ? url : "");
    if (!src) return false;
    const scale = bound(zoom, 100, 250, 100) / 100;
    const x = (-(scale - 1) * 420 * bound(horizontal, 0, 100, 50)) / 100;
    const offset = (-(scale - 1) * height * bound(position, 0, 100, 50)) / 100;
    parts.push(
      `<svg x="0" y="${top}" width="420" height="${height}" overflow="hidden"><image opacity="${bound(opacity, 0, 100, 100) / 100}" x="${x}" y="${offset}" width="${420 * scale}" height="${height * scale}" href="${esc(src)}" preserveAspectRatio="xMidY${position < 34 ? "Min" : position > 66 ? "Max" : "Mid"} ${fit === "contain" ? "meet" : "slice"}"/></svg>`,
    );
    return true;
  }
  const blocks = d.sections || studioPreset().sections!;
  for (const b of blocks) {
    if (b.display === "wallet") continue;
    if (b.hidden && b.kind !== "event" && b.kind !== "qr") continue;
    if (b.kind === "image" && !b.image) continue;
    const top = y,
      pad = bound(b.padding, 10, 36, 22),
      size = bound(b.fontSize, 12, 32, b.kind === "event" ? 26 : 15),
      align = b.align || "center",
      color = hex(b.color, ink);
    let backgroundIndex = -1;
    if (
      b.backgroundMode !== "transparent" &&
      (b.backgroundMode === "tinted" ||
        b.backgroundMode === "solid" ||
        b.background ||
        (d.backgroundImage && b.kind !== "image" && b.kind !== "divider"))
    ) {
      backgroundIndex = parts.length;
      parts.push("");
    }
    y += pad;
    if (b.kind === "image") {
      const h = bound(b.height, 80, 500, 180);
      y = top;
      picture(
        b.image,
        top,
        h,
        b.fit || "cover",
        b.position ?? 50,
        b.horizontal ?? 50,
        b.zoom ?? 100,
        b.artworkOpacity ?? 100,
      );
      if (b.text) {
        parts.push(
          `<g opacity="${bound(b.overlay, 50, 100, 65) / 100}">${rect(0, top, 420, h, "#000000")}</g>`,
        );
        y = top + 12;
        text(
          dynamicText(b.text, data, d.timeZone).slice(0, 90),
          20,
          "#FFFFFF",
          align,
          24,
          true,
        );
      }
      y += h;
    } else if (b.kind === "divider") {
      parts.push(rect(pad, y, 420 - pad * 2, 1, hex(b.color, accent)));
      y += pad;
    } else if (b.kind === "event") {
      const matchup =
        b.eventStyle === "matchup" ? data.eventName.split(/\s+vs\.?\s+/i) : [];
      if (matchup.length === 2) {
        text(matchup[0], size, color, align, pad, true);
        text("◆ VS ◆", 13, color, align, pad, true);
        text(matchup[1], size, color, align, pad, true);
      } else {
        text(
          b.eventStyle === "plaque"
            ? data.eventName.toUpperCase()
            : data.eventName,
          size,
          color,
          align,
          pad,
          true,
        );
      }
      y += 10;
      for (const value of [
        data.typeName,
        ticketDate(data.startsAt, d.timeZone),
        data.location,
      ]) {
        text(value, 14, color, align, pad);
        y += 5;
      }
      if (d.showDescription !== false && data.description) {
        y += 6;
        text(data.description.slice(0, 500), 14, color, align, pad);
      }
      y += pad;
    } else if (b.kind === "qr") {
      const state = data.status || "valid";
      text(
        state === "valid"
          ? "ENTRY PASS"
          : state.replace(/_/g, " ").toUpperCase(),
        12,
        ink,
        "center",
        pad,
        true,
      );
      y += 10;
      if (data.qr?.startsWith("data:image/png;base64,")) {
        const qrSize = bound(b.qrSize, 180, 260, 240),
          left = (420 - qrSize) / 2;
        parts.push(
          rect(left - 8, y, qrSize + 16, qrSize + 16, "#FFFFFF", 8),
          `<image x="${left}" y="${y + 8}" width="${qrSize}" height="${qrSize}" href="${esc(data.qr)}"/>`,
        );
        y += qrSize + 30;
      } else {
        text(
          state === "preview"
            ? "QR issued after reservation"
            : "Entry QR unavailable",
          16,
          ink,
          "center",
          pad,
          true,
        );
        y += 12;
      }
      if (data.entryStart && data.entryEnd) {
        text(
          "Entry: " +
            ticketDate(data.entryStart, d.timeZone) +
            " – " +
            ticketDate(data.entryEnd, d.timeZone),
          12,
          ink,
          "center",
          pad,
        );
        y += 8;
      }
      if (data.passInstructions) {
        text(data.passInstructions, 12, ink, "center", pad);
        y += 8;
      }
      if (data.ticketId) text("Pass " + data.ticketId, 11, ink, "center", pad);
      text("One guest · Gate validation required", 12, ink, "center", pad);
      y += pad;
    } else {
      if (b.kind === "guest" || b.kind === "sponsor") {
        text(
          b.kind === "guest" ? "GUEST" : "EVENT PARTNER",
          11,
          color,
          align,
          pad,
          true,
        );
        y += 6;
      }
      text(
        dynamicText(b.text || "", data, d.timeZone),
        size,
        color,
        align,
        pad,
        ["header", "guest"].includes(b.kind),
      );
      y += pad;
    }
    if (backgroundIndex >= 0)
      parts[backgroundIndex] = rect(
        0,
        top,
        420,
        y - top,
        hex(b.background, paper),
      ).replace(
        "<rect ",
        `<rect opacity="${b.backgroundMode === "solid" ? 1 : b.backgroundMode === "tinted" ? bound(b.backgroundOpacity, 0, 100, 65) / 100 : !b.background && d.backgroundImage ? 0.88 : 1}" `,
      );
  }
  y += 6;
  if (y > 6000)
    throw new Error(
      "This design is too tall. Shorten text or remove sections.",
    );
  const radius = bound(d.radius, 0, 32, 20);
  const edge =
    d.edge === "rounded"
      ? `<rect width="420" height="${y}" rx="${radius}"/>`
      : `<path d="M18 0 H192 A18 18 0 0 0 228 0 H402 L420 18 V${y - 18} L402 ${y} H228 A18 18 0 0 0 192 ${y} H18 L0 ${y - 18} V18 Z"/>`;
  const clipId = `ticket-corners-${Math.round(y * 100)}-${radius}-${d.edge === "rounded" ? "round" : "cut"}`;
  const background =
    d.backgroundImage &&
    (images[d.backgroundImage] || assetReference(d.backgroundImage))
      ? `<image width="420" height="${y}" href="${esc(images[d.backgroundImage] || d.backgroundImage)}" preserveAspectRatio="xMidYMid slice" opacity="0.5"/>`
      : "";
  return {
    height: Math.ceil(y),
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="${Math.ceil(y * 2)}" viewBox="0 0 420 ${y}" role="img" aria-label="Admission ticket"><defs><clipPath id="${clipId}">${edge}</clipPath></defs><g clip-path="url(#${clipId})">${rect(0, 0, 420, y, paper)}${background}${d.topAccent === false ? "" : rect(0, 0, 420, 6, accent)}${parts.join("")}${d.bottomAccent === false ? "" : rect(0, y - 6, 420, 6, accent)}</g></svg>`,
  };
}

export function studioDesignIssue(d: StudioDesign): string | null {
  try {
    if (d.timeZone) new Intl.DateTimeFormat("en-US", { timeZone: d.timeZone });
  } catch {
    return "Choose a valid IANA event timezone.";
  }
  const color = /^#[0-9a-f]{6}$/i,
    ink = d.textColor || "#092031",
    paper = d.backgroundColor || "#FFFDF8";
  if (!color.test(ink) || !color.test(paper))
    return "Use #RRGGBB colors such as #6D28D9.";
  const lum = (h: string) =>
    [1, 3, 5]
      .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a: string, b: string) =>
    (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  if (contrast(ink, paper) < (d.backgroundImage ? 7 : 4.5))
    return "Increase the contrast between ticket text and background.";
  if (!d.sections) return null;
  if (d.sections.length < 2 || d.sections.length > 12)
    return "Use between 2 and 12 sections.";
  if (new Set(d.sections.map((s) => s.id)).size !== d.sections.length)
    return "Section IDs must be unique.";
  for (const kind of ["event", "qr"])
    if (
      d.sections.filter((s) => s.kind === kind).length !== 1 ||
      d.sections.some((s) => s.kind === kind && s.hidden)
    )
      return "Keep one visible event section and one visible QR section.";
  if (designImages(d).length > 5)
    return "Use no more than five distinct uploaded images in a design.";
  for (const s of d.sections) {
    const name = BLOCK_NAMES[s.kind];
    for (const match of (s.text || "").matchAll(/\{\{([^}]+)\}\}/g))
      if (!(FIELD_NAMES as readonly string[]).includes(match[1]))
        return "Unknown dynamic field: " + match[1];
    if (!name) return "Unsupported ticket section.";
    if (["event", "qr"].includes(s.kind) && s.display && s.display !== "all")
      return "Event and QR sections must appear in every format.";
    for (const [key, min, max] of [
      ["padding", 10, 36],
      ["fontSize", 12, 32],
      ["height", 80, 500],
      ["zoom", 100, 250],
      ["horizontal", 0, 100],
      ["overlay", 50, 100],
      ["backgroundOpacity", 0, 100],
      ["artworkOpacity", 0, 100],
      ["qrSize", 180, 260],
      ["position", 0, 100],
    ] as const) {
      const v = s[key];
      if (v !== undefined && (!Number.isInteger(v) || v < min || v > max))
        return `${name}: ${key} must be between ${min} and ${max}.`;
    }
    if ((s.text || "").length > 240)
      return `${name}: keep content under 240 characters.`;
    if (
      (s.color && !color.test(s.color)) ||
      (s.background && !color.test(s.background))
    )
      return `${name}: use six-digit hex colors.`;
    if (
      contrast(s.color || ink, s.background || paper) <
      (d.backgroundImage ? 7 : 4.5)
    )
      return `${name}: increase text contrast.`;
  }
  return null;
}
