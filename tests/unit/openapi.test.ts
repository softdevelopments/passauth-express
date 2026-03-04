import { describe, expect, test } from "@jest/globals";
import { getOpenApiDocumentation } from "../../src/documentation";

describe("getOpenApiDocumentation", () => {
  test("returns only core routes when email is false", () => {
    const spec = getOpenApiDocumentation({
      url: "https://api.example.com",
      email: false,
    }) as Record<string, any>;

    expect(spec.servers).toEqual([{ url: "https://api.example.com" }]);
    expect(spec.paths["/auth/register"]).toBeDefined();
    expect(spec.paths["/auth/register/send-email"]).toBeUndefined();
    expect(spec.paths["/auth/reset-password"]).toBeUndefined();
  });

  test("returns core and email routes when email is true", () => {
    const spec = getOpenApiDocumentation({
      url: "https://api.example.com",
      email: true,
    }) as Record<string, any>;

    expect(spec.paths["/auth/register"]).toBeDefined();
    expect(spec.paths["/auth/register/send-email"]).toBeDefined();
    expect(spec.paths["/auth/register/confirm-email"]).toBeDefined();
    expect(spec.paths["/auth/reset-password"]).toBeDefined();
  });
});
