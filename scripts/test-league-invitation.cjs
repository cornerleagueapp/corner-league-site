const fs=require('node:fs'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require('typescript');
let response,requests=[];
function compile(file,mocks={}){const m=new Module(__filename,module);m.paths=module.paths; m.require=id=>mocks[id] || require(id);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,__filename);return m.exports;}
const {readLeagueInvitation,readInvitationAccount}=compile('client/src/lib/leagueInvitation.ts',{
 './apiClient':{apiRequest:async(...args)=>{requests.push(args);return response;}},
 './sportRegistration':{unwrapSportData:json=>json.data??json},
});
const {consumerAuthDestination}=compile('client/src/lib/organizationSignup.ts');
(async()=>{
 const next='/league-invitation?season=season&token=token';assert.equal(consumerAuthDestination('?next='+encodeURIComponent(next),false),next);
 response={status:true,data:{organizationName:'League',seasonName:'Summer',role:'athlete',status:'pending'}};
 assert.equal((await readLeagueInvitation('season','token')).organizationName,'League');
 assert.equal(requests[0][1],'/team-invitations/season/preview');assert.deepEqual(requests[0][2],{token:'token'});
 response={data:{matchesEmail:true,verified:false}};assert.equal((await readInvitationAccount('season','token')).verified,false);
 response={data:{matchesEmail:'yes'}};await assert.rejects(readInvitationAccount('season','token'),/verify/);
 response={data:{}};await assert.rejects(readLeagueInvitation('season','token'),/unavailable/);
 console.log('PASS invitation API envelopes, malformed-response rejection and preserved sign-in return link');
})().catch(e=>{console.error(e);process.exitCode=1;});
