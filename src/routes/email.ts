/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Router } from "express";
import { PassauthHandler } from "passauth";
import {
  ConfirmResetPasswordValidator,
  ResetPasswordValidator,
} from "../validator/login.validator";
import { errorHandler } from "../utils/error-handler";
import {
  ConfirmEmailValidator,
  SendEmailConfirmationValidator,
} from "../validator/register.validator";
import { User } from "../interfaces/user.types";
import { logger } from "../utils/console";
import { PassauthExpressConfig } from "../interfaces/express.types";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

export const setupEmailRoutes =
  (
    passauth: PassauthHandler<User>,
    config: {
      hooks: PassauthExpressConfig["hooks"];
    },
    router: Router,
  ) =>
  () => {
    const runBeforeHandler = async <T>(
      req: Request,
      routeHandler: ((req: Request) => Promise<T> | T) | undefined,
      fallback: () => T,
    ) => {
      if (routeHandler) {
        return routeHandler(req);
      }

      return fallback();
    };
    const runAfterHandler = async <T>(
      req: Request,
      routeHandler:
        | ((params: { req: Request; data: any; result: any }) => Promise<T> | T)
        | undefined,
      data: any,
      result: any,
      fallback: () => T,
    ) => {
      if (routeHandler) {
        return routeHandler({ req, data, result });
      }

      return fallback();
    };

    router.get("/register/send-email", async (req, res) => {
      try {
        const data = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.registerSendEmail,
          () => SendEmailConfirmationValidator.parse(req.query),
        );

        const result = await passauth.sendConfirmPasswordEmail(data.email);
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.registerSendEmail,
          data,
          result,
          () => ({ message: "Confirmation email sent" }),
        );

        res.status(200).json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to send email confirmation");
      }
    });

    router.post("/register/confirm-email", async (req, res) => {
      try {
        const data = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.registerConfirmEmail,
          () => ConfirmEmailValidator.parse(req.body),
        );

        const result = await passauth.confirmEmail(data.email, data.token);
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.registerConfirmEmail,
          data,
          result,
          () => result,
        );

        res.json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to confirm email");
      }
    });

    router.get("/reset-password", async (req, res) => {
      try {
        const { email } = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.resetPassword,
          () => ResetPasswordValidator.parse(req.query),
        );

        const { success, error } = await passauth.sendResetPasswordEmail(email);

        if (error) {
          console.error(`Failed to reset password for ${email}:`, error);
        }

        if (!success) {
          return res.status(400).json({
            error: "Failed to send reset password email",
          });
        }
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.resetPassword,
          { email },
          { success, error },
          () => ({ message: "Reset password email sent" }),
        );
        res.status(200).json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to send reset password email");
      }
    });

    router.post("/reset-password", async (req, res) => {
      try {
        const data = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.resetPasswordConfirm,
          () => ConfirmResetPasswordValidator.parse(req.body),
        );

        const result = await passauth.confirmResetPassword(
          data.email,
          data.token,
          data.password,
        );
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.resetPasswordConfirm,
          data,
          result,
          () => result,
        );

        res.json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to reset password");
      }
    });

    return router;
  };
