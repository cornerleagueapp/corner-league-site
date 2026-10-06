export type OrgPost = {
  id: string;
  title: string;
  content: string;
  postType: "announcement" | "update" | "article";
  contentFormat: "plain" | "markdown";
  summary?: string | null;
  accentColor?: string;
  headerImageUrl?: string | null;
  articleImageUrl?: string | null;
  headerImageCaption?: string | null;
  articleImageCaption?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  organization?: {
    id: string;
    name?: string;
    abbreviation?: string;
    logoUrl?: string;
  };
};
export function safePostImage(value?: string | null) {
  if (!value) return undefined;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function postAccent(value?: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value! : "#22D3EE";
}
export function postLines(content: string, format: string) {
  return content.split(/\r?\n/).map((text) => {
    if (format === "markdown" && /^#{1,3} /.test(text))
      return { kind: "heading", text: text.replace(/^#{1,3} /, "") };
    if (format === "markdown" && /^- /.test(text))
      return { kind: "bullet", text: text.slice(2) };
    return { kind: "paragraph", text };
  });
}
export function postInline(text: string, format: string) {
  return (format === "markdown" ? text.split(/(\*\*[^*]+\*\*)/g) : [text]).map(
    (part) => ({
      bold:
        format === "markdown" && part.startsWith("**") && part.endsWith("**"),
      text:
        format === "markdown" && part.startsWith("**") && part.endsWith("**")
          ? part.slice(2, -2)
          : part,
    }),
  );
}
