import { sportVisual } from "./sportVisuals";
export type Breadcrumb = { label: string; href?: string };
const labels: Record<string, string> = {
  search_results: "Search results",
  scores: "Sports hub",
  aqua: "Jet Ski",
  sports: "Sports",
  community: "Community Forum",
  articles: "Articles & Blogs",
  notifications: "Notifications",
  settings: "Settings",
  profile: "Profile",
  registration: "Registration",
  calendar: "Calendar",
  "event-map": "Event map",
  "top-trends": "Trending",
  "aqua-organizations": "Organizations",
  organizations: "Organizations",
  writer: "Writer studio",
  tickets: "My tickets",
  gallery: "Photos",
  new: "Create",
  edit: "Edit",
  schedule: "Schedule",
  events: "Events",
  polls: "Polls",
  "podcast-episodes": "Podcast episodes",
  athletes: "Athletes",
  racer: "Athlete",
};
export function breadcrumbsFor(path: string): Breadcrumb[] {
  const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
  if (
    !parts.length ||
    ["auth", "messages", "internal", "admin"].includes(parts[0])
  )
    return [];
  const result: Breadcrumb[] = [{ label: "Home", href: "/" }];
  let href = "";
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    href += "/" + part;
    if (part === "event-details") {
      result.push({ label: "Event" });
      break;
    }
    if (part === "sports" && parts[index + 1]) {
      const sport = parts[++index];
      href += "/" + sport;
      result.push({ label: sportVisual(sport).label, href });
      continue;
    }
    if (part === "scores" && parts[index + 1] === "aqua") {
      index++;
      href += "/aqua";
      result.push({ label: "Jet Ski hub", href });
      continue;
    }
    const entityParent = parts[index - 1];
    const identity =
      entityParent === "profile"
        ? "User profile"
        : entityParent === "racer"
          ? "Athlete profile"
          : ["organizations", "aqua-organizations"].includes(entityParent)
            ? "Organization"
            : ["articles", "community"].includes(entityParent)
              ? entityParent === "articles"
                ? "Article"
                : "Discussion"
              : "Details";
    result.push({ label: labels[part] || identity, href });
  }
  return result.map((item, index) =>
    index === result.length - 1 ? { label: item.label } : item,
  );
}
