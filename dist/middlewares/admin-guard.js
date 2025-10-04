export const RoleGuard = (handler, roles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decodedToken = handler.verifyAccessToken(token || "");
    if (
      !decodedToken ||
      decodedToken.data?.roles.some((role) => roles.includes(role))
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (_error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};
export const AuthMiddleware = (handler) => async (req, res, next) => {
  try {
    const isAuthorized = handler.verifyAccessToken(
      req.headers.authorization?.split(" ")[1] || "",
    );
    if (isAuthorized) {
      return next();
    }
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
//# sourceMappingURL=admin-guard.js.map
