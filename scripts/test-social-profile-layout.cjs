const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup: render } = require('react-dom/server');
let auth = { user: { id: 'a' }, isAuthenticated: true };
let state = 'ready';
let queries = [];
const person = { id: 'a', username: 'jake', firstName: 'Jake', lastName: 'Simon', bio: 'Community member', tags: { profile: [] } };
const racer = { sportKey: 'jet-ski', isVerifiedAthlete: true, profileUrl: '/racers/jake' };
function compile(relative, mocks) {
  const filename = path.resolve(__dirname, '..', relative);
  const m = new Module(filename, module);
  m.filename = filename; m.paths = module.paths;
  const fallback = m.require.bind(m);
  m.require = name => Object.hasOwn(mocks, name) ? mocks[name] : fallback(name);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return m.exports.default;
}
const Avatar = compile('client/src/components/community/AccountAvatar.tsx', {});
assert.match(render(React.createElement(Avatar, { username: 'jake' })), />JA</);
assert.doesNotMatch(render(React.createElement(Avatar, { username: 'jake', picture: 'javascript:alert(1)' })), /<img/);
assert.match(render(React.createElement(Avatar, { username: 'jake', picture: 'https://example.com/avatar.png' })), /<img/);
const noop = () => null;
const Page = compile('client/src/pages/profile/user-profile.tsx', {
  '@/components/community/PeopleDialog': {default: () => null,__esModule:true},
  '@/components/community/FollowedResults': {default: () => null,__esModule:true},
  '@/components/community/OrganizationFollowing': {FollowedOrganizations: () => null},
  '@/hooks/useAuth': { useAuth: () => auth },
  '@/hooks/useSportSelection': { useSportSelection: () => ({ sportKey: 'golf' }) },
  '@/components/community/AccountAvatar': { default: Avatar, __esModule: true },
  '@/components/community/ProfilePhotoViewer': {default: Avatar, __esModule:true},
  '@/components/community/ProfileHeader': {default: ({sport}) => React.createElement('div', {'data-sport':sport}), __esModule:true},
  '@/components/sport-hub/SportArtwork': { default: ({sport}) => React.createElement('div', {'data-sport': sport}), __esModule: true },
  '@/components/sport-registration/AthleteAccountLinks': { default: noop, __esModule: true },
  '@/components/community/Publishing': { PublicationList: noop },
  '@/components/community/RacerIdentityCard': { default: noop, __esModule: true },
  '@/components/community/FollowedAthletesPanel': { default: noop, __esModule: true },
  '@/components/community/UserSocialControls': { PeoplePanel: noop, UserSocialControls: ({targetId}) => React.createElement('div', {'data-target':targetId}) },
  '@/components/community/SocialPosts': { default: ({compose}) => React.createElement('div', {'data-compose':String(compose)}, 'Posts feed'), __esModule:true, SocialFailure: () => React.createElement('p', {role:'alert'}, 'Failed profile'), socialBox:'box', socialButton:'button' },
  '@/lib/communityApi': { getCommunityProfile: noop }, '@/lib/socialApi': { socialRequest: noop }, '@/seo/usePageSEO': { PageSEO: noop },
  wouter: { Link: ({children,...props}) => React.createElement('a',props,children) },
  '@tanstack/react-query': { useQuery: opts => { queries.push(opts.queryKey); return opts.queryKey[0] === 'community-profile' ? { data:{user:person,racerProfile:racer}, isPending:state==='loading', isError:state==='error', refetch:noop } : {data:{followersCount:4,followingCount:7}}; } },
});
const draw = () => render(React.createElement(Page,{username:'jake'}));
let html = draw();
assert.doesNotMatch(html,/Search Users|Community profile/); assert.match(html,/Verified athlete/); assert.match(html,/data-compose="true"/);
assert.match(html,/data-sport="jet-ski"/); assert.match(html,/aria-pressed="true"[^>]*>Posts/);
assert.doesNotMatch(html,/Favorite teams|Find people/); assert.ok(!queries.some(q=>q[0]==='profile-teams'));
auth = {user:{id:'b'},isAuthenticated:true}; assert.match(draw(),/data-compose="false"/);
auth = {user:null,isAuthenticated:false}; assert.doesNotMatch(draw(),/Search Users/);
state='loading'; assert.match(draw(),/Loading profile/);
state='error'; assert.match(draw(),/Retry profile/);
console.log('PASS profile identity, sport cover, default posts, owner/visitor/guest controls, removed teams request, loading/errors and avatar fallbacks');
