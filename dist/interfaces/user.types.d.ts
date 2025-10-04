import { UserPluginEmailSender } from "@passauth/email-plugin";
export type User = UserPluginEmailSender & {
  roles: string[];
};
