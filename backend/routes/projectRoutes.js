import express from "express";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  removeProjectMember,
  deleteProject
} from "../controllers/projectController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(
    authorize("admin", "manager"),
    createProject
  );

router
  .route("/:id")
  .get(getProjectById)
  .patch(
    authorize("admin", "manager"),
    updateProject
  )
  .delete(
    authorize("admin", "manager"),
    deleteProject
  );

router.post(
  "/:id/members",
  authorize("admin", "manager"),
  addProjectMember
);

router.delete(
  "/:id/members/:userId",
  authorize("admin", "manager"),
  removeProjectMember
);

export default router;