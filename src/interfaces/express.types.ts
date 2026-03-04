/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { User } from "./user.types";
import { type PassauthConfiguration } from "passauth";
import { EmailHandlerOptions } from "passauth/auth/interfaces";

export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

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
    afterLogin: (data: { email: string }) => Promise<any>;
  };
};
