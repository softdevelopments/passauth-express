export declare const AUTH_TAG: {
    name: string;
    description: string;
};
export declare const SCHEMAS: {
    readonly MessageResponse: {
        readonly type: "object";
        readonly required: readonly ["message"];
        readonly properties: {
            readonly message: {
                readonly type: "string";
            };
        };
    };
    readonly Error: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly required: readonly ["error"];
            readonly properties: {
                readonly error: {
                    readonly type: "string";
                    readonly example: "Something went wrong.";
                };
            };
        }, {
            readonly type: "object";
            readonly required: readonly ["success", "message", "details"];
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly example: false;
                };
                readonly message: {
                    readonly type: "string";
                    readonly example: "Something went wrong.";
                };
                readonly details: {
                    readonly type: "string";
                    readonly example: "Details about error";
                };
            };
        }];
    };
    readonly RegisterRequest: {
        readonly type: "object";
        readonly required: readonly ["email", "password"];
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly format: "email";
            };
            readonly password: {
                readonly type: "string";
                readonly format: "password";
                readonly minLength: 6;
                readonly maxLength: 100;
            };
        };
    };
    readonly LoginRequest: {
        readonly type: "object";
        readonly required: readonly ["email", "password"];
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly format: "email";
            };
            readonly password: {
                readonly type: "string";
                readonly format: "password";
                readonly minLength: 6;
                readonly maxLength: 100;
            };
        };
    };
    readonly LoginResponse: {
        readonly type: "object";
        readonly properties: {
            readonly accessToken: {
                readonly type: "string";
            };
            readonly refreshToken: {
                readonly type: "string";
            };
            readonly user: {
                readonly type: "object";
                readonly additionalProperties: true;
            };
        };
    };
    readonly RefreshTokenRequest: {
        readonly type: "object";
        readonly required: readonly ["accessToken", "refreshToken"];
        readonly properties: {
            readonly accessToken: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly refreshToken: {
                readonly type: "string";
                readonly minLength: 1;
            };
        };
    };
    readonly RevokeRefreshTokenRequest: {
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly required: readonly ["email"];
            readonly properties: {
                readonly email: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
            };
        }, {
            readonly type: "object";
            readonly required: readonly ["id"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
            };
        }];
    };
    readonly ConfirmEmailRequest: {
        readonly type: "object";
        readonly required: readonly ["email", "token"];
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly format: "email";
            };
            readonly token: {
                readonly type: "string";
                readonly minLength: 1;
            };
        };
    };
    readonly ConfirmResetPasswordRequest: {
        readonly type: "object";
        readonly required: readonly ["email", "token", "password"];
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly format: "email";
            };
            readonly token: {
                readonly type: "string";
                readonly minLength: 1;
            };
            readonly password: {
                readonly type: "string";
                readonly format: "password";
                readonly minLength: 6;
                readonly maxLength: 100;
            };
        };
    };
};
export declare const CORE_PATHS: {
    readonly "/auth/register": {
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Register a new user";
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/RegisterRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 201: {
                    readonly description: "Registration successful";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/MessageResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Validation or registration error";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/Error";
                            };
                        };
                    };
                };
            };
        };
    };
    readonly "/auth/login": {
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Login with email and password";
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/LoginRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 200: {
                    readonly description: "Authenticated";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/LoginResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Validation error";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/Error";
                            };
                        };
                    };
                };
            };
        };
    };
    readonly "/auth/refresh-token": {
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Issue a new access token using a refresh token";
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/RefreshTokenRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 200: {
                    readonly description: "New access token issued";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/LoginResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Invalid payload or invalid token";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/Error";
                            };
                        };
                    };
                };
            };
        };
    };
    readonly "/auth/refresh-token/revoke": {
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Revoke a user's refresh token (admin only)";
            readonly security: readonly [{
                readonly bearerAuth: readonly [];
            }];
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/RevokeRefreshTokenRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 200: {
                    readonly description: "Refresh token revoked";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/MessageResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Invalid payload or user not found";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/Error";
                            };
                        };
                    };
                };
                readonly 401: {
                    readonly description: "Missing/invalid token";
                };
                readonly 403: {
                    readonly description: "Insufficient role";
                };
            };
        };
    };
};
