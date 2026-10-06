const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const file = path.join(
  root,
  "client/src/pages/organizations/sport-organizations.tsx",
);
const configFile = ts.readConfigFile(
  path.join(root, "tsconfig.json"),
  ts.sys.readFile,
);
if (configFile.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"),
  );
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const fixture = path.join(root, "client/src/sport-route-contract-fixture.tsx");
const fixtureText = `import { Route } from "wouter";
import SportOrganizationsPage from "./pages/organizations/sport-organizations";
export const componentRoute = <Route path="/sports/:sportKey" component={SportOrganizationsPage} />;
export const childRoute = <Route path="/sports/:sportKey"><SportOrganizationsPage /></Route>;
export const selectedHome = <SportOrganizationsPage sportKey="motocross" />;
export const routeProps = <SportOrganizationsPage params={{sportKey: "motocross"}} />;
`;
const options = {
  ...config.options,
  incremental: false,
  tsBuildInfoFile: undefined,
  noEmit: true,
};
const host = ts.createCompilerHost(options);
const originalRead = host.readFile.bind(host);
const originalExists = host.fileExists.bind(host);
host.readFile = (name) =>
  path.resolve(name) === fixture ? fixtureText : originalRead(name);
host.fileExists = (name) =>
  path.resolve(name) === fixture || originalExists(name);
const program = ts.createProgram([...config.fileNames, fixture], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (name) => name,
      getNewLine: () => "\n",
    }),
  );
  process.exit(1);
}
let routeParams = null,
  configs = [];
const mod = new Module(file, module);
mod.paths = module.paths;
const mocks = {
  wouter: { useRoute: () => [!!routeParams, routeParams], Link: () => null },
  "@tanstack/react-query": {
    useQuery: (config) => {
      configs.push(config);
      return {
        data: {
          sport: { label: "Sport" },
          organizations: [],
          meta: { itemCount: 0, hasNextPage: false },
        },
        isLoading: false,
        isError: false,
      };
    },
  },
  "@/lib/sportOrganizations": { fetchSportOrganizations: () => {} },
  "@/lib/sportNavigation": { sportOrganization: () => "" },
  "@/seo/usePageSEO": { PageSEO: () => null },
};
mod.require = (name) => mocks[name] ?? require(name);
mod._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
function check(props, expected) {
  configs = [];
  renderToStaticMarkup(React.createElement(mod.exports.default, props));
  assert.equal(configs[0].queryKey[1], expected);
  assert.equal(configs[0].enabled, !!expected);
}
check({ params: { sportKey: "motocross" } }, "motocross");
routeParams = { sportKey: "marathon" };
check({}, "marathon");
check({ sportKey: "motocross" }, "motocross");
routeParams = null;
check({}, "");
console.log(
  "PASS Wouter component/child routes, explicit home selection, passed route params, and disabled requests without a sport.",
);
