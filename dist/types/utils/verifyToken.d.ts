import { AuthOConfig } from "../Authorizer.interface";
export declare const verifyToken: (tokenValue: string, auth0Config: AuthOConfig) => Promise<false | {
    sub: string;
    roles: string;
}>;
