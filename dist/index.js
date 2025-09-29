import { Router } from "express";
import { Passauth, PassauthInvalidUserException, } from "passauth";
import { EmailSenderPlugin, } from "@passauth/email-plugin";
import { ConfirmResetPasswordValidator, LoginValidator, RefreshTokenValidator, ResetPasswordValidator, RevokeRefreshTokenValidator, } from "./validator/login.validator.js";
import { errorHandler } from "./utils/error-handler.js";
import { ConfirmEmailValidator, RegisterValidator, SendEmailConfirmationValidator, } from "./validator/register.validator.js";
import { RoleGuard } from "./middlewares/admin-guard.js";
export { RoleGuard, AuthMiddleware } from "./middlewares/admin-guard.js";
const setupRoutes = (passauth, withEmailPlugin) => () => {
    const router = Router();
    // Register Routes
    router.post("/register", async (req, res) => {
        try {
            const data = RegisterValidator.parse(req.body);
            await passauth.register(data);
            res.status(201).json({ message: "Registration successful" });
        }
        catch (error) {
            errorHandler(error, res, "Failed to register user");
        }
    });
    if (withEmailPlugin) {
        router.get("/register/send-email", async (req, res) => {
            try {
                const data = SendEmailConfirmationValidator.parse(req.query);
                await passauth.sendConfirmPasswordEmail(data.email);
                res.status(200).json({ message: "Confirmation email sent" });
            }
            catch (error) {
                errorHandler(error, res, "Failed to send email confirmation");
            }
        });
        router.post("/register/confirm-email", async (req, res) => {
            try {
                const data = ConfirmEmailValidator.parse(req.body);
                const result = await passauth.confirmEmail(data.email, data.token);
                res.json(result);
            }
            catch (error) {
                errorHandler(error, res, "Failed to confirm email");
            }
        });
    }
    // Login Routes
    router.post("/login", async (req, res) => {
        try {
            const data = LoginValidator.parse(req.body);
            const result = await passauth.login(data, ["roles"]);
            res.json(result);
        }
        catch (error) {
            errorHandler(error, res, "Failed to login");
        }
    });
    router.post("/refresh-token", async (req, res) => {
        try {
            const { accessToken, refreshToken } = RefreshTokenValidator.parse(req.body);
            const result = await passauth.refreshToken(accessToken, refreshToken);
            res.json(result);
        }
        catch (error) {
            errorHandler(error, res, "Failed to refresh access token");
        }
    });
    router.post("/refresh-token/revoke", RoleGuard(passauth, ["admin"]), async (req, res) => {
        try {
            const data = RevokeRefreshTokenValidator.parse(req.body);
            const user = await passauth.repo.getUser(data);
            if (!user) {
                const logData = "email" in data ? `email: ${data.email}` : `id: ${data.id}`;
                throw new PassauthInvalidUserException(logData);
            }
            passauth.revokeRefreshToken(user.id);
            res.json({ message: "Refresh token revoked" });
        }
        catch (error) {
            errorHandler(error, res, "Failed to revoke refresh token");
        }
    });
    // Reset Password Routes
    if (withEmailPlugin) {
        router.get("/reset-password", async (req, res) => {
            try {
                const { email } = ResetPasswordValidator.parse(req.query);
                const { success, error } = await passauth.sendResetPasswordEmail(email);
                if (error) {
                    console.error(`Failed to reset password for ${email}:`, error);
                }
                if (!success) {
                    return res.status(400).json({
                        error: "Failed to send reset password email",
                    });
                }
                res.status(200).json({ message: "Reset password email sent" });
            }
            catch (error) {
                errorHandler(error, res, "Failed to send reset password email");
            }
        });
        router.post("/reset-password", async (req, res) => {
            try {
                const data = ConfirmResetPasswordValidator.parse(req.body);
                const result = await passauth.confirmResetPassword(data.email, data.token, data.password);
                res.json(result);
            }
            catch (error) {
                errorHandler(error, res, "Failed to reset password");
            }
        });
    }
    return router;
};
export const PassauthExpress = (config) => {
    const { config: passauthConfig, emailConfig } = config;
    let passauthHandler;
    if (emailConfig) {
        const passauth = Passauth({
            ...passauthConfig,
            plugins: [EmailSenderPlugin(emailConfig)],
        });
        passauthHandler = passauth.handler;
    }
    else {
        const passauth = Passauth({
            ...passauthConfig,
            plugins: [],
        });
        passauthHandler = passauth.handler;
    }
    return {
        setupRoutes: setupRoutes(passauthHandler, !!emailConfig),
        passauth: passauthHandler,
    };
};
//# sourceMappingURL=index.js.map