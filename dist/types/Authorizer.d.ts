import { AuthInfo, Auth0Config, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { Callback } from "aws-lambda";
import { AuthorizerPolicyResult } from "./utils/generatePolicy";
declare const auth0Authorizer: (auth0Config: Auth0Config, event: AuthorizerEvent, _context: unknown, callback: Callback<AuthorizerPolicyResult>) => Promise<void>;
export { getAuthInfo, AuthorizerEvent, Auth0Config, AuthInfo };
export default auth0Authorizer;
