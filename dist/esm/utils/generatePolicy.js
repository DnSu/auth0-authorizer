var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
        // Include principalId in context so HTTP API v2 forwards it to handlers
        // via requestContext.authorizer.lambda.principalId.
        context: __assign({ principalId: principalId }, context),
    };
}
