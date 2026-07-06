import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { verifyToken } from "../src/utils/verifyToken";
import {
  TEST_AUDIENCE,
  TEST_DOMAIN,
  privateKeyPem,
  publicKeyPem,
  signToken,
} from "./helpers";

type SigningKeyCallback = (
  err: Error | null,
  key?: { getPublicKey: () => string },
) => void;

const { getSigningKey } = vi.hoisted(() => ({
  getSigningKey: vi.fn<(kid: string, cb: SigningKeyCallback) => void>(),
}));

vi.mock("jwks-rsa", () => ({
  default: () => ({ getSigningKey }),
}));

const config = { domain: TEST_DOMAIN, audience: TEST_AUDIENCE };

const serveSigningKey = () => {
  getSigningKey.mockImplementation((_kid, cb) =>
    cb(null, { getPublicKey: () => publicKeyPem }),
  );
};

beforeEach(() => {
  getSigningKey.mockReset();
});

describe("verifyToken", () => {
  it("accepts a valid token and extracts sub and string roles", async () => {
    serveSigningKey();
    const token = signToken(
      { sub: "auth0|user-1", [`${TEST_AUDIENCE}/roles`]: ["admin", 42, "ops"] },
      { expiresIn: "1h" },
    );

    const result = await verifyToken(token, config);

    expect(result).toMatchObject({
      ok: true,
      sub: "auth0|user-1",
      roles: ["admin", "ops"],
    });
    if (result.ok) {
      expect(result.jwtPayload.sub).toBe("auth0|user-1");
    }
  });

  it("rejects an expired token with the expiry in the reason", async () => {
    serveSigningKey();
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: -10 });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("TokenExpiredError");
      expect(result.reason).toContain("expiredAt");
    }
  });

  it("tolerates small clock skew on exp", async () => {
    serveSigningKey();
    const token = signToken({
      sub: "auth0|user-1",
      exp: Math.floor(Date.now() / 1000) - 3,
    });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(true);
  });

  it("rejects a token for a different audience", async () => {
    serveSigningKey();
    const token = signToken(
      { sub: "auth0|user-1" },
      { audience: "https://other-api", expiresIn: "1h" },
    );

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("audience");
    }
  });

  it("rejects a token without a sub claim", async () => {
    serveSigningKey();
    const token = signToken({}, { expiresIn: "1h" });

    const result = await verifyToken(token, config);

    expect(result).toEqual({
      ok: false,
      reason: "token payload is missing sub claim",
    });
  });

  it("rejects a token without a kid header", async () => {
    serveSigningKey();
    const token = jwt.sign({ sub: "auth0|user-1" }, privateKeyPem, {
      algorithm: "RS256",
      audience: TEST_AUDIENCE,
      issuer: `https://${TEST_DOMAIN}/`,
      expiresIn: "1h",
    });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Missing kid header");
    }
    expect(getSigningKey).not.toHaveBeenCalled();
  });

  it("retries a transient JWKS failure once and succeeds", async () => {
    getSigningKey
      .mockImplementationOnce((_kid, cb) => cb(new Error("socket hang up")))
      .mockImplementation((_kid, cb) =>
        cb(null, { getPublicKey: () => publicKeyPem }),
      );
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: "1h" });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(true);
    expect(getSigningKey).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the signing key is not found", async () => {
    getSigningKey.mockImplementation((_kid, cb) => {
      const err = new Error("Unable to find a signing key");
      err.name = "SigningKeyNotFoundError";
      cb(err);
    });
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: "1h" });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Unable to find a signing key");
    }
    expect(getSigningKey).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting retries on persistent transient failures", async () => {
    getSigningKey.mockImplementation((_kid, cb) =>
      cb(new Error("socket hang up")),
    );
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: "1h" });

    const result = await verifyToken(token, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("socket hang up");
    }
    expect(getSigningKey).toHaveBeenCalledTimes(2);
  });
});
