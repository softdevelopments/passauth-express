import { Request, Response, NextFunction } from "express";
import { PassauthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { JwtPayload } from "../interfaces/auth.types.js";
import { EmailSenderHandler } from "@passauth/email-plugin";

export const AdminGuard =
  (handler: PassauthHandler<User>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      const decodedToken = handler.verifyAccessToken<JwtPayload>(token || "");

      if (!decodedToken || decodedToken.data?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (_error) {
      return res.status(403).json({ message: "Forbidden" });
    }
  };

export const AuthMiddleware =
  (handler: EmailSenderHandler<User> | PassauthHandler<User>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAuthorized = handler.verifyAccessToken(
        req.headers.authorization?.split(" ")[1] || "",
      );

      if (isAuthorized) {
        return next();
      }
    } catch (_error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
