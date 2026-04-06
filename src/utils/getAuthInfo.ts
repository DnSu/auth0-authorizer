import { EventRequestContextAuthorizer } from "../Authorizer.interface";

const normalizeRoles = (rolesValue: unknown): string[] => {
  if (Array.isArray(rolesValue)) {
    return rolesValue.filter((role): role is string => typeof role === "string");
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
        return parsed.filter((role): role is string => typeof role === "string");
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getAuthInfo(event: any): EventRequestContextAuthorizer {
  const authorizerInfo = event.requestContext.authorizer as
    | {
        lambda?: {
          principalId: string;
          roles: string[] | string;
        };
        principalId?: string;
        roles?: string[] | string;
      }
    | undefined;
  if (!authorizerInfo)
    throw new Error("Auth is required, and no auth info was found");
  const roles = normalizeRoles(
    authorizerInfo?.roles || authorizerInfo?.lambda?.roles || [],
  );
  return {
    roles,
    role: roles,
    principalId:
      authorizerInfo?.principalId || authorizerInfo?.lambda?.principalId || "",
  };
}
