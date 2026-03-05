/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Router } from "express";
import { PassauthHandler, PassauthInvalidUserException } from "passauth";
import {
  LoginValidator,
  RefreshTokenValidator,
  RevokeRefreshTokenValidator,
} from "../validator/login.validator";
import { errorHandler } from "../utils/error-handler";
import { RegisterValidator } from "../validator/register.validator";
import { User } from "../interfaces/user.types";
import { AuthMiddleware, RoleGuard } from "../middlewares";
import { PassauthExpressConfig } from "../interfaces/express.types";
import { logger } from "../utils/console";
export { RoleGuard, AuthMiddleware } from "../middlewares/admin-guard";

export const setupCoreRoutes =
  (
    passauth: PassauthHandler<User>,
    config: {
      hooks: PassauthExpressConfig["hooks"];
    },
    router: Router
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

    // Register Routes
    router.post("/register", async (req, res) => {
      try {
        const data = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.register,
          () => RegisterValidator.parse(req.body),
        );

        const result = await passauth.register(data);
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.register,
          data,
          result,
          () => ({ message: "Registration successful" }),
        );

        res.status(201).json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to register user");
      }
    });

    // Login Routes
    router.post("/login", async (req, res) => {
      try {
        const data = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.login,
          () => LoginValidator.parse(req.body),
        );

        const result = await passauth.login(data, { jwtUserFields: ["roles"] });
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.login,
          data,
          result,
          async () => {
            const additionalData = config?.hooks?.afterLogin
              ? await config.hooks.afterLogin(data)
              : {};

            return { ...result, ...additionalData };
          },
        );

        res.json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to login");
      }
    });

    router.post("/refresh-token", async (req, res) => {
      try {
        const { accessToken, refreshToken } = await runBeforeHandler(
          req,
          config?.hooks?.beforeHandler?.refreshToken,
          () =>
            RefreshTokenValidator.parse(
              req.body,
            ),
        );

        const result = await passauth.refreshToken(accessToken, refreshToken);
        const response = await runAfterHandler(
          req,
          config?.hooks?.afterHandler?.refreshToken,
          { accessToken, refreshToken },
          result,
          () => result,
        );

        res.json(response);
      } catch (error) {
        logger.error(error);
        errorHandler(error, res, "Failed to refresh access token");
      }
    });

    router.post(
      "/refresh-token/revoke",
      AuthMiddleware(passauth),
      RoleGuard(["admin"]),
      async (req, res) => {
        try {
          const data = await runBeforeHandler(
            req,
            config?.hooks?.beforeHandler?.revokeRefreshToken,
            () => RevokeRefreshTokenValidator.parse(req.body),
          );

          const user = await passauth.repo.getUser(data);

          if (!user) {
            const logData =
              "email" in data ? `email: ${data.email}` : `id: ${data.id}`;

            throw new PassauthInvalidUserException(logData);
          }

          passauth.revokeRefreshToken(user.id);
          const response = await runAfterHandler(
            req,
            config?.hooks?.afterHandler?.revokeRefreshToken,
            data,
            user,
            () => ({ message: "Refresh token revoked" }),
          );

          res.json(response);
        } catch (error) {
          logger.error(error);
          errorHandler(error, res, "Failed to revoke refresh token");
        }
      },
    );

    return router;
  };
