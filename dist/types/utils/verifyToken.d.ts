import jwt from "jsonwebtoken";
import { Auth0Config } from "../Authorizer.interface";
export type VerifyTokenResult = {
    ok: true;
    sub: string;
    roles: string[];
    jwtPayload: jwt.JwtPayload;
} | {
    ok: false;
    reason: string;
};
export declare const verifyToken: (tokenValue: string, auth0Config: Auth0Config) => Promise<VerifyTokenResult>;
