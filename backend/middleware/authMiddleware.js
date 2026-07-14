import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      res.status(401);

      throw new Error(
        "Authentication required. Token is missing"
      );
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      res.status(401);

      throw new Error("Authentication token is missing");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);

      throw new Error(
        "The user associated with this token no longer exists"
      );
    }

    if (!user.isActive) {
      res.status(403);

      throw new Error(
        "Your account has been deactivated"
      );
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.status(401);
      return next(new Error("Invalid authentication token"));
    }

    if (error.name === "TokenExpiredError") {
      res.status(401);
      return next(new Error("Authentication token has expired"));
    }

    next(error);
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);

      return next(
        new Error("Authentication is required")
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);

      return next(
        new Error(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};