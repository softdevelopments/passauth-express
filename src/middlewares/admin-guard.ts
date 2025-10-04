import { Response, NextFunction } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { EmailSenderHandler } from "@passauth/email-plugin";
import {
  AuthenticatedRequest,
  SessionData,
} from "../interfaces/express.types.js";

export const RoleGuard =
  (roles: string[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRoles = req.sessionData?.user.roles || [];
      if (!userRoles.some((role) => roles.includes(role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (_error) {
      return res.status(403).json({ message: "Forbidden" });
    }
  };

export const AuthMiddleware =
  (handler: EmailSenderHandler<User> | PassauthHandler<User>) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const decodedToken = handler.verifyAccessToken<
        Pick<SessionData["user"], "roles">
      >(req.headers.authorization?.split(" ")[1] || "");

      if (!decodedToken) {
        throw new Error("Forbiden");
      }

      req.sessionData = {
        user: {
          id: decodedToken.sub,
          roles: decodedToken.data!.roles!,
        },
      };

      return next();
    } catch (_error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
