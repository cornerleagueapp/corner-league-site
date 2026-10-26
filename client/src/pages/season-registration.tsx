import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearch } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/apiClient';
import { unwrapSportData } from '@/lib/sportRegistration';
import { PageSEO } from '@/seo/usePageSEO';
import { Button } from '@/components/ui/button';
type Preview={id:string;name:string;leagueName:string;organizationName:string;sportKey:string;startsOn:string;endsOn:string;open:boolean;instructions:string;linkedEventRequired:boolean};
export default function SeasonRegistration(){
 const params=new URLSearchParams(useSearch()),id=params.get('season')||'';
 const {user,isAuthenticated,isLoading}=useAuth();
 const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 const preview=useQuery({queryKey:['season-registration-public',id],enabled:valid,staleTime:15000,retry:false,queryFn:async()=>unwrapSportData<Preview>(await apiRequest('GET',`/season-registration/${id}/preview`))});
 const data=preview.data,next=`/season-registration?season=${encodeURIComponent(id)}`;
 return <main className="mx-auto w-full max-w-2xl px-4 py-10 text-foreground"><PageSEO title="Season registration" canonicalPath="/season-registration" noindex/>
 <section className="space-y-5 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
  <p className="text-sm font-semibold text-muted-foreground">CORNER LEAGUE · SEASON REGISTRATION</p>
  <h1 className="text-3xl font-bold">{data?.name||'Join a season'}</h1>
  {!valid&&<p role="alert">This registration link is incomplete. Ask the organizer for a new link.</p>}
  {(preview.isLoading||isLoading)&&<p role="status">Loading season…</p>}
  {preview.error&&<div role="alert"><p>{preview.error.message}</p><Button variant="outline" onClick={()=>void preview.refetch()}>Try again</Button></div>}
  {data&&<><p className="font-semibold">{data.organizationName} · {data.leagueName}</p><p className="text-sm text-muted-foreground">{data.sportKey.replace(/-/g,' ')} · {data.startsOn} – {data.endsOn}</p>
  {!!data.instructions&&<p className="whitespace-pre-wrap break-words">{data.instructions}</p>}
  <p>Register for this season’s unassigned player pool. Your coach and team are assigned separately. You do not need to create an organization or use Corner League OS.</p>
  {data.linkedEventRequired&&<p>This season requires confirmed registration in its linked event first. Contact the organizer for that registration link.</p>}
  {!data.open?<p role="status" className="rounded-xl bg-muted p-4">Registration is closed for this season. Contact the organizer for help.</p>:!isAuthenticated?<Button asChild><Link href={`/auth?next=${encodeURIComponent(next)}`}>Sign in or create an account</Link></Button>:<RegistrationForm key={`${user?.id}:${id}`} id={id} sport={data.sportKey} account={String(user?.id)} onRefresh={()=>void preview.refetch()}/>}
  </>}
 </section></main>;
}
function RegistrationForm({id,sport,account,onRefresh}:{id:string;sport:string;account:string;onRefresh:()=>void}){
 const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');const writing=useRef(false),cache=useQueryClient();
 const profiles=useQuery({queryKey:['season-registration-profiles',account],staleTime:15000,retry:false,queryFn:async()=>unwrapSportData<{id:string;name:string;sportKey:string}[]>(await apiRequest('GET','/sport-registration/profiles/me'))});
 const choices=(profiles.data||[]).filter(p=>p.sportKey===sport),profile=choices.find(p=>p.id===selected)?.id||(choices.length===1?choices[0].id:'');
 async function submit(){if(!profile||writing.current)return;writing.current=true;setBusy(true);setError('');try{await apiRequest('POST',`/team-management/seasons/${id}/register`,{profileId:profile});setDone(true);await cache.invalidateQueries({queryKey:['social-notification-count',account]});}catch(e){setError((e as Error).message);onRefresh();}finally{writing.current=false;setBusy(false);}}
 if(done)return <div role="status" className="space-y-3 rounded-xl border border-border bg-muted p-4"><h2 className="text-xl font-bold">You’re registered</h2><p>Your participation in this season is confirmed. Team assignments are managed separately.</p><p className="text-sm">For seasons using the new registration setup, a confirmation is queued for email and added to your notifications.</p><Button asChild variant="outline"><Link href="/notifications">View notifications</Link></Button></div>;
 return <div className="space-y-4 border-t border-border pt-5">
 {profiles.isLoading?<p role="status">Loading your athlete profiles…</p>:profiles.error?<div role="alert"><p>{profiles.error.message}</p><Button onClick={()=>void profiles.refetch()}>Retry profiles</Button></div>:!choices.length?<div><p>Create your {sport} athlete profile first, then continue with your season registration.</p><Button asChild className="mt-3"><Link href={`/create-racer-profile?athletes=1&sport=${encodeURIComponent(sport)}&next=${encodeURIComponent(`/season-registration?season=${id}`)}`}>Create athlete profile</Link></Button></div>:<>
 <label className="block font-medium" htmlFor="registration-athlete">Athlete profile</label><select id="registration-athlete" className="min-h-11 w-full rounded-xl border border-border bg-background p-3 pr-10 text-foreground" value={profile} disabled={busy} onChange={e=>setSelected(e.target.value)}><option value="">Select your athlete profile</option>{choices.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
 <p className="text-sm text-muted-foreground">Registration confirms participation in this season’s pool. No payment is collected here.</p><Button disabled={busy||!profile} onClick={()=>void submit()}>{busy?'Registering…':'Confirm season registration'}</Button>
 </>}{!!error&&<p role="alert" className="text-destructive">{error}</p>}</div>;
}
