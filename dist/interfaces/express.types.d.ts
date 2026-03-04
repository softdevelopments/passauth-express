import { Request } from "express";
import { User } from "./user.types.js";
import { type PassauthConfiguration } from "passauth";
import { EmailHandlerOptions } from "passauth/auth/interfaces";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard.js";
export type SessionData = {
    user: Pick<User, "id" | "roles">;
};
export interface AuthenticatedRequest extends Request {
    sessionData?: SessionData;
}
export type PassauthExpressConfig = {
    config: PassauthConfiguration<User, []>;
    emailConfig?: EmailHandlerOptions;
    hooks?: {
        afterLogin: (data: {
            email: string;
        }) => Promise<any>;
    };
};
