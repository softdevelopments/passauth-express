import { UserRole } from "./user.types.js";
export type JwtPayload = {
    role: UserRole;
};
