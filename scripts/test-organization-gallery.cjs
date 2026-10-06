const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript"),React=require("react");
const {renderToStaticMarkup}=require("react-dom/server");
let payload,request,options,state;
function compile(relative) {
 const file=path.resolve(__dirname,"..",relative),m=new Module(file,module);m.filename=file;m.paths=module.paths;
 m.require=name=>{
    if (name === "@/pages/organizations/SandboxContext") return { useOrganizationPageApi: () => ({ sandbox: null }) };
  if(name==="@/lib/apiClient")return {apiRequest:async(...args)=>{request=args;return payload;}};
  if(name==="@/lib/organizationGallery")return api;
  if(name==="@tanstack/react-query")return {useQuery:o=>{options=o;return state;},useQueryClient:()=>({invalidateQueries:async()=>{}})};
  if(name==="wouter")return {Link:({href,children,...props})=>React.createElement("a",{href,...props},children)};
  if(name==="@/components/ui/button")return {Button:({variant,...props})=>React.createElement("button",props)};
  if(name==="@/components/ui/dialog")return {Dialog:({open,children})=>open?React.createElement("div",null,children):null,DialogContent:({children})=>React.createElement("div",null,children),DialogDescription:({children})=>React.createElement("p",null,children),DialogTitle:({children})=>React.createElement("h2",null,children)};
  return require(name);
 };
 m._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);return m.exports;
}
const api=compile("client/src/lib/organizationGallery.ts");
const photo={id:"photo",organizationId:"org",organizationName:"Race League",url:"https://storage.googleapis.com/b/photo.jpg",caption:"Finals",album:"Championship",capturedAt:"2026-10-01T23:00:00Z",uploadedAt:"2026-10-02T01:00:00Z",tags:[{athleteId:"athlete",name:"Tagged Racer",profileUrl:"/racer/detail-id"},{athleteId:"unsafe",name:"Another Athlete",profileUrl:"javascript:alert(1)"}]};
(async()=>{
 assert.throws(()=>api.galleryResponse({data:{items:{}}}),/unavailable/);assert.throws(()=>api.galleryResponse({status:false,data:{items:[],total:0}}),/unavailable/);
 payload={status:true,data:{items:[photo,{id:"bad",url:"x",capturedAt:"bad"}],total:1,page:1,limit:12}};const result=await api.loadOrganizationGallery("athletes","athlete",1);assert.equal(result.items.length,1);assert.deepEqual(request,["GET","/organization-gallery/athletes/athlete?page=1&limit=12"]);assert.equal(api.galleryResponse({items:[{...photo,tags:null}],total:1}).items[0].tags.length,0);
 assert.equal(api.safeRacerLink("//evil.test/racer/id"),null);assert.equal(api.safeRacerLink("javascript:x"),null);assert.equal(api.safeRacerLink("/racer/detail-id"),"/racer/detail-id");assert.match(api.photoDate(photo.capturedAt),/October 1, 2026/);
 const Gallery=compile("client/src/components/OrganizationPhotoGallery.tsx").default;
 state={data:{...result,total:15},isPending:false,isError:false,isFetching:false,refetch:async()=>{}};
 const render=props=>renderToStaticMarkup(React.createElement(Gallery,props));let html=render({organizationId:"org"});assert.match(html,/Photo Gallery/);assert.match(html,/loading="lazy"/);assert.match(html,/October 1, 2026/);assert.match(html,/href="\/racer\/detail-id"/);assert.match(html,/href="\/aqua-organizations\/org"/);assert.doesNotMatch(html,/javascript:/);assert.doesNotMatch(html,/Refresh photos/);assert.match(html,/Next/);assert.deepEqual(options.queryKey,["organization-gallery","organizations","org",1]);assert.equal(options.staleTime,60000);assert.equal(options.refetchOnWindowFocus,true);
 render({athleteId:"athlete"});assert.deepEqual(options.queryKey,["organization-gallery","athletes","athlete",1]);html=render({athleteId:"athlete"});assert.match(html,/Tagged Organization Photos/);
 state={isPending:true,isError:false};assert.match(render({organizationId:"org"}),/Loading photos/);
 state={isPending:false,isError:true};assert.match(render({organizationId:"org"}),/Photos could not load/);
 state={data:{items:[],total:0},isPending:false,isError:false};assert.match(render({organizationId:"org"}),/No published photos/);
 console.log("PASS public gallery envelopes, malformed lists, separate athlete/detail IDs, safe links, UTC capture dates, cached scopes, paging and accessible loading/error states.");
})().catch(e=>{console.error(e);process.exitCode=1;});
