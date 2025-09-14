import * as z from "zod";
import { Response } from "express";
import { zodExceptionHandler } from "../adaptors/validator.js";
import { PassauthException } from "passauth";
import { PassauthEmailPluginException } from "@passauth/email-plugin/exceptions";
export const errorHandler = (
  error: any,
  res: Response,
  defaultErrorMessage: string
) => {
  if (error instanceof z.ZodError) {
    zodExceptionHandler(error, res);
    return;
  }

  if (
    error instanceof PassauthException ||
    error instanceof PassauthEmailPluginException
  ) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(400).json({ error: defaultErrorMessage });
};
