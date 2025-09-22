import { UserPluginEmailSender } from "@passauth/email-plugin";

export type UserRole = "user" | "admin";

export type User = UserPluginEmailSender & {
  role: UserRole;
};
