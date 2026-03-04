/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
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
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

export const setupEmailRoutes =
  (passauth: PassauthHandler<User>, router: Router) => () => {
    router.get("/register/send-email", async (req, res) => {
      try {
        const data = SendEmailConfirmationValidator.parse(req.query);

        await passauth.sendConfirmPasswordEmail(data.email);

        res.status(200).json({ message: "Confirmation email sent" });
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to send email confirmation");
      }
    });

    router.post("/register/confirm-email", async (req, res) => {
      try {
        const data = ConfirmEmailValidator.parse(req.body);

        const result = await passauth.confirmEmail(data.email, data.token);

        res.json(result);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to confirm email");
      }
    });

    router.get("/reset-password", async (req, res) => {
      try {
        const { email } = ResetPasswordValidator.parse(req.query);

        const { success, error } = await passauth.sendResetPasswordEmail(email);

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
        logger.error(error);
        errorHandler(error, res, "Failed to send reset password email");
      }
    });

    router.post("/reset-password", async (req, res) => {
      try {
        const data = ConfirmResetPasswordValidator.parse(req.body);

        const result = await passauth.confirmResetPassword(
          data.email,
          data.token,
          data.password,
        );

        res.json(result);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to reset password");
      }
    });

    return router;
  };
