import { Statement } from "aws-lambda";
type PolicyEffect = "Allow" | "Deny";
export type PolicyContext = {
    roles: string[];
};
export interface AuthorizerPolicyResult {
    principalId: string;
    policyDocument: {
        Version: "2012-10-17";
        Statement: Statement[];
    };
    context: PolicyContext;
}
export default function generatePolicy(principalId: string, effect: PolicyEffect, resource: string, context: PolicyContext): {
    principalId: string;
    policyDocument: {
        Version: "2012-10-17";
        Statement: (import("aws-lambda").BaseStatement & {
            Action: string | string[];
        } & import("aws-lambda").MaybeStatementPrincipal & {
            Resource: string | string[];
        })[];
    };
    context: PolicyContext;
};
export {};
