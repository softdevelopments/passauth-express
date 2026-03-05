/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { setupCoreRoutes } from "./core.js";
import { setupEmailRoutes } from "./email.js";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export const setupRoutes = (passauth, withEmailPlugin, config) => () => {
    const router = Router();
    // Register Routes
    setupCoreRoutes(passauth, config, router)();
    if (withEmailPlugin) {
        setupEmailRoutes(passauth, config, router)();
    }
    return router;
};
//# sourceMappingURL=index.js.map