import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, X, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ProfileListAvatar from "@/components/community/ProfileListAvatar";
import { publicSportData, SportAthlete, sportLabels } from "@/lib/sportRegistration";
export default function AthleteAccountLinks({username,racer}:{username:string;racer?:{profileUrl:string|null;isVerifiedAthlete:boolean;name?:string}|null}) {
 const [open,setOpen]=useState(false);
 const query=useQuery({queryKey:["sport-account-athletes",username],queryFn:async()=>{
 const rows=await publicSportData<SportAthlete[]>(`/sport-registration/accounts/${encodeURIComponent(username)}/profiles`);
 if(!Array.isArray(rows))throw Error("Athlete profiles could not load.");return rows;},staleTime:60000,retry:false});
 const profiles=(query.data||[]).map(p=>({id:p.id,name:p.name,sport:sportLabels[p.sportKey]||p.sportKey,href:`/athlete/${encodeURIComponent(p.id)}?sport=${encodeURIComponent(p.sportKey)}`,image:p.imageUrl}));
 if(racer?.isVerifiedAthlete&&racer.profileUrl)profiles.unshift({id:"jet-ski",name:racer.name||username,sport:"Jet Ski",href:racer.profileUrl,image:null});
 if(!profiles.length&&!query.isError)return null;
 return <Dialog.Root open={open} onOpenChange={setOpen}>
   <Dialog.Trigger asChild><button type="button" className="profile-verified-badge"><ShieldCheck size={16}/> {profiles.length ? "Verified athlete" : "Athlete profiles"}</button></Dialog.Trigger>
   <Dialog.Portal><Dialog.Overlay className="community-dialog-overlay"/>
   <Dialog.Content className="community-people-dialog athlete-profile-picker">
     <Dialog.Title className="pr-12 text-xl font-bold">Athlete profiles</Dialog.Title>
     <Dialog.Description className="mt-2 text-sm text-cl-muted">Choose a sport profile for @{username}.</Dialog.Description>
     <Dialog.Close className="community-dialog-close" aria-label="Close athlete profiles"><X size={22}/></Dialog.Close>
     {query.isError&&<div role="alert" className="mt-4 text-sm">Additional profiles could not load. <button className="underline" onClick={()=>void query.refetch()}>Try again</button></div>}
     <div className="mt-5 grid gap-3">{profiles.map(p=><Link key={p.id} href={p.href} onClick={()=>setOpen(false)} className="profile-picker-row">
       <ProfileListAvatar key={p.image} src={p.image} name={p.name}/><span className="min-w-0 flex-1"><strong className="block break-words">{p.name}</strong><span className="text-sm text-cl-muted">{p.sport}</span></span><ChevronRight size={18}/>
     </Link>)}</div>
   </Dialog.Content></Dialog.Portal>
 </Dialog.Root>;
}
