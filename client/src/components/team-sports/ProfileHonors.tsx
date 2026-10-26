import { useQuery } from "@tanstack/react-query";
import { publicSportData } from "@/lib/sportRegistration";
type Honor={seasonId:string;seasonName:string;leagueName:string;organizationName:string;title:string;group:string|null;publishedAt:string};
export default function ProfileHonors({id,kind="athletes"}:{id:string;kind?:"athletes"|"users"}){
 const q=useQuery({queryKey:["profile-honors",kind,id],queryFn:()=>publicSportData<{items:Honor[]}>(`/season-excellence/${kind}/${encodeURIComponent(id)}`),enabled:!!id,retry:false,staleTime:60000});
 if(q.isPending)return <p role="status" className="text-sm text-cl-muted py-3">Loading season honors…</p>;
 if(q.isError)return <div className="text-sm text-cl-muted py-3" role="status">Season honors could not be loaded. <button className="underline" onClick={()=>void q.refetch()}>Retry honors</button></div>;
 if(!q.data?.items.length)return null;
 return <section className="my-5 rounded-2xl border border-cl-border bg-cl-surface p-4 sm:p-6" aria-label="Season honors"><h2 className="text-xl font-bold text-cl-ink mb-4">Season honors</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{q.data.items.map((h,i)=><article key={`${h.seasonId}:${h.title}:${h.group}:${i}`} className="min-w-0 rounded-xl border border-cl-border bg-cl-panel p-4"><p className="text-xs font-semibold uppercase tracking-wider text-cl-accent">{h.group||"Season award"}</p><h3 className="mt-1 text-lg font-bold text-cl-ink">{h.title}</h3><p className="mt-2 text-sm text-cl-ink break-words">{h.leagueName} · {h.seasonName}</p><p className="text-sm text-cl-muted break-words">{h.organizationName}</p></article>)}</div></section>;
}
