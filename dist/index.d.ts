import { Router } from "express";
import { PassauthHandler, type PassauthConfiguration } from "passauth";
import { EmailPluginOptions, EmailSenderHandler, EmailSenderPlugin, UserPluginEmailSender } from "@passauth/email-plugin";
import { User } from "./interfaces/user.types.js";
export { RoleGuard, AuthMiddleware } from "./middlewares/admin-guard.js";
import * as utils from "passauth/auth/utils";
export type PassauthExpressConfig = {
    config: PassauthConfiguration<UserPluginEmailSender, [
        ReturnType<typeof EmailSenderPlugin>
    ]>;
    emailConfig?: EmailPluginOptions;
    hooks?: {
        afterLogin: (data: {
            email: string;
        }) => Promise<any>;
    };
};
export type PassauthExpressInstance = {
    setupRoutes: () => Router;
    passauth: EmailSenderHandler<User> | PassauthHandler<User>;
    utils: typeof utils;
};
export declare const PassauthExpress: (config: PassauthExpressConfig) => PassauthExpressInstance;
export type { User };
