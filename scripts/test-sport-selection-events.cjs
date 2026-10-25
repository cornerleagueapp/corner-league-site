const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript'), React = require('react'), {renderToStaticMarkup:render} = require('react-dom/server');
function compile(file, mocks={}) { const f=path.resolve(file),m=new Module(f,module);m.paths=module.paths;m.require=n=>mocks[n]??require(n);m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);return m.exports; }
const nav=compile('client/src/lib/sportNavigation.ts'),visuals=compile('client/src/lib/sportVisuals.ts');
let location='/sports/jet-ski/events',search='',stored='basketball',effects=[],catalog=[];
const bus=new EventTarget();global.window={localStorage:{getItem:()=>stored,setItem:(_,v)=>stored=v},addEventListener:bus.addEventListener.bind(bus),removeEventListener:bus.removeEventListener.bind(bus),dispatchEvent:bus.dispatchEvent.bind(bus)};
const hook=compile('client/src/hooks/useSportSelection.ts',{'@/lib/sportVisuals':visuals,'@/lib/sportNavigation':nav,react:{useEffect:cb=>effects.push(cb),useSyncExternalStore:(_,snapshot)=>snapshot()},wouter:{useLocation:()=>[location],useSearch:()=>search},'./usePublicSports':{usePublicSports:()=>({data:catalog,isPending:false,isError:false})}});
function read(){const value=hook.useSportSelection();effects.splice(0).forEach(f=>f());return value;}
assert.equal(read().sportKey,'jet-ski');assert.equal(stored,'jet-ski');
location='/racer';search='sport=jet-ski';stored='basketball';assert.equal(read().sportKey,'jet-ski');assert.equal(stored,'jet-ski');
search='';catalog=[{key:'basketball',label:'Basketball'}];assert.equal(read().sportKey,'jet-ski');assert.equal(stored,'jet-ski');
location='/athlete/one';search='sport=basketball';assert.equal(read().sportKey,'basketball');assert.equal(stored,'basketball');
location='/posts/one';search='sport=jet-ski';assert.equal(read().sportKey,'jet-ski');
location='/sports/basketball/events';search='sport=jet-ski';assert.equal(read().sportKey,'basketball');
assert.deepEqual(read().sports.map(s=>s.key),['jet-ski','basketball']);
for (const sport of nav.SHOWCASE_SPORTS) {const more=nav.sportMoreLinks(sport);assert.equal(more[0].label,'Athletes');assert(more.every(l=>nav.routeSport(l.href.split('?')[0])===sport||new URL('https://test'+l.href).searchParams.get('sport')===sport));assert(more.some(l=>l.label==='Registration'));}
assert.equal(nav.sportMoreLinks('basketball').length,2);assert(nav.sportMoreLinks('jet-ski').length>1);
// Generic renders must not write their inferred fallback into shared storage.
location='/profile';search='';stored='unlisted';read();assert.equal(stored,'unlisted');
const wouter={Link:({href,children,...props})=>React.createElement('a',{href,...props},children)};
const Map=compile('client/src/components/landing/NationwideMap.tsx', {react:{...React,default:React},wouter,'@assets/us-map-outline.svg':'/map.svg'}).default;
const mapHTML=render(React.createElement(Map,{pageOnly:true,events:[{id:'known',name:'Race',startDate:'2026-10-24',endDate:'2026-10-25',location:'Lake Havasu, AZ'},{id:'unknown',name:'Game',startDate:'2026-10-24',endDate:'2026-10-25',location:'Demo Arena'}]}));
assert(mapHTML.includes('United States event map'));assert(mapHTML.includes('1 events have no mapped location'));assert(mapHTML.includes('Map of this results page'));
let configs=[],requested=[];
const Games=compile('client/src/components/team-sports/TeamGameDirectory.tsx',{wouter,'@/components/landing/NationwideMap':{default:()=>null},'@/components/sport-hub/EventOrganizationFilter':{default:()=>null},'@/lib/sportVisuals':visuals,'@/lib/sportNavigation':nav,'./GameCard':{default:()=>null},'@tanstack/react-query':{useQuery:c=>{configs.push(c);return {isPending:true};}},'@/lib/sportRegistration':{publicSportData:async url=>{requested.push(url);return {sportKey:'basketball',items:[],total:0,page:1,limit:12};}}}).default;
(async()=>{render(React.createElement(Games,{sport:'basketball'}));await configs[0].queryFn();assert(!requested[0].includes('year='));assert(requested[0].includes('sportKey=basketball'));
configs=[];render(React.createElement(Games,{sport:'basketball',organizationId:'org'}));await configs[0].queryFn();assert(requested[1].includes('organizationId=org'));
const Hub=compile('client/src/components/sport-hub/UpcomingSportEvents.tsx',{'@/lib/sportRegistration':{isTeamSport:s=>s==='basketball'},'@/components/team-sports/TeamGameDirectory':{default:({sport})=>React.createElement('div',{},'Published '+sport+' games')},'@/components/ui/LoadingCards':{default:()=>null},'@/lib/apiClient':{},'@/lib/sportHubEvents':{},'./SportArtwork':{default:()=>null},wouter,'@tanstack/react-query':{useQuery:()=>{throw new Error('Team hub must not fetch race events');}}}).default;
assert(render(React.createElement(Hub,{sport:'basketball'})).includes('Published basketball games'));
console.log('PASS explicit sport navigation, persistence, showcase choices, map unknown locations, all-year games, org scope and team hub data source.');})().catch(e=>{console.error(e);process.exitCode=1});
