# auth0-authorizer

JWT authorizer helper for AWS Lambda + API Gateway using Auth0 RS256 tokens.

## Install

```bash
yarn add auth0-authorizer
```

For TypeScript projects, also install the AWS Lambda types:

```bash
yarn add -D @types/aws-lambda
```

## Public API

Use only the package root import:

```ts
import Auth0Authorizer, {
  AuthInfo,
  AuthorizerEvent,
  Auth0Config,
  getAuthInfo,
} from "auth0-authorizer";
```

Deep imports (for example `auth0-authorizer/dist/...` or `auth0-authorizer/src/...`) are not supported.

## Requirements

- Auth0 access tokens must be signed with `RS256`.
- The token `aud` must match `auth0Config.audience`.
- The token `iss` must be `https://<your-auth0-domain>/`.
- Roles are read from the custom claim `${audience}/roles` and exposed as `string[]`.
- `clientId` is optional and currently not enforced during token verification.

## Auth0 Action example (Post-Login)

Use the standalone Auth0 Action example in [examples/auth0-post-login-action.js](examples/auth0-post-login-action.js).

For this package to read roles, ensure `auth0Config.audience` matches the audience/namespace used in the claim key.

## Authorizer function

Create your authorizer Lambda (example: `src/authorizer.ts`):

```ts
import Auth0Authorizer, { AuthorizerEvent, Auth0Config } from "auth0-authorizer";

const auth0Config: Auth0Config = {
  domain: "xxx.us.auth0.com",
  audience: "https://my-api",
};

export const handler = async (event: AuthorizerEvent) =>
  Auth0Authorizer(auth0Config, event);
```

The authorizer returns an IAM policy (`AuthorizerPolicyResult`): an Allow policy
for a valid token, a Deny policy otherwise. Return it directly from the handler.

## Serverless Framework examples

`serverless.yml` (partial):

```yml
provider:
  name: aws
  runtime: nodejs24.x

  # HTTP API (API Gateway v2)
  httpApi:
    authorizers:
      customAuthorizer:
        type: request
        functionName: authorizerFunc
        # Cache the authorizer result per token so a burst of parallel
        # requests from one client invokes the authorizer once. Keep the TTL
        # modest: Deny results are cached too.
        resultTtlInSeconds: 300
        identitySource:
          - $request.header.Authorization

functions:
  # Shared authorizer function
  authorizerFunc:
    handler: src/authorizer.handler

  # REST API (API Gateway v1)
  functionWithAuth:
    handler: handler.func
    events:
      - http:
          path: /func
          method: post
          cors: true
          authorizer:
            name: authorizerFunc
            resultTtlInSeconds: 0

  # HTTP API (API Gateway v2)
  functionWithAuth2:
    handler: handler.func
    events:
      - httpApi:
          path: /func-2
          method: post
          authorizer:
            name: customAuthorizer
```

## Reading auth context in protected handlers

Use `getAuthInfo(event)` inside handlers behind this authorizer:

```ts
import { AuthInfo, getAuthInfo } from "auth0-authorizer";

export const protectedHandler = async (event: any) => {
  const auth: AuthInfo = getAuthInfo(event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      principalId: auth.principalId,
      roles: auth.roles,
      email: auth.authUser["https://my-api/email"],
    }),
  };
};
```

Returned values:

- `principalId`: Auth0 user subject (`sub`)
- `roles`: string array from `${audience}/roles`
- `authUser`: fully decoded JWT payload (`JwtPayload` from `jsonwebtoken`) — includes all standard claims (`sub`, `iss`, `aud`, `exp`, `iat`, etc.) and any custom claims injected by Auth0 Actions

Type information:

- `AuthInfo`: `{ principalId: string; roles: string[]; authUser: JwtPayload }`

`authUser` gives downstream handlers access to the full token without re-verifying it. Custom Auth0 claims are keyed by namespace, e.g. `authUser["https://my-api/roles"]`.

## Behavior

- Valid token returns an IAM Allow policy. Policies (Allow and Deny) are scoped
  to the whole stage (`arn:...:api-id/stage/*`), not the triggering route: when
  authorizer result caching is enabled, API Gateway replays the cached policy
  for every route the same token hits during the TTL, and a route-scoped policy
  would deny all other routes.
- Missing, malformed, invalid, or unverifiable tokens return an IAM **Deny**
  policy — API Gateway responds `403` (both REST and HTTP APIs). The authorizer
  Lambda itself never fails for expected auth failures, so a `500` from API
  Gateway always indicates a genuine bug or misconfiguration.
- Every denial logs its reason via `console.warn`
  (`auth0-authorizer: request denied: ...`), including JWT verification errors
  (e.g. `TokenExpiredError` with the token's `expiredAt`) and JWKS fetch
  failures, so expired tokens are distinguishable from infrastructure problems
  in CloudWatch.
- Transient JWKS fetch failures (network errors, rate limiting) are retried
  once after 250 ms before denying. A key genuinely missing from the JWKS
  (`SigningKeyNotFoundError`) is not retried. JWKS requests time out after 5 s
  so a hung fetch fails fast enough to leave room for the retry.
- Token verification allows 5 s of clock tolerance, so freshly issued tokens
  are not rejected by minor clock skew between Auth0 and the Lambda.
- An empty or missing `domain`/`audience` in `Auth0Config` throws immediately
  (an invocation error, i.e. `500`): misconfiguration is a consumer bug, not an
  auth failure, and should fail loudly rather than deny every request.
- Raw bearer tokens are not injected into Lambda authorizer context.

## Migrating from v2

v3 is promise-based and no longer uses the Lambda callback:

- Handler signature changed: `Auth0Authorizer(auth0Config, event)` returns the
  policy — return it from your handler. The `context` and `callback` arguments
  are gone.
- Auth failures now produce a Deny policy (HTTP `403`) instead of failing the
  invocation (`401` on REST APIs, an opaque `500` on HTTP APIs). If your client
  treats `401` specially (e.g. to trigger re-login), update it to handle `403`.
- Denials are now logged via `console.warn`; previously they were silent.