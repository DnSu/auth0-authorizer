function getTokenFromEvent(event) {
    var _a, _b, _c, _d, _e;
    var headerAuthorization = (_e = (_d = (_b = (_a = event.headers) === null || _a === void 0 ? void 0 : _a.authorization) !== null && _b !== void 0 ? _b : (_c = event.headers) === null || _c === void 0 ? void 0 : _c.Authorization) !== null && _d !== void 0 ? _d : event.authorizationToken) !== null && _e !== void 0 ? _e : "";
    var trimmedHeader = headerAuthorization.trim();
    if (!trimmedHeader) {
        throw new Error("Unauthorized");
    }
    var tokenParts = trimmedHeader.split(/\s+/);
    var tokenType = tokenParts[0];
    var tokenValue = tokenParts[1];
    if (!((tokenType === null || tokenType === void 0 ? void 0 : tokenType.toLowerCase()) === "bearer" &&
        tokenValue &&
        tokenParts.length === 2)) {
        throw new Error("Unauthorized");
    }
    return tokenValue;
}
export default getTokenFromEvent;
