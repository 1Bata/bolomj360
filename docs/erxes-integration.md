# How bolomj360 plugs into erxes

erxes discovers this plugin at runtime through the same Redis used by the API.
Enable `bolomj360` in `ENABLED_PLUGINS` on the gateway and core-api, and restart
them. No monorepo workspace or source import is required.

## Names

All of these come from `erxes.json`. They must stay consistent.

| Name           | Value                      | Used by                                                        |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| `name`         | `bolomj360`                 | Redis keys, `ENABLED_PLUGINS`, CDN folder, docker host         |
| `ui.name`      | `bolomj360`                 | `CONFIG.name`, permissions, page expose `./bolomj360`                          |
| `ui.remote`    | `bolomj360_ui`               | Module Federation container (core-api derives it from `name`)  |
| `ui.path`      | `bolomj360`                 | Route `/bolomj360/*` in core-ui                                 |
| GraphQL prefix | `bolomj360` / `Bolomj360` | Operation, field and type names (unique across the supergraph) |

**Dashed names:** `inventory` maps to `inventory_ui` / `./inventory`;
`inventory-tools` maps to the container `inventory_tools_ui`, page expose
`./inventory-tools`, and page export `InventoryTools`. Its public identity
stays `inventory-tools` in `name`, `ui.name`, `CONFIG.name` and API
`permissions.plugin`; never substitute `inventory_tools` in permission checks.
The host must preserve the discovery remote key separately from CONFIG.name
and resolve dashed module names to PascalCase exports. Those host fixes are
required for dashed plugins; use a single-word name on older hosts. API
authorization remains required regardless of host route guards.

## API registration

On start, erxes-api-shared `startPlugin` writes what
`joinErxesGateway` writes: the `erxesservice:config:bolomj360` JSON
(`uiEntry` from `UI_ENTRY_URL`), the `erxes-service-bolomj360` address, and
in production the router-update lock plus the BullMQ
`gateway-update-apollo-router` job.

`startPlugin` serves the federated subgraph at `/graphql`, exposes
`GET /health`, and parses the gateway's forwarded headers — `user` (base64
JSON of the signed-in user) and `hostname`/`nginx-hostname` — into the
context itself. `apolloServerContext` then adds `models` from
`generateModels(subdomain, context)`: Mongoose models bound to that tenant's
database, which is the only supported way to touch plugin data.

The context also carries `checkPermission(action)` — use it in resolvers;
the UI route guard is not a security boundary. Every type and operation
carries the plugin prefix because all plugins share one supergraph.

The gateway only composes plugins listed in its `ENABLED_PLUGINS`.

## UI loading

1. core-api `GET /get-frontend-plugins` returns `{ name: "bolomj360_ui", entry }`
   for each enabled plugin. `entry` is the registered `uiEntry`, or
   `https://plugins.erxes.io/<releaseVersion>/bolomj360_ui/remoteEntry.js`.
2. core-ui loads `bolomj360_ui/config` and reads the exported `CONFIG`.
3. core-ui routes `/<CONFIG.path>/*` to `bolomj360_ui/<CONFIG.name>`, rendering
   the page component `Bolomj360`. The page owns its `AppLayout`, game route,
   and single-item sidebar. CONFIG supplies a navigation
   group `defaultPath` and module paths relative to the host root, including the
   plugin prefix (for example, `bolomj360/records`, not just `records`). Sidebar
   links use a leading `/`; CONFIG paths do not. The host does not use
   the old `settingsNavigation` or navigation-group `content`/`subGroup` slots.
   Only `./config` and `./bolomj360` are baseline exposes; add optional widgets
   when there is actual functionality behind them.
4. The `hostShared` list in `ui/rspack.config.ts` — `react`, `react-dom`,
   `react-router`, `react-router-dom`, `@apollo/client`, `jotai`,
   `react-i18next`, `erxes-ui` and `ui-modules` — mirrors core-ui's
   `coreLibraries` singletons, so the page runs inside core-ui's router,
   ApolloProvider, i18n and design system with the user's auth cookie. The
   remote never bundles them.

core-ui in development also registers remotes it gets from
`/get-frontend-plugins`, so `pnpm dev:uis` in erxes plus `pnpm run dev:ui`
here is enough.

## App routes

`ui/src/Main.tsx` owns the game shell below `/bolomj360`:

| Route          | Page       | Purpose                                 |
| -------------- | ---------- | --------------------------------------- |
| `/bolomj360/*`  | `PlayPage` | Difficulty-based car race and upgrades |

Question generation is local, so play works without a question-service round
trip. Correct game answers are recorded by the API with a validated difficulty
reward (1, 2, or 3 coins); car upgrades spend coins atomically on the server.

`LearnerProvider` wraps the shell and exposes the profile, sync mode, pending
queue and the `recordAttempt` / `upgradeCar` commands. The game page never
calls the Apollo mutations directly, which keeps offline fallback in one place.

## Shared libraries

`erxes-ui` and `ui-modules` — plus `erxes-api-shared` on the platform stack —
are published to npm as `@erxes/ui`, `@erxes/ui-modules` and
`@erxes/api-shared` ([erxes/ui](https://github.com/erxes/ui),
[erxes/ui-modules](https://github.com/erxes/ui-modules),
[erxes/api-shared](https://github.com/erxes/api-shared)). This repo installs
them under the names erxes code imports, with npm aliases:

```jsonc
// ui/package.json
"erxes-ui":   "npm:@erxes/ui@3.3.4",
"ui-modules": "npm:@erxes/ui-modules@3.3.4"
```

```jsonc
// api/package.json (platform stack)
"erxes-api-shared": "npm:@erxes/api-shared@3.3.4"
```

Notes:

- For the platform stack, use Yarn 4+ if choosing Yarn (tested: 4.18.1).
  Published `@erxes/api-shared` has a `yarn: "please-use-pnpm"` engine field,
  which Yarn Classic rejects. Modern Yarn installs the package without
  disabling engine checks. Activate Yarn 4 using Corepack, or choose pnpm.

- The tested host baseline is **erxes 3.3.2**. Exact package pins are
  `@erxes/ui@3.3.4`, `@erxes/ui-modules@3.3.4`, and `@erxes/api-shared@3.3.4`.
  This shared-library patch cohort preserves the host contract.
  React and ReactDOM 18.3.1 constraints are generated automatically, including
  transitive peers. There is no automatic `latest` upgrade. Inspect published
  peers and exports, then run fresh external install, codegen, check, build
  and a host smoke test when changing the cohort.
- The cohort's `ui-modules` peer range accepts the exact `erxes-ui` alias.
  Do not dismiss peer conflicts or use `--legacy-peer-deps` to hide them. CI verifies the installed package versions and peer ranges.
- Platform projects constrain Sentry Node 10.76.2, OpenTelemetry API 1.9.1,
  instrumentation 0.220.0 and trace SDK 2.12.0 through root npm/pnpm overrides
  or Yarn resolutions. The published floating graph can select API 1.10,
  which violates the trace SDK's `<1.10` peer range. These constraints retain
  the tested graph with real peer checks enabled; they do not assert arbitrary
  future telemetry compatibility. Update the cohort together and rerun fresh
  strict pnpm, npm and Yarn 4 platform install/codegen/check/lint/build checks.
- Published export maps include compiled declarations and, for some UI
  exports, source fallbacks. External type-check/build tests are required;
  do not assume monorepo path aliases or private files are present.
- `CONFIG.platform` declares `3.3.2` for the host compatibility
  warning. It is advisory: core-ui can still load a remote outside that range.
  Validate the host release before deployment; this field does not enforce it.
- `requiredVersion: false` is intentional **host-only consumption**, not a
  promise of cross-version compatibility. Nx hosts may advertise workspace
  versions (e.g. `1.1.0`) rather than the public cohort version. A blanket
  strict npm range would reject such hosts without proving ABI compatibility.
  Keep all nine `hostShared` keys `singleton: true, import: false`: the remote
  provides no private fallback. CI checks emitted federation stats for no
  shared fallback/provider assets. The host must supply those same keys;
  unknown/different host releases need explicit validation, not a bundled copy.

## GraphQL types

`pnpm run codegen` prints the API's subgraph SDL to
`api/generated/schema.graphql`, then `ui/codegen.ts` (graphql-codegen client
preset) validates every `gql()` document under `ui/src` against it and
generates typed documents into `ui/src/gql/` (gitignored, like
`api/generated`). Import `gql` from `~/gql` and let Apollo hooks infer their
types — drift between the SDL and the UI fails `check` instead of surfacing
as a runtime Apollo error. The same pattern backs erxes's own `operation`
plugin.

## Styling

core-ui ships Tailwind preflight and unprefixed utilities for its own code.
This remote compiles its own utilities with the `bolomj:` prefix
(`ui/src/styles.css`), mapped to the host's design tokens (`--background`,
`--muted-foreground`, …). The prefix keeps the plugin's CSS from overriding
the host or other plugins. `erxes-ui` components come pre-styled by the host's
own CSS — no extra setup needed.

## Permissions

core-ui guards the route with `hasPluginPermission(CONFIG.name)`, which only
restricts plugins that core-api lists in `pluginsWithPermissions`, i.e. plugins
whose registered `meta.permissions` declares modules or default groups.
The registered API permission plugin and `CONFIG.name` both use `bolomj360`,
including dashes. The normalized container `bolomj360_ui` is only a loading key;
it must never replace that public permission identity.
Enforce access in the API resolvers, never only in the UI.

On the platform stack, `api/src/permissions.ts` declares two modules:

| Module               | Actions                                                  | Scope        |
| -------------------- | -------------------------------------------------------- | ------------ |
| `bolomj360Learning`  | `bolomj360LearningRead`, `bolomj360LearningWrite`         | own / all    |
| `bolomj360Inbox`     | `bolomj360InboxWrite`, `bolomj360InboxRead`               | own / all    |

`main.ts` registers them as `meta.permissions`. The learner actions are marked
`always: true` and included in the `bolomj360Learners` default group so a
signed-in user can start learning without an administrator step. The read
action on inbox messages is deliberately not granted by default; only staff
should read contact submissions. If the host ignores `always`, grant the
`bolomj360Learners` group or the learning actions manually.

Every resolver requires a user, a tenant and `await checkPermission(action)`.
Models come from `context.models`, which is bound to the tenant's database, so
`all` still means this tenant only. The profile is keyed by `userId`; learners
cannot read another learner's progress. Leaderboard rows expose only display
name, avatar, grade, XP and streak.

### Data model

- `bolomj360_learners` — one profile per user: display name, grade, avatar,
  coins, XP, streak, last active day.
- `bolomj360_attempts` — append-only answer history. Profiles aggregate it into
  totals and per-topic progress, so counters are derived rather than trusted
  from the client. Every answer awards XP and (when correct) coins server-side.
- `bolomj360_messages` — contact and volunteering submissions.

The UI uses bounded `limit` values for the leaderboard (1–50) and validates
every input string, grade and computed field. It shows loading, error, empty
and offline/local states. The status query remains a diagnostic.

### Offline / weak-network behaviour

The UI keeps the last profile in `localStorage`. If the GraphQL request fails
with a network error, or the API answers with a permission error, the app
continues in `offline`/`local` mode: answers update the cached profile and are
queued. When a live connection returns, queued attempts and the pending profile
patch are sent in order, then the profile is refetched. The UI labels the mode
on every page, so a learner is never told their progress was saved to the
server when it was not. Server-side aggregation remains authoritative once
sync completes.

## Trusted gateway boundary

Both `startPlugin` and the standalone `api/src/context.ts` consume forwarded
`user` (base64 JSON) and `hostname`/`nginx-hostname` tenant headers. Base64 is
not a signature. A well-formed header can assert any identity if a caller can
reach the API directly; parsing it is not independent authentication.

- Keep API ports on a private network reachable only by the trusted gateway
  (and controlled health/introspection infrastructure). Do not publish the
  subgraph directly to the internet. Local development is trusted-local only.
- At public ingress, strip client-supplied `user`, `hostname` and
  `nginx-hostname`; configure the platform to forward its authenticated user
  and validated tenant host. Do not allow clients to override those assertions.
- A malformed standalone user header becomes anonymous. A well-formed one is
  trusted only because of this network boundary. Resolvers must still enforce
  login, permissions and tenant-scoped access.

## Production deployment

Install and retain the generated lockfile before the API Docker build. Supply
MongoDB (platform stack), Redis and gateway addressing through deployment
environment variables. Redis must be the same service/database erxes uses.
The API address (`LOAD_BALANCER_ADDRESS` or `plugin-bolomj360-api:<port>`) must be
reachable by the gateway; it is not the UI address. Production registration
must keep the router-update BullMQ job so the gateway recomposes.

Build the UI and upload **all** of `ui/dist`, not just `remoteEntry.js`, to your
static host. Set API `UI_ENTRY_URL` to the browser-reachable HTTPS URL ending in
`remoteEntry.js`. Enable CORS for the erxes UI origin. Upload chunks first and
the entry last; serve `remoteEntry.js` and federation manifests with no-store
or revalidation. Cache only content-hashed assets immutably. Preserve old
chunks during rollout so existing sessions can finish loading. The API Docker
image does not serve the UI. The plugins.erxes.io fallback is not a publishing
service: this generator does not upload your plugin there.
