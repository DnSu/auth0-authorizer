export default function generatePolicy(principalId, effect, resource, context) {
    var statementOne = {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
    };
    return {
        principalId: principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [statementOne],
        },
        context: context,
    };
}
