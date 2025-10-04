import { Request } from "express";
import { User } from "./user.types.js";
export type SessionData = {
    user: Pick<User, "id" | "roles">;
};
export interface AuthenticatedRequest extends Request {
    sessionData?: SessionData;
}
