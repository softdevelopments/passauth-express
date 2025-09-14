import { access } from "fs";
import * as z from "zod";

export const LoginValidator = z.object({
  email: z.email(),
  password: z.string().min(6).max(100),
});

export const RefreshTokenValidator = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const ResetPasswordValidator = z.object({
  email: z.email(),
});

export const ConfirmResetPasswordValidator = z.object({
  email: z.email(),
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

export const RevokeRefreshTokenValidator = z.object({
  id: z.string().min(1),
});
