export declare const EMAIL_PATHS: {
    readonly "/auth/register/send-email": {
        readonly get: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Send account confirmation email";
            readonly parameters: readonly [{
                readonly in: "query";
                readonly name: "email";
                readonly required: true;
                readonly schema: {
                    readonly type: "string";
                    readonly format: "email";
                };
            }];
            readonly responses: {
                readonly 200: {
                    readonly description: "Confirmation email sent";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/MessageResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Failed to send confirmation email";
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
    readonly "/auth/register/confirm-email": {
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Confirm email with token";
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/ConfirmEmailRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 200: {
                    readonly description: "Email confirmed";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Invalid/expired token or invalid payload";
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
    readonly "/auth/reset-password": {
        readonly get: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Send reset-password email";
            readonly parameters: readonly [{
                readonly in: "query";
                readonly name: "email";
                readonly required: true;
                readonly schema: {
                    readonly type: "string";
                    readonly format: "email";
                };
            }];
            readonly responses: {
                readonly 200: {
                    readonly description: "Reset password email sent";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/MessageResponse";
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Failed to send reset password email";
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
        readonly post: {
            readonly tags: readonly ["Auth"];
            readonly summary: "Confirm password reset";
            readonly requestBody: {
                readonly required: true;
                readonly content: {
                    readonly "application/json": {
                        readonly schema: {
                            readonly $ref: "#/components/schemas/ConfirmResetPasswordRequest";
                        };
                    };
                };
            };
            readonly responses: {
                readonly 200: {
                    readonly description: "Password reset success";
                    readonly content: {
                        readonly "application/json": {
                            readonly schema: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly 400: {
                    readonly description: "Invalid token/payload";
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
};
