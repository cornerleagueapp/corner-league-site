export function eventLivestreamUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Only a validated YouTube video ID may become an iframe source. */
export function youtubeEmbedUrl(value: unknown): string | null {
  const safe = eventLivestreamUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ].includes(host)
  ) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (/^\/(live|embed|shorts)\//.test(url.pathname))
      id = url.pathname.split("/")[2];
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id)
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
    : null;
}
