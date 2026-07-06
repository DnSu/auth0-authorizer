import { describe, expect, it } from "vitest";
import wildcardResource from "../src/utils/wildcardResource";
import getTokenFromEvent from "../src/utils/getTokenFromEvent";
import generatePolicy from "../src/utils/generatePolicy";
import getAuthInfo from "../src/utils/getAuthInfo";

describe("wildcardResource", () => {
  it("replaces method and path with a stage wildcard", () => {
    expect(
      wildcardResource(
        "arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/GET/groups/42",
      ),
    ).toBe("arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/*");
  });

  it("returns the input unchanged when there is no stage segment", () => {
    expect(wildcardResource("")).toBe("");
    expect(wildcardResource("no-slashes")).toBe("no-slashes");
  });

  it("wildcards an arn that only has a stage", () => {
    expect(wildcardResource("api-id/dev")).toBe("api-id/dev/*");
  });
});

describe("getTokenFromEvent", () => {
  it("reads the lowercase authorization header", () => {
    expect(
      getTokenFromEvent({ headers: { authorization: "Bearer abc" } }),
    ).toBe("abc");
  });

  it("reads the capitalized Authorization header", () => {
    expect(
      getTokenFromEvent({ headers: { Authorization: "Bearer abc" } }),
    ).toBe("abc");
  });

  it("reads authorizationToken for TOKEN authorizers", () => {
    expect(getTokenFromEvent({ authorizationToken: "Bearer abc" })).toBe("abc");
  });

  it("accepts any casing of the bearer scheme and extra whitespace", () => {
    expect(
      getTokenFromEvent({ headers: { authorization: "bearer   abc" } }),
    ).toBe("abc");
  });

  it("throws when the header is missing", () => {
    expect(() => getTokenFromEvent({})).toThrow("Unauthorized");
    expect(() => getTokenFromEvent({ headers: {} })).toThrow("Unauthorized");
  });

  it("throws on a non-bearer scheme", () => {
    expect(() =>
      getTokenFromEvent({ headers: { authorization: "Basic abc" } }),
    ).toThrow("Unauthorized");
  });

  it("throws on a malformed bearer value", () => {
    expect(() =>
      getTokenFromEvent({ headers: { authorization: "Bearer" } }),
    ).toThrow("Unauthorized");
    expect(() =>
      getTokenFromEvent({ headers: { authorization: "Bearer a b" } }),
    ).toThrow("Unauthorized");
  });
});

describe("generatePolicy", () => {
  it("builds an Allow policy and injects principalId into context", () => {
    const policy = generatePolicy("user-1", "Allow", "arn/x/*", {
      roles: ["admin"],
      authUser: "{}",
    });

    expect(policy).toEqual({
      principalId: "user-1",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "arn/x/*",
          },
        ],
      },
      context: { principalId: "user-1", roles: ["admin"], authUser: "{}" },
    });
  });

  it("omits context when none is given", () => {
    const policy = generatePolicy("unauthorized", "Deny", "arn/x/*");

    expect(policy.policyDocument.Statement[0]).toMatchObject({
      Effect: "Deny",
    });
    expect(policy).not.toHaveProperty("context");
  });
});

describe("getAuthInfo", () => {
  const authUser = JSON.stringify({ sub: "auth0|user-1", exp: 123 });

  it("reads HTTP API v2 lambda authorizer context", () => {
    const info = getAuthInfo({
      requestContext: {
        authorizer: {
          lambda: {
            principalId: "auth0|user-1",
            roles: ["admin"],
            authUser,
          },
        },
      },
    });

    expect(info).toEqual({
      principalId: "auth0|user-1",
      roles: ["admin"],
      authUser: { sub: "auth0|user-1", exp: 123 },
    });
  });

  it("reads REST API v1 context with stringified roles", () => {
    const info = getAuthInfo({
      requestContext: {
        authorizer: {
          principalId: "auth0|user-1",
          roles: '["admin","ops"]',
          authUser,
        },
      },
    });

    expect(info.roles).toEqual(["admin", "ops"]);
  });

  it("parses pipe-separated roles strings", () => {
    const info = getAuthInfo({
      requestContext: {
        authorizer: {
          principalId: "auth0|user-1",
          roles: "admin | ops",
          authUser,
        },
      },
    });

    expect(info.roles).toEqual(["admin", "ops"]);
  });

  it("throws when the authorizer context is missing", () => {
    expect(() => getAuthInfo({})).toThrow("no auth info");
  });

  it("throws when principalId is missing", () => {
    expect(() =>
      getAuthInfo({
        requestContext: { authorizer: { roles: [], authUser } },
      }),
    ).toThrow("principalId");
  });

  it("throws when authUser is not valid JSON", () => {
    expect(() =>
      getAuthInfo({
        requestContext: {
          authorizer: {
            principalId: "auth0|user-1",
            roles: [],
            authUser: "not-json",
          },
        },
      }),
    ).toThrow("not valid JSON");
  });
});
