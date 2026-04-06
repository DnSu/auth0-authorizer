export interface EventRequestContextAuthorizer {
    roles: string[];
    principalId: string;
}
export interface AuthorizerEvent {
    routeArn?: string;
    methodArn?: string;
    authorizationToken?: string;
    headers?: {
        authorization?: string;
        Authorization?: string;
    };
}
export interface AuthOConfig {
    domain: string;
    clientId?: string;
    audience: string;
}
export type Auth0Config = AuthOConfig;
