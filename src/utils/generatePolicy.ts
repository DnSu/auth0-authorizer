import { Statement } from "aws-lambda";

type PolicyEffect = "Allow" | "Deny";
export type PolicyContext = {
  principalId: string;
  roles: string[];
  role?: string[];
};

export interface AuthorizerPolicyResult {
  principalId: string;
  policyDocument: {
    Version: "2012-10-17";
    Statement: Statement[];
  };
  context: PolicyContext;
}

export default function generatePolicy(
  principalId: string,
  effect: PolicyEffect,
  resource: string,
  context: PolicyContext,
) {
  const authResponse: AuthorizerPolicyResult = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [],
    },
    context,
  };

  if (effect && resource) {
    const statementOne: Statement = {
      Action: "execute-api:Invoke",
      Effect: effect,
      Resource: resource,
    };
    authResponse.policyDocument.Statement[0] = statementOne;
  }
  return authResponse;
}
