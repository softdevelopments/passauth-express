export const EMAIL_PATHS = {
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
};
//# sourceMappingURL=email.js.map