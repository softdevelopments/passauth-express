import { Response, NextFunction } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { EmailSenderHandler } from "@passauth/email-plugin";
import { AuthenticatedRequest } from "../interfaces/express.types.js";
export declare const RoleGuard: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const AuthMiddleware: (handler: EmailSenderHandler<User> | PassauthHandler<User>) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
