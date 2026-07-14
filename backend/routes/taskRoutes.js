import express from "express";

import {
  createTask,
  getTasks,
  updateTaskStatus,
  deleteTask
} from "../controllers/taskController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(
    authorize("admin", "manager"),
    createTask
  );

router.patch(
  "/:id/status",
  updateTaskStatus
);

router.delete(
  "/:id",
  authorize("admin", "manager"),
  deleteTask
);

export default router;
