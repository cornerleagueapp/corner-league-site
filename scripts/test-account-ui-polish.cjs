const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript'), React = require('react');
const {renderToStaticMarkup:render}=require('react-dom/server');
function compile(relative,mocks={}) { const filename=path.resolve(__dirname,'..',relative),m=new Module(filename,module);m.filename=filename;m.paths=module.paths;const fallback=m.require.bind(m);m.require=name=>Object.hasOwn(mocks,name)?mocks[name]:fallback(name);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);return m.exports.default; }
let section='profile';
const Settings=compile('client/src/pages/profile/settings.tsx',{
 react:{...React,useState:initial=>[initial==='profile'?section:typeof initial==='boolean'?false:initial,()=>{}]},
 '@/components/community/SocialPreferences':{default:()=>React.createElement('p',{},'Preference controls'),__esModule:true},
 '@/hooks/useAuth':{useAuth:()=>({user:{id:'a',username:'jake'}})},
 '@tanstack/react-query':{useMutation:()=>({isPending:false,mutate(){}})},
 '@/lib/queryClient':{queryClient:{invalidateQueries:async()=>{}}},
 '@/lib/apiClient':{apiRequest:async()=>{},apiFetch:async()=>{}},
 '@/hooks/use-toast':{useToast:()=>({toast(){}})},
 '@/lib/authUtils':{isUnauthorizedError:()=>false},
 '../../components/TagsInput':{default:()=>null,__esModule:true},
});
let html=render(React.createElement(Settings));
assert.match(html,/aria-pressed="true"[^>]*class="settings-section-button"[^>]*>.*?Profile/s);
assert.match(html,/aria-pressed="false"[^>]*class="settings-section-button"[^>]*>.*?Notifications/s);
section='notifications';html=render(React.createElement(Settings));
assert.match(html,/aria-pressed="false"[^>]*class="settings-section-button"[^>]*>.*?Profile/s);
assert.match(html,/aria-pressed="true"[^>]*class="settings-section-button"[^>]*>.*?Notifications/s);
assert.match(html,/Preference controls/);assert.doesNotMatch(html,/type="submit"/);
const Newsletter=compile('client/src/components/marketing/NewsletterForm.tsx',{
 '@tanstack/react-query':{useQuery:()=>({data:{enabled:true,consentText:'Optional marketing consent'}})},
 wouter:{Link:({children,...p})=>React.createElement('a',p,children)},
 '@/lib/apiClient':{apiRequest:async()=>{}},'@/lib/sportRegistration':{publicSportData:async()=>{}},
});
html=render(React.createElement(Newsletter,{layout:'footer'}));
assert.match(html,/consumer-newsletter--footer/);assert.match(html,/type="email"[^>]*required/);
assert.match(html,/type="checkbox"[^>]*required/);assert.doesNotMatch(html,/type="checkbox"[^>]*checked/);
assert.match(html,/type="submit"[^>]*disabled/);assert.match(html,/Optional marketing consent/);assert.match(html,/href="\/terms"/);
assert.match(render(React.createElement(Newsletter)),/consumer-newsletter--wide/);
console.log('PASS both Settings active states and content, footer layout, unchanged required opt-in consent, disabled initial subscribe, and standalone newsletter layout');
