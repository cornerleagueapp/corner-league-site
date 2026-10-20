import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { loadPublications, publicationRoute, type PublicationKind } from "@/lib/publishingApi";
import { sportVisual } from "@/lib/sportVisuals";
function CommunityPreview({ sport, kind }: { sport: string; kind: PublicationKind }) {
  const title = kind === "forum" ? "Community Forum" : "Articles & Blogs";
  const href = `${publicationRoute(kind)}?sport=${encodeURIComponent(sport)}`;
  const query = useQuery({
    queryKey: ["sport-community-preview", sport, kind],
    queryFn: () => loadPublications(kind, false, { page: 1, sport }),
    staleTime: 60000, retry: false,
  });
  return <section className="sport-community-card">
    <h3><Link href={href}>{title}</Link></h3>
    {query.isPending ? <p role="status">Loading…</p> : query.isError ? <div role="alert"><p>Updates couldn’t be loaded.</p><button onClick={() => void query.refetch()}>Try again</button></div> : !query.data?.items.length ? <p>No posts yet. Be part of the conversation.</p> : <ul>{query.data.items.slice(0, 3).map(post => <li key={post.id}><Link href={`${publicationRoute(kind)}/${encodeURIComponent(post.id)}`}><strong>{post.title}</strong><p>{post.excerpt}</p></Link></li>)}</ul>}
    <Link className="sport-hub-more" href={href}>Explore {title.toLowerCase()} →</Link>
  </section>;
}
export default function SportCommunitySection({ sport }: { sport: string }) {
 return <section className="sport-hub-section"><div className="sport-section-heading"><h2>{sportVisual(sport).label} community</h2></div><div className="sport-community-grid"><CommunityPreview sport={sport} kind="forum" /><CommunityPreview sport={sport} kind="article" /></div></section>;
}
