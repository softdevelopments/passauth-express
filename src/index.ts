import { Router } from "express";
import { AuthHandler, Passauth, PassauthInvalidUserException } from "passauth";
import type { PassauthConfiguration } from "passauth/auth/interfaces";
import type { EmailPluginOptions } from "@passauth/email-plugin/interfaces";
import { type EmailSender } from "@passauth/email-plugin/handlers";
import { EmailSenderPlugin } from "@passauth/email-plugin";
import { EMAIL_SENDER_PLUGIN } from "@passauth/email-plugin/constants";
import {
  ConfirmResetPasswordValidator,
  LoginValidator,
  RefreshTokenValidator,
  ResetPasswordValidator,
  RevokeRefreshTokenValidator,
} from "./validator/login.validator";
import { errorHandler } from "./utils/error-handler";
import {
  ConfirmEmailValidator,
  RegisterValidator,
  SendEmailConfirmationValidator,
} from "./validator/register.validator";
import { User } from "./interfaces/user.types";
import { AdminGuard } from "./middlewares/admin-guard";
export { AdminGuard, AuthMiddleware } from "./middlewares/admin-guard";

export type PassauthExpressConfig = {
  config: Omit<PassauthConfiguration<User>, "plugins">;
  emailConfig: EmailPluginOptions;
};

type PassauthInstance = {
  handler: AuthHandler<User>;
  plugins: {
    [EMAIL_SENDER_PLUGIN]?: { handler: EmailSender };
  };
};

const setupRoutes =
  (passauth: PassauthInstance, withEmailPlugin: boolean) => () => {
    const router = Router();

    // Register Routes
    router.post("/register", async (req, res) => {
      try {
        const data = RegisterValidator.parse(req.body);

        const handler =
          passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler || passauth.handler;

        await handler.register(data);

        res.status(201).json({ message: "Registration successful" });
      } catch (error) {
        errorHandler(error, res, "Failed to register user");
      }
    });

    if (withEmailPlugin) {
      router.get("/register/send-email", async (req, res) => {
        try {
          const data = SendEmailConfirmationValidator.parse(req.query);

          const handler = passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler!;

          await handler.sendConfirmPasswordEmail(data.email);

          res.status(200).json({ message: "Confirmation email sent" });
        } catch (error) {
          errorHandler(error, res, "Failed to send email confirmation");
        }
      });

      router.post("/register/confirm-email", async (req, res) => {
        try {
          const data = ConfirmEmailValidator.parse(req.body);

          const handler = passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler!;

          const result = await handler.confirmEmail(data.email, data.token);

          if (!result.success) {
            return res.status(400).json({ message: "Failed to confirm email" });
          }

          res.json(result);
        } catch (error) {
          errorHandler(error, res, "Failed to confirm email");
        }
      });
    }

    // Login Routes

    router.post("/login", async (req, res) => {
      try {
        const data = LoginValidator.parse(req.body);

        const handler =
          passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler || passauth.handler;

        const result = await handler.login<User>(data, ["role"]);

        res.json(result);
      } catch (error) {
        errorHandler(error, res, "Failed to login");
      }
    });

    router.post("/refresh-token", async (req, res) => {
      try {
        const { accessToken, refreshToken } = RefreshTokenValidator.parse(
          req.body
        );

        const handler = passauth.handler;

        const result = await handler.refreshToken(accessToken, refreshToken);

        res.json(result);
      } catch (error) {
        errorHandler(error, res, "Failed to refresh access token");
      }
    });

    router.post(
      "/refresh-token/revoke",
      AdminGuard(passauth.handler),
      async (req, res) => {
        try {
          const data = RevokeRefreshTokenValidator.parse(req.body);

          const handler = passauth.handler;
          const user = await passauth.handler.repo.getUser(data);

          if (!user) {
            const logData =
              "email" in data ? `email: ${data.email}` : `id: ${data.id}`;

            throw new PassauthInvalidUserException(logData);
          }

          handler.revokeRefreshToken(user.id);

          res.json({ message: "Refresh token revoked" });
        } catch (error) {
          errorHandler(error, res, "Failed to revoke refresh token");
        }
      }
    );

    // Reset Password Routes

    if (withEmailPlugin) {
      router.get("/reset-password", async (req, res) => {
        try {
          const { email } = ResetPasswordValidator.parse(req.query);

          const handler = passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler!;

          const { success, error } = await handler.sendResetPasswordEmail(
            email
          );

          if (error) {
            console.error(`Failed to reset password for ${email}:`, error);
          }

          if (!success) {
            return res.status(400).json({
              error: "Failed to send reset password email",
            });
          }
          res.status(200).json({ message: "Reset password email sent" });
        } catch (error) {
          errorHandler(error, res, "Failed to send reset password email");
        }
      });

      router.post("/reset-password", async (req, res) => {
        try {
          const data = ConfirmResetPasswordValidator.parse(req.body);

          const handler = passauth.plugins?.[EMAIL_SENDER_PLUGIN]?.handler!;

          const result = await handler.confirmResetPassword(
            data.email,
            data.token,
            data.password
          );

          res.json(result);
        } catch (error) {
          errorHandler(error, res, "Failed to reset password");
        }
      });
    }

    return router;
  };

export const PassauthExpress = (config: PassauthExpressConfig) => {
  const { config: passauthConfig, emailConfig } = config;

  let passauth: PassauthInstance;

  if (emailConfig) {
    passauth = Passauth({
      ...passauthConfig,
      plugins: [EmailSenderPlugin(emailConfig)],
    });
  } else {
    passauth = Passauth({
      ...passauthConfig,
      plugins: [],
    });
  }

  return {
    setupRoutes: setupRoutes(passauth, !!emailConfig),
    passauth: passauth.handler,
  };
};
