# treasure_fund_mn

treasure_fund_mn erxes тоглоомын plugin

An erxes plugin that lives outside the erxes monorepo and joins an erxes stack.
The shared-library baseline is erxes 3.3.2. Dashed plugin names
use the same public permission identity in the API and UI; the host must support
normalized remote discovery and dashed page-module loading (see integration docs).

## Тоглоом

treasure_fund_mn is a responsive, Mongolian-language car-racing quiz.
The visible brand is `treasure_fund_mn`; the erxes service identity and route
remain `bolomj360` so existing plugin discovery and permission contracts stay
compatible.

- **10 асуулттай уралдаан** болон **зөв хариултын цуваа** тоглоом.
- **Хялбар / Хэцүү / Боломжгүй** түвшин; зөв хариулт тус бүр 1 / 2 / 3 зоос.
- **Машины гарааш** — зоосоор машинаа гурван түвшин хүртэл шинэчилнэ.
- Оноо, машины шинэчлэл нэвтэрсэн сурагчийн erxes профайлд хадгалагдана.
- Сүлжээгүй үед ахиц төхөөрөмжид хадгалагдаж, сүлжээ ормогц синк хийнэ.

Progress lives in tenant-scoped Mongo collections (`bolomj360_learners`,
`bolomj360_attempts`) and is exposed through the
`bolomj360` federated GraphQL subgraph. See
[docs/erxes-integration.md](docs/erxes-integration.md#permissions) for the
permission model and [App routes](docs/erxes-integration.md#app-routes).

| Part   | Path         | Stack                                                    | Dev port    |
| ------ | ------------ | -------------------------------------------------------- | ----------- |
| API    | `api`        | Node.js 22, erxes-api-shared startPlugin + tenant-scoped Mongoose models (Node.js)                             | 3399 |
| UI     | `ui`         | React 18 Module Federation remote (Rspack), Tailwind CSS | 3099  |
| Shared | `erxes.json` | Plugin identity and ports read by both parts             |             |

The UI uses erxes's `erxes-ui`/`ui-modules` design system, installed from npm
(`@erxes/ui`, `@erxes/ui-modules`; see
[docs/erxes-integration.md](docs/erxes-integration.md#shared-libraries)). The
host supplies them at runtime via Module Federation singletons — they are
installed only so TypeScript and Rspack can resolve the imports.

## Develop

```sh
pnpm install
cp .env.example .env
pnpm run dev:api   # registers with the erxes gateway through Redis
pnpm run dev:ui    # serves http://localhost:3099/remoteEntry.js
pnpm run dev:standalone # game preview at http://localhost:3100/ without erxes
```

The standalone preview is a local-only game; coins and car upgrades are stored
in the browser and are separate from erxes learner profiles.

`check`, `build` and `dev:ui` run `codegen` first, so the generated GraphQL
types always match the printed API schema.

In the erxes checkout `.env`, add the plugin and restart the gateway and
core-api so they pick it up:

```sh
ENABLED_PLUGINS=...,bolomj360
```

Then open `http://localhost:3001/bolomj360` to play.
Both processes must use the same Redis as erxes; `UI_ENTRY_URL` must be
reachable by the browser, not merely by the API container. Requests reach the
API through the gateway (`/graphql`), which forwards the signed-in user and
tenant. Those headers are not independently authenticated: keep the API on
a private gateway-only network and strip user/tenant headers at public ingress.

## Scripts

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm run dev:api` | API in watch mode                               |
| `pnpm run dev:ui`  | UI remote dev server                            |
| `pnpm run codegen` | Print the API schema, generate UI GraphQL types |
| `pnpm run build`   | Production build of every part                  |
| `pnpm run check`   | Type-check every part                           |
| `pnpm run lint`    | oxlint                                          |
| `pnpm run fmt`     | oxfmt                                           |

## Deploy

- **API**: `docker build --build-arg UI_ENTRY_URL=<remoteEntry.js URL> -t <image> .`
  Run `pnpm install` first and commit its lockfile before building the image.
  The image serves the API on port 80 and registers itself on start
  (`plugin-bolomj360-api:80` unless `LOAD_BALANCER_ADDRESS` is set).
- **UI**: upload `ui/dist` to a static host or CDN. Upload hashed assets
  first and `remoteEntry.js` last with `Cache-Control: no-store`. Without
  `UI_ENTRY_URL`, erxes falls back to `https://plugins.erxes.io/<release>/bolomj360_ui/remoteEntry.js`;
  this generator does not upload there. Set your own browser-reachable URL,
  serve all emitted chunks with CORS for the erxes origin, and use immutable
  caching only for content-hashed assets (not stable-named expose chunks).

See [docs/erxes-integration.md](docs/erxes-integration.md) for how the plugin
plugs into erxes and [AGENTS.md](AGENTS.md) for the rules to keep it working.
