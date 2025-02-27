import { EventEequestContextAuthorizer } from "../Authorizer.interface";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getAuthInfo(event: any): EventEequestContextAuthorizer {
  const authorizerInfo = event.requestContext.authorizer as
    | {
        lambda?: {
          accessToken: string;
          principalId: string;
          roles: string;
        };
        principalId?: string;
        roles?: string;
        accessToken?: string;
      }
    | undefined;
  if (!authorizerInfo)
    throw new Error("Auth is required, and no auth info was found");
  return {
    role: authorizerInfo?.roles || authorizerInfo?.lambda?.roles || "",
    principalId:
      authorizerInfo?.principalId || authorizerInfo?.lambda?.principalId || "",
    accessToken:
      authorizerInfo?.accessToken || authorizerInfo?.lambda?.accessToken || "",
  };
}
