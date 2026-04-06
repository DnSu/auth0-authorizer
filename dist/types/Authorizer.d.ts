import { Auth0Config, AuthOConfig, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
import { Callback } from "aws-lambda";
import { AuthorizerPolicyResult } from "./utils/generatePolicy";
declare const auth0Authorizer: (auth0Config: AuthOConfig, event: AuthorizerEvent, _context: unknown, callback: Callback<AuthorizerPolicyResult>) => Promise<void>;
export { getAuthInfo, AuthorizerEvent, AuthOConfig, Auth0Config };
export default auth0Authorizer;
