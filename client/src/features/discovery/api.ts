import { apiFetch } from '@/lib/apiClient';
export type DiscoveryItem={id:string;name:string;kind:string;href:string;sport?:string;imageUrl?:string|null;detail?:string;date?:string;contentType?:string};
export type DiscoveryGroup={kind:string;items:DiscoveryItem[];hasNextPage:boolean;signInRequired?:boolean};
export const categories=['all','athletes','users','organizations','events','articles'];
export const labels:Record<string,string>={all:'All results',athletes:'Athletes',users:'Users',organizations:'Organizations',events:'Events',articles:'Articles & posts'};
export function searchUrl(q:string,kind='all',sport=''){const p=new URLSearchParams({q,kind});if(sport)p.set('sport',sport);return `/search_results?${p}`;}
export async function discovery<T>(path:string,params:Record<string,string>,signedIn:boolean,signal?:AbortSignal):Promise<T>{
 const response=await apiFetch(`/discovery/${signedIn?'me/':''}${path}?${new URLSearchParams(params)}`,{signal,skipAuth:!signedIn,noRefresh:!signedIn});
 if(!response.ok)throw new Error(response.status===429?'Search is busy. Please wait before trying again.':'Unable to load results. Please try again.');
 const json=await response.json();
 const data=json.data;
 if(!data || (!Array.isArray(data.groups) && !Array.isArray(data.items)))throw new Error('Invalid search response.');
 const items = data.groups ? data.groups.flatMap((g:DiscoveryGroup)=>g.items) : [...data.items,...(data.upcoming||[]),...(data.organizations||[])];
 for(const i of items) if(!i || typeof i.id!=='string' || typeof i.name!=='string' || typeof i.href!=='string' || !/^\/(?!\/)/.test(i.href))throw new Error('Invalid search result.');
 return data;
}

export function visibleGroups(groups:DiscoveryGroup[]=[]){
 return groups.filter(g=>g.items.length>0).slice().sort((a,b)=>categories.indexOf(a.kind)-categories.indexOf(b.kind));
}
