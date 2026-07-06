import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import auth0Authorizer from "../src/Authorizer";
import { Auth0Config } from "../src/Authorizer.interface";
import { TEST_AUDIENCE, TEST_DOMAIN, publicKeyPem, signToken } from "./helpers";

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

const config: Auth0Config = { domain: TEST_DOMAIN, audience: TEST_AUDIENCE };
const ROUTE_ARN =
  "arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/GET/groups";
const STAGE_WILDCARD_ARN =
  "arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/*";

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getSigningKey.mockImplementation((_kid, cb) =>
    cb(null, { getPublicKey: () => publicKeyPem }),
  );
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  getSigningKey.mockReset();
  warnSpy.mockRestore();
});

describe("auth0Authorizer", () => {
  it("throws on missing domain", async () => {
    await expect(
      auth0Authorizer({ domain: "", audience: TEST_AUDIENCE }, {}),
    ).rejects.toThrow("auth0Config.domain");
  });

  it("throws on missing audience", async () => {
    await expect(
      auth0Authorizer({ domain: TEST_DOMAIN, audience: "" }, {}),
    ).rejects.toThrow("auth0Config.audience");
  });

  it("throws on missing config object", async () => {
    await expect(
      auth0Authorizer(undefined as unknown as Auth0Config, {}),
    ).rejects.toThrow("auth0Config.domain");
  });

  it("returns an Allow policy scoped to the stage wildcard for a valid token", async () => {
    const token = signToken(
      { sub: "auth0|user-1", [`${TEST_AUDIENCE}/roles`]: ["admin"] },
      { expiresIn: "1h" },
    );

    const result = await auth0Authorizer(config, {
      routeArn: ROUTE_ARN,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(result.principalId).toBe("auth0|user-1");
    expect(result.policyDocument.Statement).toEqual([
      {
        Action: "execute-api:Invoke",
        Effect: "Allow",
        Resource: STAGE_WILDCARD_ARN,
      },
    ]);
    expect(result.context).toMatchObject({
      principalId: "auth0|user-1",
      roles: ["admin"],
    });
    expect(JSON.parse(result.context!.authUser)).toMatchObject({
      sub: "auth0|user-1",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("accepts a REST API methodArn as the resource", async () => {
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: "1h" });

    const result = await auth0Authorizer(config, {
      methodArn: ROUTE_ARN,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(result.policyDocument.Statement[0]).toMatchObject({
      Effect: "Allow",
      Resource: STAGE_WILDCARD_ARN,
    });
  });

  it("denies with the reason logged when the token is missing", async () => {
    const result = await auth0Authorizer(config, { routeArn: ROUTE_ARN });

    expect(result.principalId).toBe("unauthorized");
    expect(result.policyDocument.Statement[0]).toMatchObject({
      Effect: "Deny",
      Resource: STAGE_WILDCARD_ARN,
    });
    expect(result.context).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing or malformed Authorization"),
    );
  });

  it("denies an expired token and logs the verification error", async () => {
    const token = signToken({ sub: "auth0|user-1" }, { expiresIn: -60 });

    const result = await auth0Authorizer(config, {
      routeArn: ROUTE_ARN,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(result.policyDocument.Statement[0]).toMatchObject({
      Effect: "Deny",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("TokenExpiredError"),
    );
  });

  it("denies with a wildcard resource when the event has no ARN", async () => {
    const result = await auth0Authorizer(config, {});

    expect(result.policyDocument.Statement[0]).toMatchObject({
      Effect: "Deny",
      Resource: "*",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no methodArn/routeArn"),
    );
  });
});
