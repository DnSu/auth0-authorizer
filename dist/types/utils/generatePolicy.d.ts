import { Statement } from "aws-lambda";
type PolicyEffect = "Allow" | "Deny";
export type PolicyContext = {
    principalId: string;
    roles: string[];
    authUser: string;
};
export interface AuthorizerPolicyResult {
    principalId: string;
    policyDocument: {
        Version: "2012-10-17";
        Statement: Statement[];
    };
    context?: PolicyContext;
}
export default function generatePolicy(principalId: string, effect: PolicyEffect, resource: string, context?: Omit<PolicyContext, "principalId">): AuthorizerPolicyResult;
export {};
