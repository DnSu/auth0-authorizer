import generatePolicy from "./utils/generatePolicy";
import getTokenFromEvent from "./utils/getTokenFromEvent";
import { verifyToken } from "./utils/verifyToken";
import { AuthOConfig, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";

const auth0Authorizier = async function (
  auth0Config: AuthOConfig,
  event: AuthorizerEvent,
  context: unknown,
  callback: any,
) {
  const tokenValue = getTokenFromEvent(event, callback);
  const verifyResult = await verifyToken(tokenValue, auth0Config);
  if (verifyResult === false) {
    callback("Error: Invalid token"); // Return a 401 Unauthorized response
  } else {
    // console.log(verifyResult);
    const resource: string = event.methodArn || event.routeArn || "";
    callback(
      null,
      generatePolicy(verifyResult.sub, "Allow", resource, {
        roles: verifyResult.roles,
        accessToken: tokenValue,
        principalId: verifyResult.sub,
      }),
    );
  }
  /*
  callback(null, generatePolicy("user", "Allow", event.methodArn));
  callback(null, generatePolicy("user", "Deny", event.methodArn));
  callback("Unauthorized"); // Return a 401 Unauthorized response
  callback("Error: Invalid token"); // Return a 500 Invalid token response
  */
};

export { getAuthInfo };
export default auth0Authorizier;