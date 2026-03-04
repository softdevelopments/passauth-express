export const AUTH_TAG = {
  name: "Auth",
  description: "Authentication",
};

export const SCHEMAS = {
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

export const CORE_PATHS = {
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
