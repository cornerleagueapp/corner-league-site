import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { SPORT_VISUALS } from '@/lib/sportVisuals';
import { categories, labels, discovery, searchUrl, DiscoveryGroup, visibleGroups } from './api';
import { DiscoveryCard } from './DiscoveryCards';
import './discovery.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export default function DiscoveryPage(){
 const query=useSearch(),[,navigate]=useLocation(),params=new URLSearchParams(query);
 const q=params.get('q')||'',kind=categories.includes(params.get('kind')||'')?params.get('kind')!:'all',sport=params.get('sport')||'';
 const [input,setInput]=useState(q),[page,setPage]=useState(1);const auth=useAuth();
 useEffect(()=>{setInput(q);setPage(1);},[q,kind,sport]);
 const browse=!q.trim()&&['organizations','events'].includes(kind);
 const result=useQuery({queryKey:['discovery',auth.user?.id||'guest',q,kind,sport,page],queryFn:({signal})=>discovery<{groups:DiscoveryGroup[]}>('search',{q,kind,page:String(page),...(sport?{sport}:{})},auth.isAuthenticated,signal),enabled:browse||q.trim().length>=2,staleTime:60000,retry:false});
 const groups=visibleGroups(result.data?.groups);
 return <main className="discovery-page"><h1>{q?`Search results for “${q}”`:browse?`Explore ${labels[kind].toLowerCase()}`:'Search Corner League'}</h1><form className="discovery-search-form" onSubmit={e=>{e.preventDefault();navigate(searchUrl(input.trim(),kind,sport));}}><input aria-label="Search Corner League" type="search" value={input} maxLength={80} onChange={e=>setInput(e.target.value)} placeholder="Search athletes, users, organizations, events, articles…"/><button>Search</button></form><nav className="discovery-filters" aria-label="Result category">{categories.map(k=><button key={k} aria-pressed={kind===k} onClick={()=>navigate(searchUrl(q,k,sport))}>{labels[k]}</button>)}</nav><div className="discovery-sport-filter"><label htmlFor="discovery-sport">Filter by sport</label><Select value={sport||'all'} onValueChange={value=>navigate(searchUrl(q,kind,value==='all'?'':value))}><SelectTrigger id="discovery-sport" className="discovery-sport-trigger"><SelectValue/></SelectTrigger><SelectContent className="discovery-sport-menu" position="popper"><SelectItem value="all">All sports</SelectItem>{Object.entries(SPORT_VISUALS).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
 {!browse&&q.trim().length<2?<p role="status">Enter at least two characters.</p>:result.isPending?<div className="discovery-loading" role="status">Searching…</div>:result.isError?<div role="alert">{result.error.message} <button onClick={()=>void result.refetch()}>Retry</button></div>:<>{!groups.length&&<p role="status">No results found</p>}{result.data?.groups.some(g=>g.signInRequired)&&<a href="/auth">Sign in to search user accounts</a>}{groups.map(g=><section key={g.kind}><div className="discovery-section-title"><h2>{labels[g.kind]}</h2>{kind==='all'&&g.hasNextPage&&<button onClick={()=>navigate(searchUrl(q,g.kind,sport))}>View all →</button>}</div>{g.kind==='users'&&<p className="discovery-note">Community accounts are separate from athlete profiles. Sport filters apply to sport-specific records.</p>}{g.signInRequired?<a href="/auth">Sign in to search user accounts</a>:g.items.length?<div className="discovery-grid">{g.items.map(i=><DiscoveryCard key={i.id} item={i}/>)}</div>:<p>No matches in this category.</p>}</section>)}{kind!=='all'&&(groups.length>0||page>1)&&<div className="discovery-pagination"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page}</span><button disabled={!groups.some(g=>g.hasNextPage)||page>=50} onClick={()=>setPage(p=>p+1)}>Next</button></div>}</>}
 </main>;
}
