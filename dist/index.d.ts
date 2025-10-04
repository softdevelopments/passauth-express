import { PassauthHandler, type PassauthConfiguration } from "passauth";
import { EmailPluginOptions, EmailSenderHandler, EmailSenderPlugin, UserPluginEmailSender } from "@passauth/email-plugin";
import { User } from "./interfaces/user.types.js";
export { RoleGuard, AuthMiddleware } from "./middlewares/admin-guard.js";
export type PassauthExpressConfig = {
    config: PassauthConfiguration<UserPluginEmailSender, [
        ReturnType<typeof EmailSenderPlugin>
    ]>;
    emailConfig?: EmailPluginOptions;
};
export declare const PassauthExpress: (config: PassauthExpressConfig) => {
    setupRoutes: () => import("express-serve-static-core").Router;
    passauth: EmailSenderHandler<User> | PassauthHandler<User>;
};
export type { User };
