/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { User } from "./user.types";
import { type PassauthConfiguration } from "passauth";
import {
  EmailPluginOptions,
  EmailSenderPlugin,
  UserPluginEmailSender,
} from "@passauth/email-plugin";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

export type SessionData = {
  user: Pick<User, "id" | "roles">;
};

export interface AuthenticatedRequest extends Request {
  sessionData?: SessionData;
}

export type PassauthExpressConfig = {
  config: PassauthConfiguration<
    UserPluginEmailSender,
    [ReturnType<typeof EmailSenderPlugin>]
  >;
  emailConfig?: EmailPluginOptions;
  hooks?: {
    afterLogin: (data: { email: string }) => Promise<any>;
  };
};
