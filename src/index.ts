/* eslint-disable @typescript-eslint/no-explicit-any */
export { RoleGuard, AuthMiddleware } from "./middlewares/admin-guard";
export { PassauthExpress, type PassauthExpressInstance } from "./core";
export type { User } from "./interfaces/user.types";
export type { PassauthExpressConfig } from "./interfaces/express.types";
export { getOpenApiDocumentation, type OpenApiOptions } from "./documentation";
