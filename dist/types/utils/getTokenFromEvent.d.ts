import { AuthorizerEvent } from "../Authorizer.interface";
declare function getTokenFromEvent(event: AuthorizerEvent): string;
export default getTokenFromEvent;
