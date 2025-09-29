import { Request, Response, NextFunction } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { EmailSenderHandler } from "@passauth/email-plugin";
export declare const RoleGuard: (handler: PassauthHandler<User>, roles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const AuthMiddleware: (handler: EmailSenderHandler<User> | PassauthHandler<User>) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
