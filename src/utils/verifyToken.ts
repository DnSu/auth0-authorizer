import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { Auth0Config } from "../Authorizer.interface";

export type VerifyTokenResult =
  | { ok: true; sub: string; roles: string[]; jwtPayload: jwt.JwtPayload }
  | { ok: false; reason: string };

// One extra attempt after the initial call; only for errors that may be
// transient (network failures, rate limiting) — a key genuinely missing
// from the JWKS will not appear on retry.
const JWKS_RETRY_ATTEMPTS = 2;
const JWKS_RETRY_DELAY_MS = 250;

const jwksClients = new Map<string, ReturnType<typeof jwksClient>>();

const normalizeDomain = (domain: string) =>
  domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

const getJwksClient = (domain: string) => {
  const existingClient = jwksClients.get(domain);
  if (existingClient) {
    return existingClient;
  }

  const client = jwksClient({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 10,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    // Fail fast so a hung fetch leaves room for the retry within the
    // authorizer's own timeout (jwks-rsa defaults to 30s, which doesn't).
    timeout: 5000,
  });

  jwksClients.set(domain, client);
  return client;
};

const getSigningKeyWithRetry = (
  jwksC: ReturnType<typeof jwksClient>,
  kid: string,
  attemptsLeft: number,
  callback: (err: Error | null, signingKey?: string) => void,
) => {
  jwksC.getSigningKey(kid, (err, key) => {
    if (err) {
      if (err.name !== "SigningKeyNotFoundError" && attemptsLeft > 1) {
        setTimeout(
          () => getSigningKeyWithRetry(jwksC, kid, attemptsLeft - 1, callback),
          JWKS_RETRY_DELAY_MS,
        );
        return;
      }
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    if (!signingKey) {
      callback(new Error("verifyToken: Missing signing key"));
      return;
    }
    callback(null, signingKey);
  });
};

export const verifyToken = async (
  tokenValue: string,
  auth0Config: Auth0Config,
): Promise<VerifyTokenResult> => {
  const domain = normalizeDomain(auth0Config.domain);
  const jwksC = getJwksClient(domain);

  return new Promise<VerifyTokenResult>((resolve) => {
    const options: jwt.VerifyOptions = {
      audience: auth0Config.audience,
      issuer: `https://${domain}/`,
      algorithms: ["RS256"],
      // Tolerate small clock skew between the token issuer and this Lambda
      // so freshly issued tokens are not rejected.
      clockTolerance: 5,
    };

    const getPublicKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
      if (!header.kid) {
        callback(new Error("verifyToken: Missing kid header"));
        return;
      }

      getSigningKeyWithRetry(jwksC, header.kid, JWKS_RETRY_ATTEMPTS, callback);
    };

    jwt.verify(tokenValue, getPublicKey, options, (verifyError, decoded) => {
      if (verifyError) {
        const expiredAt =
          verifyError instanceof jwt.TokenExpiredError
            ? ` (expiredAt: ${verifyError.expiredAt.toISOString()})`
            : "";
        resolve({
          ok: false,
          reason: `${verifyError.name}: ${verifyError.message}${expiredAt}`,
        });
        return;
      }

      if (!decoded || typeof decoded === "string") {
        resolve({ ok: false, reason: "token decoded to a non-object payload" });
        return;
      }

      const decodedPayload = decoded as jwt.JwtPayload;
      const sub = decodedPayload.sub;
      if (typeof sub !== "string" || sub.length === 0) {
        resolve({ ok: false, reason: "token payload is missing sub claim" });
        return;
      }

      const rolesClaim = decodedPayload[`${auth0Config.audience}/roles`];
      const roles = Array.isArray(rolesClaim)
        ? rolesClaim.filter((role): role is string => typeof role === "string")
        : [];
      resolve({ ok: true, sub, roles, jwtPayload: decodedPayload });
    });
  });
};
