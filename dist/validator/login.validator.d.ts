import * as z from "zod";
export declare const LoginValidator: z.ZodObject<
  {
    email: z.ZodEmail;
    password: z.ZodString;
  },
  z.core.$strip
>;
export declare const RefreshTokenValidator: z.ZodObject<
  {
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
  },
  z.core.$strip
>;
export declare const ResetPasswordValidator: z.ZodObject<
  {
    email: z.ZodEmail;
  },
  z.core.$strip
>;
export declare const ConfirmResetPasswordValidator: z.ZodObject<
  {
    email: z.ZodEmail;
    token: z.ZodString;
    password: z.ZodString;
  },
  z.core.$strip
>;
export declare const RevokeRefreshTokenValidator: z.ZodUnion<
  readonly [
    z.ZodObject<
      {
        id: z.ZodString;
      },
      z.core.$strip
    >,
    z.ZodObject<
      {
        email: z.ZodString;
      },
      z.core.$strip
    >,
  ]
>;
