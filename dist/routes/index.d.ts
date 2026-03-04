import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { PassauthExpressConfig } from "../interfaces/express.types.js";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export declare const setupRoutes: (passauth: PassauthHandler<User>, withEmailPlugin: boolean, config: {
    hooks: PassauthExpressConfig["hooks"];
}) => () => import("express-serve-static-core").Router;
