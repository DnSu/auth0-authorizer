var normalizeRoles = function (rolesValue) {
    if (Array.isArray(rolesValue)) {
        return rolesValue.filter(function (role) { return typeof role === "string"; });
    }
    if (typeof rolesValue !== "string") {
        return [];
    }
    var trimmed = rolesValue.trim();
    if (!trimmed) {
        return [];
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            var parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.filter(function (role) { return typeof role === "string"; });
            }
        }
        catch (_a) {
            return [];
        }
    }
    return trimmed
        .split("|")
        .map(function (role) { return role.trim(); })
        .filter(function (role) { return role.length > 0; });
};
export default function getAuthInfo(event) {
    var _a, _b, _c;
    var typedEvent = event;
    var authorizerInfo = (_a = typedEvent.requestContext) === null || _a === void 0 ? void 0 : _a.authorizer;
    if (!authorizerInfo)
        throw new Error("Auth is required, and no auth info was found");
    var roles = normalizeRoles((authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.roles) || ((_b = authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.lambda) === null || _b === void 0 ? void 0 : _b.roles) || []);
    return {
        roles: roles,
        principalId: (authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.principalId) || ((_c = authorizerInfo === null || authorizerInfo === void 0 ? void 0 : authorizerInfo.lambda) === null || _c === void 0 ? void 0 : _c.principalId) || "",
    };
}
