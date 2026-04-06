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
  };
}

export interface AuthOConfig {
  domain: string;
  clientId?: string;
  audience: string;
}
