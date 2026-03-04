import { PassauthInvalidUserException } from "passauth";
import { LoginValidator, RefreshTokenValidator, RevokeRefreshTokenValidator, } from "../validator/login.validator.js";
import { errorHandler } from "../utils/error-handler.js";
import { RegisterValidator } from "../validator/register.validator.js";
import { AuthMiddleware, RoleGuard } from "../middlewares/index.js";
import { logger } from "../utils/console.js";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export const setupCoreRoutes = (passauth, config, router) => () => {
    // Register Routes
    router.post("/register", async (req, res) => {
        try {
            const data = RegisterValidator.parse(req.body);
            await passauth.register(data);
            res.status(201).json({ message: "Registration successful" });
        }
        catch (error) {
            logger.error(error);
            errorHandler(error, res, "Failed to register user");
        }
    });
    // Login Routes
    router.post("/login", async (req, res) => {
        try {
            const data = LoginValidator.parse(req.body);
            const result = await passauth.login(data, ["roles"]);
            const additionalData = config?.hooks?.afterLogin
                ? await config.hooks.afterLogin({ email: data.email })
                : {};
            res.json({ ...result, ...additionalData });
        }
        catch (error) {
            logger.error(error);
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
            logger.error(error);
            errorHandler(error, res, "Failed to refresh access token");
        }
    });
    router.post("/refresh-token/revoke", AuthMiddleware(passauth), RoleGuard(["admin"]), async (req, res) => {
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
            logger.error(error);
            errorHandler(error, res, "Failed to revoke refresh token");
        }
    });
    return router;
};
//# sourceMappingURL=core.js.map