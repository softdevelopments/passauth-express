import * as z from "zod";
import { zodExceptionHandler } from "../adaptors/validator.js";
import { PassauthException } from "passauth";
import { PassauthEmailPluginException } from "@passauth/email-plugin/exceptions";
export const errorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error,
  res,
  defaultErrorMessage,
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
//# sourceMappingURL=error-handler.js.map
