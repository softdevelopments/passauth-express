import z from "zod";
import { Response } from "express";
export declare const zodExceptionHandler: (
  error: z.ZodError,
  res: Response,
) => void;
