import { AuthorizerEvent } from "../Authorizer.interface";

function getTokenFromEvent(
  event: AuthorizerEvent,
  callback: (error: string | null) => void,
) {
  const headerAuthorization: string =
    event.headers?.authorization || event.authorizationToken || "";
  const tokenParts = headerAuthorization.split(" ");
  const tokenValue = tokenParts[1];
  if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {
    // no auth token!
    console.log("authorizationToken is malformed");
    callback("Unauthorized"); // Return a 401 Unauthorized response
  }
  return tokenValue;
}

export default getTokenFromEvent;
