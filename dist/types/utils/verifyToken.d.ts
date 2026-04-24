import { Auth0Config } from "../Authorizer.interface";
export declare const verifyToken: (tokenValue: string, auth0Config: Auth0Config) => Promise<false | {
    sub: string;
    roles: string[];
}>;
