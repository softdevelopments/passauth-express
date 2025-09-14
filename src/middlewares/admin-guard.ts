import { Request, Response, NextFunction } from "express";
import { AuthHandler } from "passauth";
import { User } from "../interfaces/user.types.js";
import { JwtPayload } from "../interfaces/auth.types.js";

export const AdminGuard =
  (handler: AuthHandler<User>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      const decodedToken = handler.verifyAccessToken<JwtPayload>(token || "");

      if (!decodedToken || decodedToken.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
