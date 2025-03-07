// import { auth0Config } from "../../Config/auth0";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { AuthOConfig } from "../Authorizer.interface";

export const verifyToken = async (
  tokenValue: string,
  auth0Config: AuthOConfig,
) => {
  const verifyResult = await new Promise<
    false | { sub: string; roles: string }
  >((resolve) => {
    try {
      const options: jwt.VerifyOptions = {
        audience: auth0Config.audience,
        issuer: `https://${auth0Config.domain}/`,
      };
      const getPublicKey: jwt.GetPublicKeyOrSecret = (header, callback2) => {
        const jwksC = jwksClient({
          jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
          cache: true,
        });
        // console.log(header);
        jwksC.getSigningKey(header.kid, (err, key) => {
          // console.log(key);
          const signingKey = key?.getPublicKey();
          // console.log(signingKey);
          callback2(null, signingKey);
        });
      };

      jwt.verify(tokenValue, getPublicKey, options, (verifyError, decoded) => {
        if (verifyError) {
          console.log("verifyToken: ", verifyError);
          resolve(false);
        }
        if (decoded) {
          decoded = decoded as jwt.JwtPayload;
          const roles = decoded[`${auth0Config.audience}/roles`] as string[] || [];
          const rolesString = roles.join("|");
          // console.log("verifyToken: decoded: ", decoded);
          const decodedPayload = decoded as jwt.JwtPayload;
          resolve({ sub: decodedPayload.sub as string, roles: rolesString });
        }
      });
    } catch (err) {
      console.log("verifyToken: Invalid token", err);
      resolve(false);
    }
  });
  // console.log("verifyToken: ", verifyResult);
  return verifyResult;
};
