import { UserEmailSenderPlugin } from "@passauth/email-plugin";

export type UserRole = "user" | "admin";

export type User = UserEmailSenderPlugin & {
  role: UserRole;
};
