// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getAuthInfo(event) {
    var _a, _b, _c;
    var authorizerInfo = event.requestContext.authorizer;
    if (!authorizerInfo)
        throw new Error("Auth is required, and no auth info was found");
    return {
        role: (authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.roles) || ((_a = authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.lambda) === null || _a === void 0 ? void 0 : _a.roles) || "",
        principalId: (authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.principalId) || ((_b = authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.lambda) === null || _b === void 0 ? void 0 : _b.principalId) || "",
        accessToken: (authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.accessToken) || ((_c = authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.lambda) === null || _c === void 0 ? void 0 : _c.accessToken) || "",
    };
}
