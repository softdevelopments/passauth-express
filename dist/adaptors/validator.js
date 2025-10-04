export const zodExceptionHandler = (error, res) => {
  res.status(400).json({
    error: "Invalid parameters",
    details: error.issues.map(
      (issue) => `${issue.path.join(",")}: ${issue.message}`,
    ),
  });
};
//# sourceMappingURL=validator.js.map
