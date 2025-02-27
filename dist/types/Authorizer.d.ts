import { AuthOConfig, AuthorizerEvent } from "./Authorizer.interface";
import getAuthInfo from "./utils/getAuthInfo";
declare const auth0Authorizier: (auth0Config: AuthOConfig, event: AuthorizerEvent, context: unknown, callback: any) => Promise<void>;
export { getAuthInfo, AuthorizerEvent, AuthOConfig };
export default auth0Authorizier;
