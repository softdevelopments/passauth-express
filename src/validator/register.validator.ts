import * as z from "zod";

export const RegisterValidator = z.object({
  email: z.email(),
  password: z.string().min(6).max(100),
});

export const SendEmailConfirmationValidator = z.object({
  email: z.email(),
});

export const ConfirmEmailValidator = z.object({
  email: z.email(),
  token: z.string().min(1),
});
