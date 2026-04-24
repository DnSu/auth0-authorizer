export interface AuthInfo {
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
export interface Auth0Config {
    domain: string;
    clientId?: string;
    audience: string;
}
