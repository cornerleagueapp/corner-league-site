const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let response;
let request;
let query;
let identity;
const loaded = new Map();
function compile(relative) {
  if (loaded.has(relative)) return loaded.get(relative);
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = module.paths;
  const load = compiled.require.bind(compiled);
  compiled.require = name => {
    if (name === '@/lib/apiClient') return { apiRequest: async (...args) => {
      request = args;
      if (response instanceof Error) throw response;
      return response;
    }};
    if (name === '@/hooks/useAuth') return { useAuth: () => ({ user: { id: 'account' }, isAuthenticated: true }) };
    if (name === '@tanstack/react-query') return { useQuery: options => { query = options; return identity; } };
    if (name === '@/lib/utils') return { cn: () => '' };
    if (name.startsWith('@/assets/')) return 'avatar.png';
    if (name.startsWith('@/')) return compile('client/src/' + name.slice(2) + '.ts');
    return load(name);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2021 }
  }).outputText, filename);
  loaded.set(relative, compiled.exports);
  return compiled.exports;
}
// Same success envelope emitted by Nest's global ResponseInterceptor.
const wrap = data => ({ status: true, statusCode: 200, path: '/api/example', data, requestId: 'test', timestamp: '2026-10-02 00:00:00' });
(async () => {
  const api = compile('client/src/lib/selfRacerLookup.ts');
  const profile = { athleteId: 'athlete-id', racerId: 'detail-id', profileUrl: '/racer/detail-id', sportKey: 'jet-ski', name: 'Existing Racer', nickname: null, imageUrl: null, formattedLocation: null, isVerifiedAthlete: true };
  const linked = { profile, pendingClaim: null };
  response = wrap(linked);
  assert.deepEqual(await api.getMyRacerIdentity(), linked);
  assert.deepEqual(request.slice(0, 2), ['GET', '/athletes/me/racer-profile']);
  const hook = compile('client/src/hooks/useMyRacerProfile.ts');
  hook.useMyRacerProfile();
  identity = { data: await query.queryFn(), isPending: false, isError: false };
  const Link = compile('client/src/components/MyRacerProfileLink.tsx').default;
  assert.match(renderToStaticMarkup(React.createElement(Link, { onNavigate: () => {} })), /My Racer Profile/);
  assert.equal(identity.data.profile.isVerifiedAthlete, true);
  assert.deepEqual(await api.createMyRacerIdentity({ name: 'Existing Racer', nickname: '', origin: '', bio: '', skillLevel: 'amateur' }), linked);
  assert.deepEqual(request.slice(0, 2), ['POST', '/athletes/me/racer-profile']);
  for (const data of [linked, { profile: null, pendingClaim: null }, { profile: null, pendingClaim: { athleteId: 'athlete', name: 'Pending Racer' } }]) {
    assert.deepEqual(api.parseRacerIdentity(wrap(data)), data);
    assert.deepEqual(api.parseRacerIdentity(data), data);
  }
  for (const bad of [undefined, {}, wrap({}), { status: false, data: linked }, wrap({ profile: null }), wrap({ profile: { ...profile, profileUrl: 'https://evil.example' }, pendingClaim: null })]) {
    assert.throws(() => api.parseRacerIdentity(bad));
  }
  const racers = [{ id: 'detail-id', athlete: { id: 'athlete-id', name: 'Existing Racer', origin: 'Miami' } }];
  for (const payload of [wrap({ racers }), { racers }]) {
    response = payload;
    assert.deepEqual(await api.searchSelfRacers(' Existing '), [{ id: 'detail-id', name: 'Existing Racer', formattedLocation: 'Miami', profileUrl: '/racer/detail-id' }]);
    const url = new URL(request[1], 'https://example.com');
    assert.equal(url.pathname, '/jet-ski-racer-details');
    assert.equal(url.searchParams.get('search'), 'Existing');
  }
  response = wrap({ racers: [] });
  assert.deepEqual(await api.searchSelfRacers('missing'), []);
  for (const bad of [wrap({}), wrap({ racers: null }), wrap({ racers: {} }), wrap({ racers: [null] })]) {
    response = bad;
    await assert.rejects(api.searchSelfRacers('test'), /racer search results/);
  }
  response = Object.assign(new Error('Unauthorized'), { status: 401 });
  await assert.rejects(api.getMyRacerIdentity(), e => e.status === 401);
  const { toRacerLite } = compile('client/src/components/RacerSearchModal.tsx');
  assert.equal(toRacerLite(racers[0]).id, 'detail-id');
  assert.equal(toRacerLite(racers[0]).athleteId, 'athlete-id');
  console.log('PASS wrapped GET/POST identity, verified account menu, empty/pending identities, malformed-response blocking, wrapped search, HTTP auth errors, and distinct athlete/detail navigation IDs');
})().catch(error => { console.error(error); process.exitCode = 1; });
