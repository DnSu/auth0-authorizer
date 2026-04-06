import generatePolicy from "./utils/generatePolicy";
import getTokenFromEvent from "./utils/getTokenFromEvent";
import { verifyToken } from "./utils/verifyToken";
import { AuthOConfig, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { Callback, CustomAuthorizerResult } from "aws-lambda";

const auth0Authorizier = async function (
  auth0Config: AuthOConfig,
  event: AuthorizerEvent,
  context: unknown,
  callback: Callback<CustomAuthorizerResult>,
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
  /*
  callback(null, generatePolicy("user", "Allow", event.methodArn));
  callback(null, generatePolicy("user", "Deny", event.methodArn));
  callback("Unauthorized"); // Return a 401 Unauthorized response
  callback("Error: Invalid token"); // Return a 500 Invalid token response
  */
};

export { getAuthInfo, AuthorizerEvent, AuthOConfig };
export default auth0Authorizier;
