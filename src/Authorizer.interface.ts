export interface EventRequestContextAuthorizer {
  roles: string[];
  role: string[];
  principalId: string;
}

export type EventEequestContextAuthorizer = EventRequestContextAuthorizer;

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
  clientId: string;
  audience: string;
}
