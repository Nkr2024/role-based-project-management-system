import express from "express";

import {
  createRequest,
  getRequests,
  getRequestById,
  reviewRequest,
  cancelRequest
} from "../controllers/requestController.js";

import {
  protect,
  authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getRequests)
  .post(
    authorize("employee"),
    createRequest
  );

router.get(
  "/:id",
  getRequestById
);

router.patch(
  "/:id/review",
  authorize("admin", "manager"),
  reviewRequest
);

router.patch(
  "/:id/cancel",
  authorize("admin", "employee"),
  cancelRequest
);

export default router;

