import { apiRequest } from "@/lib/apiClient";
export type GalleryTag={athleteId:string;name:string;profileUrl:string|null};
export type GalleryPhoto={id:string;organizationId:string;organizationName:string;url:string;caption:string;album:string;capturedAt:string;uploadedAt:string;tags:GalleryTag[]};
export type GalleryPage={items:GalleryPhoto[];total:number;page:number;limit:number};
export function galleryResponse(value:unknown):GalleryPage {
 const raw=value as any;const data=raw?.status===true?raw.data:raw;
 if(!data||!Array.isArray(data.items)||!Number.isFinite(data.total))throw new Error("Gallery is temporarily unavailable.");
 return {...data,items:data.items.filter((p:any)=>typeof p?.id==="string"&&typeof p?.url==="string"&&Number.isFinite(Date.parse(p?.capturedAt))).map((p:any)=>({...p,tags:Array.isArray(p.tags)?p.tags.filter((t:any)=>typeof t?.athleteId==="string"&&typeof t?.name==="string"):[]}))};
}
export async function loadOrganizationGallery(scope:"organizations"|"athletes",id:string,page:number){return galleryResponse(await apiRequest("GET",`/organization-gallery/${scope}/${encodeURIComponent(id)}?page=${page}&limit=12`));}
export function photoDate(value:string){return new Intl.DateTimeFormat(undefined,{dateStyle:"long",timeZone:"UTC"}).format(new Date(value));}
export function safeRacerLink(value:unknown):string|null {return typeof value==="string"&&/^\/racer\/[a-zA-Z0-9_-]+$/.test(value)?value:null;}
