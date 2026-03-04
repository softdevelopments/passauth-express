import { Router } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export declare const setupEmailRoutes: (passauth: PassauthHandler<User>, router: Router) => () => Router;
