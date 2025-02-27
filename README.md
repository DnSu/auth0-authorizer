# auth0-authorizer

authorizer.ts
```
import Auth0Authorizer, { AuthorizerEvent, AuthOConfig } from "auth0-authorizer";

export const auth0Config: AuthOConfig = {
  domain: "xxx.us.auth0.com",
  clientId: "yyyy",
  audience: "zzzz",
};

export const handler = async function (
  event: AuthorizerEvent,
  context,
  callback,
) {
  await Auth0Authorizer(auth0Config, event, context, callback);
};
```


serverless.yml (partial)
```
provider:
  name: aws
  runtime: nodejs20.x
  ### HTTP API (API Gateway v2)
  httpApi:
    authorizers:
      customAuthorizer:
        type: request
        functionName: authorizerFunc
        resultTtlInSeconds: 0
functions:
  ### REST API (API Gateway v1)
  authorizerFunc:
    handler: src/Authorizer/Authorizer.handler
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
  ### HTTP API (API Gateway v2)
  functionWithAuth2:
    handler: handler.func
    events:
      - httpApi:
          path: /func-2
          method: post
          authorizer: 
            name: customAuthorizer
```