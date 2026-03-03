/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import * as utils from "passauth/auth/utils";
import { Passauth, PassauthHandler } from "passauth";
import { EmailSenderHandler, EmailSenderPlugin } from "@passauth/email-plugin";
import { User } from "./interfaces/user.types";
import { PassauthExpressConfig } from "./interfaces/express.types";
import { setupRoutes } from "./routes";

export type PassauthExpressInstance = {
  setupRoutes: () => Router;
  passauth: EmailSenderHandler<User> | PassauthHandler<User>;
  utils: typeof utils;
};

export const PassauthExpress = (
  config: PassauthExpressConfig
): PassauthExpressInstance => {
  const { config: passauthConfig, emailConfig, hooks } = config;

  let passauthHandler: EmailSenderHandler<User> | PassauthHandler<User>;

  if (emailConfig) {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [EmailSenderPlugin(emailConfig)] as const,
    });
    passauthHandler = passauth.handler as EmailSenderHandler<User>;
  } else {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [],
    });
    passauthHandler = passauth.handler as PassauthHandler<User>;
  }

  return {
    setupRoutes: setupRoutes(passauthHandler, !!emailConfig, {
      hooks,
    }),
    passauth: passauthHandler as
      | EmailSenderHandler<User>
      | PassauthHandler<User>,
    utils,
  };
};
