# auth0-authorizer

JWT authorizer helper for AWS Lambda + API Gateway using Auth0 RS256 tokens.

## Stack

- **Language**: TypeScript 6 (strict mode, ES5 target, `ignoreDeprecations: "6.0"`)
- **Runtime**: AWS Lambda (Node.js)
- **Package manager**: Yarn 4 (Berry) with `nodeLinker: node-modules`
- **Build**: `tsc` — two configs: `tsconfig.esm.json` (output to `dist/esm/`) and `tsconfig.types.json` (output to `dist/types/`)
- **Linting**: ESLint 10 + typescript-eslint + prettier (`eslint.config.mjs`)
- **Testing**: Vitest (`test/*.test.ts`, kept outside `src/` so tests are not compiled into `dist/`)
- **Key deps**: `jsonwebtoken`, `jwks-rsa`
- **Types**: `@types/aws-lambda` (devDep only — `aws-lambda` runtime package is not needed)

## Project layout

```
src/
  Authorizer.ts           # main entry point / default export
  Authorizer.interface.ts # shared types (Auth0Config, AuthorizerEvent, AuthInfo, etc.)
  utils/
    generatePolicy.ts     # builds IAM Allow/Deny policy
    getAuthInfo.ts        # reads auth context from Lambda event
    getTokenFromEvent.ts  # extracts bearer token from event
    verifyToken.ts        # RS256 JWT verification via jwks-rsa (retry, timeout, clock tolerance)
    wildcardResource.ts   # scopes policies to the stage so cached results work across routes
test/
  helpers.ts              # test RSA keypair + token signing helpers
  *.test.ts               # vitest suites (jwks-rsa is mocked; no network)
examples/
  auth0-post-login-action.js  # Auth0 Post-Login Action that injects roles claim
dist/                     # compiled output (committed)
.github/workflows/ci.yml  # build + lint + test + dist-freshness check
```

## Build

```bash
yarn build        # builds ESM + types
yarn build:esm    # tsc -p tsconfig.esm.json
yarn build:types  # tsc -p tsconfig.types.json
yarn lint         # eslint .
yarn test         # vitest run
```

`dist/` is committed to the repo. A pre-commit hook (`git/hooks/pre-commit`) runs `yarn build && git add dist/` automatically before each commit. The hook is tracked by git; new contributors must run the following once after cloning:

```bash
git config core.hooksPath git/hooks
```

## Public API

Only the package root export is supported:

```ts
import Auth0Authorizer, { AuthInfo, AuthorizerEvent, Auth0Config, getAuthInfo } from "auth0-authorizer";
```
