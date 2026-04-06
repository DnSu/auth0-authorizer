// import { auth0Config } from "../../Config/auth0";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { AuthOConfig } from "../Authorizer.interface";

const jwksClients = new Map<string, ReturnType<typeof jwksClient>>();

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
  auth0Config: AuthOConfig,
) => {
  const domain = auth0Config.domain;
  const jwksC = getJwksClient(domain);

  const verifyResult = await new Promise<
    false | { sub: string; roles: string[] }
  >((resolve) => {
    try {
      const options: jwt.VerifyOptions = {
        audience: auth0Config.audience,
        issuer: `https://${domain}/`,
        algorithms: ["RS256"],
      };

      const getPublicKey: jwt.GetPublicKeyOrSecret = (header, callback2) => {
        jwksC.getSigningKey(header.kid, (err, key) => {
          if (err) {
            callback2(err);
            return;
          }
          const signingKey = key?.getPublicKey();
          if (!signingKey) {
            callback2(new Error("verifyToken: Missing signing key"));
            return;
          }
          callback2(null, signingKey);
        });
      };

      jwt.verify(tokenValue, getPublicKey, options, (verifyError, decoded) => {
        if (verifyError) {
          console.log("verifyToken: ", verifyError);
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
          ? rolesClaim.filter(
              (role): role is string => typeof role === "string",
            )
          : [];
        resolve({ sub, roles });
      });
    } catch (err) {
      console.log("verifyToken: Invalid token", err);
      resolve(false);
    }
  });
  // console.log("verifyToken: ", verifyResult);
  return verifyResult;
};
