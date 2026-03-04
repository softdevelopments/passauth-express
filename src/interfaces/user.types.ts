import { type User as PassauthUser } from "passauth";

export type User = PassauthUser & {
  roles: string[];
};
