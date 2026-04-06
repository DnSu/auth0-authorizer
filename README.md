# auth0-authorizer

JWT authorizer helper for AWS Lambda + API Gateway using Auth0 RS256 tokens.

## Install

```bash
yarn add auth0-authorizer
```

## Public API

Use only the package root import:

```ts
import Auth0Authorizer, {
  AuthorizerEvent,
  AuthOConfig,
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

## Authorizer function

Create your authorizer Lambda (example: `src/authorizer.ts`):

```ts
import Auth0Authorizer, { AuthorizerEvent, AuthOConfig } from "auth0-authorizer";

const auth0Config: AuthOConfig = {
  domain: "xxx.us.auth0.com",
  audience: "https://my-api",
};

export const handler = async (
  event: AuthorizerEvent,
  context: unknown,
  callback: (error?: string | null, response?: unknown) => void,
) => {
  await Auth0Authorizer(auth0Config, event, context, callback);
};
```

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
        resultTtlInSeconds: 0

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
import { getAuthInfo } from "auth0-authorizer";

export const protectedHandler = async (event: any) => {
  const auth = getAuthInfo(event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      principalId: auth.principalId,
      roles: auth.roles,
    }),
  };
};
```

Returned values:

- `principalId`: Auth0 user subject (`sub`)
- `roles`: string array from `${audience}/roles`
- `role`: alias of `roles` for backward compatibility (deprecated)

### Compatibility note

- Prefer `auth.roles` in new code.
- `auth.role` is deprecated and planned for removal in `v2.0.0`.

## Behavior

- Missing or malformed bearer token returns `Unauthorized`.
- Invalid or unverifiable token returns `Unauthorized`.
- Raw bearer tokens are not injected into Lambda authorizer context.
- Valid token returns an IAM Allow policy for the current route/method.