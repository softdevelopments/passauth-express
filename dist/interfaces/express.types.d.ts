import { Request } from "express";
import { User } from "./user.types.js";
import { type PassauthConfiguration } from "passauth";
import { EmailHandlerOptions, LoginParams } from "passauth/auth/interfaces";
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
        afterLogin?: (data: LoginParams<unknown>) => Promise<any>;
        beforeHandler?: {
            register?: (req: Request) => Promise<any> | any;
            login?: (req: Request) => Promise<any> | any;
            refreshToken?: (req: Request) => Promise<any> | any;
            revokeRefreshToken?: (req: Request) => Promise<any> | any;
            registerSendEmail?: (req: Request) => Promise<any> | any;
            registerConfirmEmail?: (req: Request) => Promise<any> | any;
            resetPassword?: (req: Request) => Promise<any> | any;
            resetPasswordConfirm?: (req: Request) => Promise<any> | any;
        };
        afterHandler?: {
            register?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            login?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            refreshToken?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            revokeRefreshToken?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            registerSendEmail?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            registerConfirmEmail?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            resetPassword?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
            resetPasswordConfirm?: (params: {
                req: Request;
                data: any;
                result: any;
            }) => Promise<any> | any;
        };
    };
};
