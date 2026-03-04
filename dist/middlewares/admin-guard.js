export const RoleGuard = (roles) => async (req, res, next) => {
    try {
        const userRoles = req.sessionData?.user.roles || [];
        if (!userRoles.some((role) => roles.includes(role))) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    }
    catch (_error) {
        return res.status(403).json({ message: "Forbidden" });
    }
};
export const AuthMiddleware = (handler) => async (req, res, next) => {
    try {
        const decodedToken = handler.verifyAccessToken(req.headers.authorization?.split(" ")[1] || "");
        if (!decodedToken) {
            throw new Error("Forbiden");
        }
        req.sessionData = {
            user: {
                id: decodedToken.sub,
                roles: decodedToken.data.roles,
            },
        };
        return next();
    }
    catch (_error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
//# sourceMappingURL=admin-guard.js.map