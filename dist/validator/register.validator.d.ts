import * as z from "zod";
export declare const RegisterValidator: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const SendEmailConfirmationValidator: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export declare const ConfirmEmailValidator: z.ZodObject<{
    email: z.ZodEmail;
    token: z.ZodString;
}, z.core.$strip>;
