import { AuthInfo, Auth0Config, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { AuthorizerPolicyResult } from "./utils/generatePolicy";
declare const auth0Authorizer: (auth0Config: Auth0Config, event: AuthorizerEvent) => Promise<AuthorizerPolicyResult>;
export { getAuthInfo, AuthorizerEvent, Auth0Config, AuthInfo, AuthorizerPolicyResult, };
export default auth0Authorizer;
