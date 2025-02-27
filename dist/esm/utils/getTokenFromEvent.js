function getTokenFromEvent(event, callback) {
    var _a;
    var headerAuthorization = ((_a = event.headers) === null || _a === void 0 ? void 0 : _a.authorization) || event.authorizationToken || "";
    var tokenParts = headerAuthorization.split(" ");
    var tokenValue = tokenParts[1];
    if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {
        // no auth token!
        console.log("authorizationToken is malformed");
        callback("Unauthorized"); // Return a 401 Unauthorized response
    }
    return tokenValue;
}
export default getTokenFromEvent;
