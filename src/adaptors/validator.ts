import z from "zod";
import { Response } from "express";

export const zodExceptionHandler = (error: z.ZodError, res: Response) => {
  res.status(400).json({
    error: "Invalid parameters",
    details: error.issues.map(
      (issue) => `${issue.path.join(",")}: ${issue.message}`
    ),
  });
};
