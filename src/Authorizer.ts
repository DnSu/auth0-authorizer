import generatePolicy from "./utils/generatePolicy";
import getTokenFromEvent from "./utils/getTokenFromEvent";
import { verifyToken } from "./utils/verifyToken";
import {
  AuthInfo,
  Auth0Config,
  AuthOConfig,
  AuthorizerEvent,
} from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { Callback } from "aws-lambda";
import { AuthorizerPolicyResult } from "./utils/generatePolicy";

const auth0Authorizer = async function (
  auth0Config: AuthOConfig,
  event: AuthorizerEvent,
  _context: unknown,
  callback: Callback<AuthorizerPolicyResult>,
) {
  try {
    const tokenValue = getTokenFromEvent(event);
    const verifyResult = await verifyToken(tokenValue, auth0Config);

    if (verifyResult === false) {
      callback("Unauthorized");
      return;
    }

    const resource: string = event.methodArn || event.routeArn || "";
    if (!resource) {
      callback("Unauthorized");
      return;
    }

    callback(
      null,
      generatePolicy(verifyResult.sub, "Allow", resource, {
        roles: verifyResult.roles,
        principalId: verifyResult.sub,
      }),
    );
  } catch {
    callback("Unauthorized");
  }
};

export { getAuthInfo, AuthorizerEvent, AuthOConfig, Auth0Config, AuthInfo };
export default auth0Authorizer;
