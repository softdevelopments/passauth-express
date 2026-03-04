import { AUTH_TAG, CORE_PATHS, SCHEMAS } from "./core";
import { EMAIL_PATHS } from "./email";

export type OpenApiOptions = {
  url: string;
  email?: boolean;
};

type OpenApiSchema = Record<string, unknown>;

export const getOpenApiDocumentation = ({
  url,
  email = false,
}: OpenApiOptions): OpenApiSchema => ({
  openapi: "3.1.0",
  info: {
    title: "PassAuth Express API",
    version: "1.1.1",
    summary: "Authentication API for Express using Passauth",
    description:
      "OpenAPI specification for @passauth/express routes, including email flows when enabled.",
  },
  servers: [
    {
      url,
    },
  ],
  tags: [AUTH_TAG],
  paths: {
    ...CORE_PATHS,
    ...(email ? EMAIL_PATHS : {}),
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: SCHEMAS,
  },
});
