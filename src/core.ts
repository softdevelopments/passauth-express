/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import * as utils from "passauth/auth/utils";
import { Passauth, PassauthHandler } from "passauth";
import { User } from "./interfaces/user.types";
import { PassauthExpressConfig } from "./interfaces/express.types";
import { setupRoutes } from "./routes";
import { EmailHandlerOptions } from "passauth/auth/interfaces";

export type PassauthExpressInstance = {
  setupRoutes: () => Router;
  passauth: PassauthHandler<User>;
  utils: typeof utils;
};

export const PassauthExpress = (
  config: PassauthExpressConfig
): PassauthExpressInstance => {
  const { config: passauthConfig, emailConfig, hooks } = config;

  let passauthHandler: PassauthHandler<User>;

  if (emailConfig) {
    const passauth = Passauth({
      ...passauthConfig,
      email: emailConfig as EmailHandlerOptions
    });
    passauthHandler = passauth.handler as PassauthHandler<User>;
  } else {
    const passauth = Passauth(passauthConfig);
    passauthHandler = passauth.handler as PassauthHandler<User>;
  }

  return {
    setupRoutes: setupRoutes(passauthHandler, !!emailConfig, {
      hooks,
    }),
    passauth: passauthHandler as PassauthHandler<User>,
    utils,
  };
};
