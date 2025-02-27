export default function generatePolicy(principalId, effect, resource, context) {
    var authResponse = {
        principalId: principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [],
        },
        context: context,
    };
    if (effect && resource) {
        var statementOne = {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: resource,
        };
        authResponse.policyDocument.Statement[0] = statementOne;
    }
    return authResponse;
}
