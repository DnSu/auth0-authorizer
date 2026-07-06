import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

export const TEST_DOMAIN = "test.auth0.local";
export const TEST_AUDIENCE = "https://my-api";
export const TEST_KID = "test-kid";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

export const publicKeyPem = publicKey
  .export({ type: "spki", format: "pem" })
  .toString();

export const privateKeyPem = privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString();

export function signToken(
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
): string {
  return jwt.sign(payload, privateKeyPem, {
    algorithm: "RS256",
    keyid: TEST_KID,
    audience: TEST_AUDIENCE,
    issuer: `https://${TEST_DOMAIN}/`,
    ...options,
  });
}
