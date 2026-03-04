/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types";
import { PassauthExpressConfig } from "../interfaces/express.types";
import { setupCoreRoutes } from "./core";
import { setupEmailRoutes } from "./email";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

export const setupRoutes =
  (
    passauth: PassauthHandler<User>,
    withEmailPlugin: boolean,
    config: {
      hooks: PassauthExpressConfig["hooks"];
    },
  ) =>
  () => {
    const router = Router();

    // Register Routes
    setupCoreRoutes(passauth, config, router)();

    if (withEmailPlugin) {
      setupEmailRoutes(passauth, router)();
    }

    return router;
  };
