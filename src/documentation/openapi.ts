export type OpenApiOptions = {
  url: string;
  email?: boolean;
};

type OpenApiSchema = Record<string, unknown>;

const AUTH_TAG = {
  name: "Auth",
  description: "Authentication",
};

const SCHEMAS = {
  MessageResponse: {
    type: "object",
    required: ["message"],
    properties: {
      message: {
        type: "string",
      },
    },
  },
  Error: {
    oneOf: [
      {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            example: "Something went wrong.",
          },
        },
      },
      {
        type: "object",
        required: ["success", "message", "details"],
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Something went wrong.",
          },
          details: {
            type: "string",
            example: "Details about error",
          },
        },
      },
    ],
  },
  RegisterRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      password: {
        type: "string",
        format: "password",
        minLength: 6,
        maxLength: 100,
      },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      password: {
        type: "string",
        format: "password",
        minLength: 6,
        maxLength: 100,
      },
    },
  },
  LoginResponse: {
    type: "object",
    properties: {
      accessToken: {
        type: "string",
      },
      refreshToken: {
        type: "string",
      },
      user: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
  RefreshTokenRequest: {
    type: "object",
    required: ["accessToken", "refreshToken"],
    properties: {
      accessToken: {
        type: "string",
        minLength: 1,
      },
      refreshToken: {
        type: "string",
        minLength: 1,
      },
    },
  },
  RevokeRefreshTokenRequest: {
    oneOf: [
      {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            minLength: 1,
          },
        },
      },
      {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            minLength: 1,
          },
        },
      },
    ],
  },
  ConfirmEmailRequest: {
    type: "object",
    required: ["email", "token"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      token: {
        type: "string",
        minLength: 1,
      },
    },
  },
  ConfirmResetPasswordRequest: {
    type: "object",
    required: ["email", "token", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
      },
      token: {
        type: "string",
        minLength: 1,
      },
      password: {
        type: "string",
        format: "password",
        minLength: 6,
        maxLength: 100,
      },
    },
  },
} as const;

const CORE_PATHS = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RegisterRequest",
            },
          },
        },
      },
      responses: {
        201: {
          description: "Registration successful",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: {
          description: "Validation or registration error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/LoginRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Authenticated",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginResponse",
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Issue a new access token using a refresh token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RefreshTokenRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "New access token issued",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid payload or invalid token",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/auth/refresh-token/revoke": {
    post: {
      tags: ["Auth"],
      summary: "Revoke a user's refresh token (admin only)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RevokeRefreshTokenRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Refresh token revoked",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid payload or user not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        401: {
          description: "Missing/invalid token",
        },
        403: {
          description: "Insufficient role",
        },
      },
    },
  },
} as const;

const EMAIL_PATHS = {
  "/auth/register/send-email": {
    get: {
      tags: ["Auth"],
      summary: "Send account confirmation email",
      parameters: [
        {
          in: "query",
          name: "email",
          required: true,
          schema: {
            type: "string",
            format: "email",
          },
        },
      ],
      responses: {
        200: {
          description: "Confirmation email sent",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: {
          description: "Failed to send confirmation email",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/auth/register/confirm-email": {
    post: {
      tags: ["Auth"],
      summary: "Confirm email with token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ConfirmEmailRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Email confirmed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        400: {
          description: "Invalid/expired token or invalid payload",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  "/auth/reset-password": {
    get: {
      tags: ["Auth"],
      summary: "Send reset-password email",
      parameters: [
        {
          in: "query",
          name: "email",
          required: true,
          schema: {
            type: "string",
            format: "email",
          },
        },
      ],
      responses: {
        200: {
          description: "Reset password email sent",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
            },
          },
        },
        400: {
          description: "Failed to send reset password email",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Auth"],
      summary: "Confirm password reset",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ConfirmResetPasswordRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Password reset success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        400: {
          description: "Invalid token/payload",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
} as const;

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
