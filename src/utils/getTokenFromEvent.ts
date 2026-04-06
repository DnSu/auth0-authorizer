import { AuthorizerEvent } from "../Authorizer.interface";

function getTokenFromEvent(event: AuthorizerEvent) {
  const headerAuthorization =
    event.headers?.authorization ??
    event.headers?.Authorization ??
    event.authorizationToken ??
    "";

  const trimmedHeader = headerAuthorization.trim();
  if (!trimmedHeader) {
    throw new Error("Unauthorized");
  }

  const tokenParts = trimmedHeader.split(/\s+/);
  const tokenType = tokenParts[0];
  const tokenValue = tokenParts[1];

  if (
    !(
      tokenType?.toLowerCase() === "bearer" &&
      tokenValue &&
      tokenParts.length === 2
    )
  ) {
    throw new Error("Unauthorized");
  }

  return tokenValue;
}

export default getTokenFromEvent;
