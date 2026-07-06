var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
// One extra attempt after the initial call; only for errors that may be
// transient (network failures, rate limiting) — a key genuinely missing
// from the JWKS will not appear on retry.
var JWKS_RETRY_ATTEMPTS = 2;
var JWKS_RETRY_DELAY_MS = 250;
var jwksClients = new Map();
var normalizeDomain = function (domain) {
    return domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
};
var getJwksClient = function (domain) {
    var existingClient = jwksClients.get(domain);
    if (existingClient) {
        return existingClient;
    }
    var client = jwksClient({
        jwksUri: "https://".concat(domain, "/.well-known/jwks.json"),
        cache: true,
        cacheMaxEntries: 10,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
    });
    jwksClients.set(domain, client);
    return client;
};
var getSigningKeyWithRetry = function (jwksC, kid, attemptsLeft, callback) {
    jwksC.getSigningKey(kid, function (err, key) {
        if (err) {
            if (err.name !== "SigningKeyNotFoundError" && attemptsLeft > 1) {
                setTimeout(function () { return getSigningKeyWithRetry(jwksC, kid, attemptsLeft - 1, callback); }, JWKS_RETRY_DELAY_MS);
                return;
            }
            callback(err);
            return;
        }
        var signingKey = key === null || key === void 0 ? void 0 : key.getPublicKey();
        if (!signingKey) {
            callback(new Error("verifyToken: Missing signing key"));
            return;
        }
        callback(null, signingKey);
    });
};
export var verifyToken = function (tokenValue, auth0Config) { return __awaiter(void 0, void 0, void 0, function () {
    var domain, jwksC;
    return __generator(this, function (_a) {
        domain = normalizeDomain(auth0Config.domain);
        jwksC = getJwksClient(domain);
        return [2 /*return*/, new Promise(function (resolve) {
                var options = {
                    audience: auth0Config.audience,
                    issuer: "https://".concat(domain, "/"),
                    algorithms: ["RS256"],
                };
                var getPublicKey = function (header, callback) {
                    if (!header.kid) {
                        callback(new Error("verifyToken: Missing kid header"));
                        return;
                    }
                    getSigningKeyWithRetry(jwksC, header.kid, JWKS_RETRY_ATTEMPTS, callback);
                };
                jwt.verify(tokenValue, getPublicKey, options, function (verifyError, decoded) {
                    if (verifyError) {
                        var expiredAt = verifyError instanceof jwt.TokenExpiredError
                            ? " (expiredAt: ".concat(verifyError.expiredAt.toISOString(), ")")
                            : "";
                        resolve({
                            ok: false,
                            reason: "".concat(verifyError.name, ": ").concat(verifyError.message).concat(expiredAt),
                        });
                        return;
                    }
                    if (!decoded || typeof decoded === "string") {
                        resolve({ ok: false, reason: "token decoded to a non-object payload" });
                        return;
                    }
                    var decodedPayload = decoded;
                    var sub = decodedPayload.sub;
                    if (typeof sub !== "string" || sub.length === 0) {
                        resolve({ ok: false, reason: "token payload is missing sub claim" });
                        return;
                    }
                    var rolesClaim = decodedPayload["".concat(auth0Config.audience, "/roles")];
                    var roles = Array.isArray(rolesClaim)
                        ? rolesClaim.filter(function (role) { return typeof role === "string"; })
                        : [];
                    resolve({ ok: true, sub: sub, roles: roles, jwtPayload: decodedPayload });
                });
            })];
    });
}); };
