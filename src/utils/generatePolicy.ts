import { CustomAuthorizerResult, Statement } from "aws-lambda";

export default function generatePolicy(
  principalId: string,
  effect: any,
  resource: any,
  context: any,
) {
  const authResponse: CustomAuthorizerResult = {
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
