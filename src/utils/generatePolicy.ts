import { Statement } from "aws-lambda";

type PolicyEffect = "Allow" | "Deny";

// principalId is injected by generatePolicy from its first arg; callers omit it.
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
  context: PolicyContext;
}

export default function generatePolicy(
  principalId: string,
  effect: PolicyEffect,
  resource: string,
  context: Omit<PolicyContext, "principalId">,
) {
  const statementOne: Statement = {
    Action: "execute-api:Invoke",
    Effect: effect,
    Resource: resource,
  };

  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17" as const,
      Statement: [statementOne],
    },
    // Include principalId in context so HTTP API v2 forwards it to handlers
    // via requestContext.authorizer.lambda.principalId.
    context: { principalId, ...context },
  };
}
