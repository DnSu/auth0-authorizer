import { AuthorizerEvent } from "../Authorizer.interface";

function getTokenFromEvent(event: AuthorizerEvent) {
  const headerAuthorization: string =
    event.headers?.authorization || event.authorizationToken || "";
  const tokenParts = headerAuthorization.split(" ");
  const tokenType = tokenParts[0];
  const tokenValue = tokenParts[1];

  if (!(tokenType?.toLowerCase() === "bearer" && tokenValue)) {
    throw new Error("Unauthorized");
  }

  return tokenValue;
}

export default getTokenFromEvent;
