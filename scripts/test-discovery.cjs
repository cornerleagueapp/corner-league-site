const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function compile(file,mocks){const filename=path.resolve(__dirname,'..',file),m=new Module(filename,module);m.paths=module.paths;const fallback=m.require.bind(m);m.require=n=>Object.hasOwn(mocks,n)?mocks[n]:fallback(n);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2021,esModuleInterop:true}}).outputText,filename);return m.exports;}
let request,payload={groups:[]},ok=true,status=200;
const api=compile('client/src/features/discovery/api.ts',{'@/lib/apiClient':{apiFetch:async(...args)=>{request=args;return {ok,status,json:async()=>({status:true,data:payload})};}}});
const cards=compile('client/src/features/discovery/DiscoveryCards.tsx',{'./api':api,wouter:{Link:({children,...p})=>React.createElement('a',p,children)},'@/lib/sportVisuals':{sportVisual:s=>({label:s})},'@/lib/profileDirectory':{safeProfileImage:()=>null}});
(async()=>{
const signal=new AbortController().signal;await api.discovery('search',{q:'River & race',kind:'events'},false,signal);assert.match(request[0],/^\/discovery\/search\?/);assert.equal(request[1].skipAuth,true);assert.equal(request[1].signal,signal);assert.equal(new URLSearchParams(request[0].split('?')[1]).get('q'),'River & race');
await api.discovery('search',{q:'River'},true);assert.match(request[0],/^\/discovery\/me\/search/);assert.equal(request[1].skipAuth,false);
for(const href of ['javascript:alert(1)','//evil.example','https://evil.example']){payload={groups:[{items:[{id:'1',name:'Bad',href}]}]};await assert.rejects(api.discovery('search',{q:'River'},false));}
ok=false;status=429;await assert.rejects(api.discovery('search',{q:'River'},false),/wait/i);
assert.equal(api.searchUrl('River & race','events','basketball'),'/search_results?q=River+%26+race&kind=events&sport=basketball');
for(const kind of ['users','athletes']){const html=renderToStaticMarkup(React.createElement(cards.DiscoveryCard,{item:{id:'1',name:'<script>unsafe</script>',kind,href:'/profile/name',sport:kind==='athletes'?'basketball':undefined}}));assert.match(html,kind==='users'?/USER ACCOUNT/:/ATHLETE PROFILE.*basketball/);assert.doesNotMatch(html,/<script>/);}
assert.deepEqual(api.visibleGroups([{kind:'events',items:[{}]},{kind:'users',items:[]},{kind:'organizations',items:[{}]},{kind:'athletes',items:[{}]},{kind:'articles',items:[{}]}]).map(g=>g.kind),['athletes','organizations','events','articles']);
assert.deepEqual(api.visibleGroups([{kind:'users',items:[]}]),[]);
console.log('PASS discovery URL encoding, auth isolation, cancellation signal, unsafe link rejection, rate-limit message, distinct user/athlete labels and escaped content');
})().catch(e=>{console.error(e);process.exitCode=1;});
