import generatePolicy from "./utils/generatePolicy";
import getTokenFromEvent from "./utils/getTokenFromEvent";
import { verifyToken } from "./utils/verifyToken";
import { AuthInfo, Auth0Config, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { AuthorizerPolicyResult } from "./utils/generatePolicy";
import wildcardResource from "./utils/wildcardResource";

// Auth failures return a Deny policy (API Gateway responds 403) instead of
// failing the invocation: on HTTP APIs (v2) an errored authorizer Lambda
// surfaces as an opaque 500 to the client. Unexpected errors still throw,
// so genuine bugs keep producing a 500.
const denyPolicy = (
  resource: string,
  reason: string,
): AuthorizerPolicyResult => {
  console.warn(`auth0-authorizer: request denied: ${reason}`);
  return generatePolicy("unauthorized", "Deny", resource || "*");
};

// Misconfiguration (as opposed to a bad token) is a deploy-time bug in the
// consumer: throw so the invocation fails loudly instead of denying every
// request with a misleading JWKS error.
const validateConfig = (auth0Config: Auth0Config) => {
  if (
    typeof auth0Config?.domain !== "string" ||
    auth0Config.domain.trim() === ""
  ) {
    throw new Error(
      "auth0-authorizer: auth0Config.domain must be a non-empty string",
    );
  }
  if (
    typeof auth0Config.audience !== "string" ||
    auth0Config.audience.trim() === ""
  ) {
    throw new Error(
      "auth0-authorizer: auth0Config.audience must be a non-empty string",
    );
  }
};

const auth0Authorizer = async function (
  auth0Config: Auth0Config,
  event: AuthorizerEvent,
): Promise<AuthorizerPolicyResult> {
  validateConfig(auth0Config);

  const resource = wildcardResource(event.methodArn || event.routeArn || "");
  if (!resource) {
    return denyPolicy(resource, "event has no methodArn/routeArn");
  }

  let tokenValue: string;
  try {
    tokenValue = getTokenFromEvent(event);
  } catch {
    return denyPolicy(
      resource,
      "missing or malformed Authorization bearer token",
    );
  }

  const verifyResult = await verifyToken(tokenValue, auth0Config);
  if (!verifyResult.ok) {
    return denyPolicy(resource, verifyResult.reason);
  }

  return generatePolicy(verifyResult.sub, "Allow", resource, {
    roles: verifyResult.roles,
    authUser: JSON.stringify(verifyResult.jwtPayload),
  });
};

export {
  getAuthInfo,
  AuthorizerEvent,
  Auth0Config,
  AuthInfo,
  AuthorizerPolicyResult,
};
export default auth0Authorizer;
