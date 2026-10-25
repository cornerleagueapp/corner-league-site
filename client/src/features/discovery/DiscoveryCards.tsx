import { useState } from 'react';
import { Link } from 'wouter';
import { safeProfileImage } from '@/lib/profileDirectory';
import { sportVisual } from '@/lib/sportVisuals';
import { DiscoveryItem, labels } from './api';
export function DiscoveryCard({item,feed=false}:{item:DiscoveryItem;feed?:boolean}){
 const href = item.sport ? (() => { const url = new URL(item.href, "https://cornerleague.com"); url.searchParams.set("sport", item.sport); return `${url.pathname}${url.search}${url.hash}`; })() : item.href;
 return <Link href={href} className={`discovery-card ${feed?'discovery-feed-card':''}`}>
 <DiscoveryImage item={item}/>
 <span className="discovery-card-copy"><span className="discovery-meta">{item.kind==='users'?'USER ACCOUNT':item.kind==='athletes'?'ATHLETE PROFILE':item.contentType?.replace(/-/g,' ')||labels[item.kind]||item.kind}{item.sport&&<> · {sportVisual(item.sport).label}</>}</span><strong>{item.name}</strong>{item.detail&&<span>{item.detail}</span>}{item.date&&<time dateTime={item.date}>{new Date(item.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}</span>
 </Link>;
}

export function DiscoveryImage({item}:{item:DiscoveryItem}) {
 const src=safeProfileImage(item.imageUrl),[failed,setFailed]=useState<string|null>(null);
 const person=item.kind==='users'||item.kind==='athletes';
 return <span className={`discovery-image ${person?'discovery-avatar':''}`} aria-hidden="true">
 {src&&failed!==src?<img src={src} alt="" loading="lazy" onError={()=>setFailed(src)}/>:<svg className="discovery-fallback" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
 {person?<><circle cx="24" cy="17" r="7"/><path d="M10 39v-3a14 14 0 0 1 28 0v3"/></>:item.kind==='organizations'?<><path d="M9 40V16l15-8 15 8v24H9zM19 40V29h10v11M16 20h3m10 0h3"/></>:item.kind==='events'?<><rect x="8" y="12" width="32" height="28" rx="4"/><path d="M16 7v10m16-10v10M8 23h32m-23 8h5m5 0h5"/></>:<><rect x="10" y="7" width="28" height="34" rx="4"/><path d="M17 17h14m-14 7h14m-14 7h9"/></>}
 </svg>}
 </span>;
}
