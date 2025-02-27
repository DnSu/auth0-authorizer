import { AuthorizerEvent } from "../Authorizer.interface";
declare function getTokenFromEvent(event: AuthorizerEvent, callback: (error: string | null) => void): string;
export default getTokenFromEvent;
