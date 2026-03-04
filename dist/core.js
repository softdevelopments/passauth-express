import * as utils from "passauth/auth/utils";
import { Passauth } from "passauth";
import { setupRoutes } from "./routes/index.js";
export const PassauthExpress = (config) => {
    const { config: passauthConfig, emailConfig, hooks } = config;
    let passauthHandler;
    if (emailConfig) {
        const passauth = Passauth({
            ...passauthConfig,
            email: emailConfig
        });
        passauthHandler = passauth.handler;
    }
    else {
        const passauth = Passauth(passauthConfig);
        passauthHandler = passauth.handler;
    }
    return {
        setupRoutes: setupRoutes(passauthHandler, !!emailConfig, {
            hooks,
        }),
        passauth: passauthHandler,
        utils,
    };
};
//# sourceMappingURL=core.js.map