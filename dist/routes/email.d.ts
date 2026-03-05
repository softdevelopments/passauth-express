import { Router } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { PassauthExpressConfig } from "../interfaces/express.types.js";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export declare const setupEmailRoutes: (passauth: PassauthHandler<User>, config: {
    hooks: PassauthExpressConfig["hooks"];
}, router: Router) => () => Router;
