import { AuthInfo } from "../Authorizer.interface";

type LambdaAuthorizerContext = {
  principalId: string;
  roles: string[] | string;
};

type RequestAuthorizerContext = {
  lambda?: LambdaAuthorizerContext;
  principalId?: string;
  roles?: string[] | string;
};

type EventWithAuthorizer = {
  requestContext?: {
    authorizer?: RequestAuthorizerContext;
  };
};

const normalizeRoles = (rolesValue: unknown): string[] => {
  if (Array.isArray(rolesValue)) {
    return rolesValue.filter(
      (role): role is string => typeof role === "string",
    );
  }

  if (typeof rolesValue !== "string") {
    return [];
  }

  const trimmed = rolesValue.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (role): role is string => typeof role === "string",
        );
      }
    } catch {
      return [];
    }
  }

  return trimmed
    .split("|")
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
};

export default function getAuthInfo(event: unknown): AuthInfo {
  const typedEvent = event as EventWithAuthorizer;
  const authorizerInfo = typedEvent.requestContext?.authorizer;

  if (!authorizerInfo)
    throw new Error("Auth is required, and no auth info was found");

  const roles = normalizeRoles(
    authorizerInfo?.roles || authorizerInfo?.lambda?.roles || [],
  );

  const principalId =
    authorizerInfo?.principalId || authorizerInfo?.lambda?.principalId;
  if (!principalId) throw new Error("Auth context is missing principalId");

  return { roles, principalId };
}
