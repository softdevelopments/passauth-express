import { Router } from "express";
import * as utils from "passauth/auth/utils";
import { PassauthHandler } from "passauth";
import { User } from "./interfaces/user.types.js";
import { PassauthExpressConfig } from "./interfaces/express.types.js";
export type PassauthExpressInstance = {
    setupRoutes: () => Router;
    passauth: PassauthHandler<User>;
    utils: typeof utils;
};
export declare const PassauthExpress: (config: PassauthExpressConfig) => PassauthExpressInstance;
