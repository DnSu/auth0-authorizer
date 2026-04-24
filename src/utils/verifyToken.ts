import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { Auth0Config } from "../Authorizer.interface";

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
  });

  jwksClients.set(domain, client);
  return client;
};

export const verifyToken = async (
  tokenValue: string,
  auth0Config: Auth0Config,
) => {
  const domain = normalizeDomain(auth0Config.domain);
  const jwksC = getJwksClient(domain);

  return new Promise<false | { sub: string; roles: string[] }>((resolve) => {
    const options: jwt.VerifyOptions = {
      audience: auth0Config.audience,
      issuer: `https://${domain}/`,
      algorithms: ["RS256"],
    };

    const getPublicKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
      if (!header.kid) {
        callback(new Error("verifyToken: Missing kid header"));
        return;
      }

      jwksC.getSigningKey(header.kid, (err, key) => {
        if (err) {
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

    jwt.verify(tokenValue, getPublicKey, options, (verifyError, decoded) => {
      if (verifyError) {
        resolve(false);
        return;
      }

      if (!decoded || typeof decoded === "string") {
        resolve(false);
        return;
      }

      const decodedPayload = decoded as jwt.JwtPayload;
      const sub = decodedPayload.sub;
      if (typeof sub !== "string" || sub.length === 0) {
        resolve(false);
        return;
      }

      const rolesClaim = decodedPayload[`${auth0Config.audience}/roles`];
      const roles = Array.isArray(rolesClaim)
        ? rolesClaim.filter((role): role is string => typeof role === "string")
        : [];
      resolve({ sub, roles });
    });
  });
};
