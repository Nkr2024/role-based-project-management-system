import express from "express";

import {
  getUsers,
  getUserById,
  getActiveEmployees,
  updateUserRole,
  updateUserStatus
} from "../controllers/userController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Admin and managers need this route
router.get(
  "/employees",
  authorize("admin", "manager"),
  getActiveEmployees
);

// Everything below this line is admin-only
router.use(authorize("admin"));

router.get("/", getUsers);

router.get("/:id", getUserById);

router.patch(
  "/:id/role",
  updateUserRole
);

router.patch(
  "/:id/status",
  updateUserStatus
);

export default router;