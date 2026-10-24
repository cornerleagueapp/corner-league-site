const assert = require('node:assert/strict'), fs = require('node:fs'), Module = require('node:module'), ts = require('typescript'), React = require('react');
let search = '', listRefresh = 0, detailRefresh = 0, navigated = '';
const list = {data:{items:[],total:0},isPending:false,isError:false,isFetching:false,refetch:async()=>{listRefresh++}};
const detail = {isPending:true,isError:false,isFetching:false,refetch:async()=>{detailRefresh++}};
const mocks = {
  "./GameCard": {default:()=>null,teamHref:()=>""},
  react:{...React,useState:initial=>[initial,()=>{}]},
  './TeamBracket':{default:()=>null}, './TeamRecruitment':{default:()=>null},
  '@/components/branding/ConsumerBrandingHero':{default:()=>null},
  '@/pages/organizations/SandboxContext':{useSandbox:()=>null},
  '@/lib/teamSports':{},
  wouter:{useSearch:()=>search,useLocation:()=>['/sports/basketball/organizations/org',url=>{navigated=url}],Link:'a'},
  '@tanstack/react-query':{useQuery:q=>q.queryKey[0]==='team-seasons'?list:detail},
};
const mod=new Module('TeamSeasons',module);mod.paths=module.paths;mod.require=name=>mocks[name]??require(name);
mod._compile(ts.transpileModule(fs.readFileSync('client/src/components/team-sports/TeamSeasons.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,'TeamSeasons');
function render(){const root=mod.exports.default({organizationId:'org',sportKey:'basketball'});return root.type(root.props);}
function nodes(n,p){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(x=>nodes(x,p));return [...(p(n)?[n]:[]),...nodes(n.props?.children,p)];}
function text(n){return Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):String(n??'');}
function refresh(tree){return nodes(tree,n=>n.type==='button'&&/Refresh/.test(text(n)))[0];}
let tree=render();assert(text(tree).includes('once the organizer publishes a season'));assert(!text(tree).includes('Previous seasons'));
refresh(tree).props.onClick();assert.equal(listRefresh,1);assert.equal(detailRefresh,0);
search='?season=season';tree=render();refresh(tree).props.onClick();assert.equal(listRefresh,2);assert.equal(detailRefresh,1);
list.isFetching=true;tree=render();assert(refresh(tree).props.disabled);list.isFetching=false;
search='';list.isError=true;tree=render();assert(text(tree).includes('Unable to load seasons'));assert(!text(tree).includes('No published seasons'));list.isError=false;
list.data={items:[{id:'season',name:'Summer',leagueName:'Basketball League'}],total:1};tree=render();
nodes(tree,n=>n.type==='button'&&text(n).includes('Basketball League'))[0].props.onClick();assert.equal(navigated,'/sports/basketball/organizations/org?season=season');
list.data.total=21;assert(text(render()).includes('Next seasons'));
console.log('PASS publication empty/error states, bounded manual refresh, detail refresh, single-page controls and season selection');
