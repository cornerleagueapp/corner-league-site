const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function compile(relative,mocks={}) {
 const filename=path.resolve(__dirname,'..',relative),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;const fallback=m.require.bind(m);
 m.require=name=>{
  if(Object.hasOwn(mocks,name))return mocks[name];
  if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?'client/src/'+name.slice(2):path.join(path.dirname(relative),name);for(const ext of ['.ts','.tsx'])if(fs.existsSync(path.resolve(__dirname,'..',base+ext)))return compile(base+ext,mocks);}
  return fallback(name);
 };
 m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2021,esModuleInterop:true}}).outputText,filename);return m.exports;
}
const math=compile('client/src/lib/athletePerformance.ts');
const row=(id,position,extra={})=>({resultId:id,athleteId:'athlete',matchId:id,eventId:'event-'+id,eventName:'Race '+id,eventStartDate:'2026-03-01T00:00:00Z',divisionId:'class',divisionName:'Ski GP',motoId:null,motoSequence:null,position,score:null,status:'FINISHED',...extra});
const history=[row('win',1,{score:25}),row('podium',3,{score:15}),row('dnf',1,{status:'DID NOT FINISH',score:0}),row('dns',1,{status:'DID NOT START',score:0}),row('dsq',1,{status:'DISQUALIFIED',score:-5}),row('unknown',null,{status:null}),row('moto',1,{score:99,motoId:'moto',motoSequence:1}),row('old-season',2,{score:100,eventStartDate:'2025-12-31T23:59:59Z'}),row('other-class',4,{divisionName:'Runabout',score:10})];
let analysis=math.analyzePerformance(history,'2026','ski gp'),s=analysis.stats;
assert.equal(s.starts,4);assert.equal(s.wins,1);assert.equal(s.podiums,2);assert.equal(s.dnf,1);assert.equal(s.dns,1);assert.equal(s.dsq,1);assert.equal(s.unknown,1);assert.equal(s.averageFinish,2);assert.equal(s.finishDeviation,1);assert.equal(s.totalPoints,35);assert.equal(s.winRate,25);assert.equal(s.podiumRate,50);assert.equal(s.completionRate,50);assert.equal(analysis.motoStats.wins,1);assert.equal(analysis.motoStats.totalPoints,99);
assert.equal(math.analyzePerformance(history,'2025').stats.totalPoints,100);assert.equal(math.analyzePerformance(history,'2026').classes.length,2);
assert.equal(math.analyzePerformance([]).stats.averageFinish,null);assert.equal(math.analyzePerformance([]).stats.totalPoints,null);assert.equal(math.analyzePerformance([]).stats.winRate,null);assert.equal(math.displayMetric(null),'—');
assert.equal(math.numeric(''),null);assert.equal(math.numeric(false),null);assert.equal(math.numeric(Infinity),null);assert.equal(math.finishPosition(row('bad',0)),null);assert.equal(math.finishPosition(row('bad',-2)),null);assert.equal(math.finishPosition(row('bad',1.5)),null);
assert.equal(math.analyzePerformance([row('a',null),row('b',-1)]).stats.classified,0);
assert.equal(math.raceStatus(row('a',2,{status:null})),'finished');
const duplicates=[row('a',2,{matchId:'same',updatedAt:'2026-01-01'}),row('b',1,{matchId:'same',updatedAt:'2026-02-01'}),row('draft',1,{isFinalized:false})];assert.equal(math.analyzePerformance(duplicates).stats.starts,1);assert.equal(math.analyzePerformance(duplicates).stats.wins,1);
assert.equal(math.classKey(row('a',1,{divisionName:'  Ski   GP '})),'ski gp');
const undated=row('undated',1,{eventStartDate:null});assert.equal(math.analyzePerformance([undated],'2026').stats.starts,0);assert.equal(math.analyzePerformance([undated],'all').stats.starts,1);assert.equal(math.performanceTrend([undated],'finish').length,0);
const recent=Array.from({length:10},(_,i)=>row(String(i),i<5?5:2,{eventStartDate:`2026-03-${String(i+1).padStart(2,'0')}T00:00:00Z`,score:10}));
assert.equal(math.analyzePerformance(recent).stats.finishImprovement,3);assert.equal(math.analyzePerformance(recent.slice(0,9)).stats.finishImprovement,null);
let points=math.performanceTrend(math.analyzePerformance(recent).overall,'points');assert.equal(points.at(-1).value,100);assert.equal(math.performanceTrend([row('m',1,{motoId:'m',score:50})],'points').length,0);
const lots=Array.from({length:30},(_,i)=>row(String(i),1,{eventStartDate:`2026-${String(1+Math.floor(i/28)).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}T00:00:00Z`,score:2}));points=math.performanceTrend(math.analyzePerformance(lots).overall,'points');assert.equal(points.length,24);assert.equal(points.at(-1).value,60);
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props));
const Chart=compile('client/src/components/athlete-performance/PerformanceChart.tsx').default;
let html=render(Chart,{rows:math.analyzePerformance(recent).overall});assert.match(html,/role="img"/);assert.match(html,/View chart values/);assert.match(html,/not an official championship standing/);assert.match(html,/<polyline/);
html=render(Chart,{rows:[]});assert.match(html,/No dated classified finishes/);assert.doesNotMatch(html,/<polyline/);
let tab='overview';
const Center=compile('client/src/components/athlete-performance/AthletePerformanceCenter.tsx',{
 react:{...React,useState:initial=>initial==='overview'?[tab,()=>{}]:React.useState(initial)},
 '@/components/community/SocialPosts':{default:()=>React.createElement('p',{},'Athlete updates'),__esModule:true},
 '@/components/OrganizationPhotoGallery':{default:()=>null,__esModule:true},
 wouter:{Link:({children,...props})=>React.createElement('a',props,children)},
}).default;
const props={racer:{id:'racer',athleteId:'athlete',racerName:'Jake Simon',bio:'Race profile'},history:recent,loading:false,sponsors:[],sponsorsLoading:false,galleryItems:[{id:'image',type:'image',url:'https://example.com/photo.jpg',title:'Race photo'}],galleryLoading:false,rating:null,canEdit:false,isOwner:false,onGallery(){},onWorldFinals(){},onRetry(){}};
html=render(Center,props);assert.match(html,/Season snapshot/);assert.match(html,/Average finish/);assert.match(html,/Season trend/);assert.match(html,/Athlete updates/);assert.match(html,/src="https:\/\/example.com\/photo.jpg"/);assert.match(html,/aria-pressed="true"[^>]*>Overview/);
tab='results';html=render(Center,props);assert.match(html,/aria-pressed="true"[^>]*>Results/);assert.match(html,/data-label="Finish"/);assert.doesNotMatch(html,/Season snapshot/);
tab='overview';html=render(Center,{...props,error:'Race history unavailable',history:[]});assert.match(html,/Race history unavailable/);assert.doesNotMatch(html,/<polyline/);
console.log('PASS season/class filters, status denominators, missing values, duplicate correction, points separation, population deviation, last-five trend, chart data and responsive result markup');
