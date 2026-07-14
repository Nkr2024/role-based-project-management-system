import mongoose from "mongoose";

import Request from "../models/Request.js";
import Project from "../models/Project.js";
import { logActivity } from "../utils/logActivity.js";

export const createRequest = async (
  req,
  res,
  next
) => {
  try {
    const {
      requestType,
      title,
      reason,
      startDate,
      endDate,
      amount
    } = req.body;

    const allowedRequestTypes = [
      "leave",
      "work-from-home",
      "equipment",
      "expense"
    ];

    if (
      !requestType ||
      !title ||
      !reason
    ) {
      res.status(400);

      throw new Error(
        "Request type, title and reason are required"
      );
    }

    if (
      !allowedRequestTypes.includes(
        requestType
      )
    ) {
      res.status(400);

      throw new Error(
        "Invalid request type"
      );
    }

    let parsedStartDate = null;
    let parsedEndDate = null;
    let parsedAmount = null;

    if (
      requestType === "leave" ||
      requestType === "work-from-home"
    ) {
      if (!startDate || !endDate) {
        res.status(400);

        throw new Error(
          "Start date and end date are required"
        );
      }

      parsedStartDate = new Date(startDate);
      parsedEndDate = new Date(endDate);

      if (
        Number.isNaN(
          parsedStartDate.getTime()
        ) ||
        Number.isNaN(
          parsedEndDate.getTime()
        )
      ) {
        res.status(400);

        throw new Error(
          "Please provide valid dates"
        );
      }

      if (
        parsedEndDate <
        parsedStartDate
      ) {
        res.status(400);

        throw new Error(
          "End date cannot be before start date"
        );
      }
    }

    if (requestType === "expense") {
      parsedAmount = Number(amount);

      if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0
      ) {
        res.status(400);

        throw new Error(
          "A valid positive amount is required"
        );
      }
    }

    const request = await Request.create({
      requestedBy: req.user._id,
      requestType,
      title,
      reason,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      amount: parsedAmount
    });

    await logActivity({
       performedBy: req.user._id,
       action: "REQUEST_SUBMITTED",
       entityType: "request",
       entityId: request._id,
       description: `${req.user.name} submitted a ${request.requestType.replaceAll(
       "-",
       " "
      )} request`,
      metadata: {
        requestType: request.requestType
    }
});

    await request.populate(
      "requestedBy",
      "name email role"
    );

    return res.status(201).json({
      success: true,
      message:
        "Request submitted successfully",
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      requestType,
      page = 1,
      limit = 10
    } = req.query;

    const pageNumber = Math.max(
      Number.parseInt(page, 10) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number.parseInt(limit, 10) || 10,
        1
      ),
      50
    );

    const query = {};

    if (req.user.role === "employee") {
      query.requestedBy = req.user._id;
    }

    if (req.user.role === "manager") {
      const managerProjects =
        await Project.find({
          createdBy: req.user._id
        }).select("members");

      const employeeIds = new Set();

      managerProjects.forEach((project) => {
        project.members.forEach(
          (memberId) => {
            employeeIds.add(
              memberId.toString()
            );
          }
        );
      });

      query.requestedBy = {
        $in: Array.from(employeeIds)
      };
    }

    if (
      status &&
      [
        "pending",
        "approved",
        "rejected",
        "cancelled"
      ].includes(status)
    ) {
      query.status = status;
    }

    if (
      requestType &&
      [
        "leave",
        "work-from-home",
        "equipment",
        "expense"
      ].includes(requestType)
    ) {
      query.requestType = requestType;
    }

    const skip =
      (pageNumber - 1) * pageSize;

    const [requests, totalRequests] =
      await Promise.all([
        Request.find(query)
          .populate(
            "requestedBy",
            "name email role"
          )
          .populate(
            "reviewedBy",
            "name email role"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize),

        Request.countDocuments(query)
      ]);

    return res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(
            totalRequests / pageSize
          ),
          pageSize,
          totalRequests
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        "Invalid request ID"
      );
    }

    const request = await Request.findById(id)
      .populate(
        "requestedBy",
        "name email role"
      )
      .populate(
        "reviewedBy",
        "name email role"
      );

    if (!request) {
      res.status(404);

      throw new Error(
        "Request not found"
      );
    }

    let hasAccess = false;

    if (req.user.role === "admin") {
      hasAccess = true;
    }

    if (
      req.user.role === "employee" &&
      request.requestedBy._id.toString() ===
        req.user._id.toString()
    ) {
      hasAccess = true;
    }

    if (req.user.role === "manager") {
      const managesEmployee =
        await Project.exists({
          createdBy: req.user._id,
          members:
            request.requestedBy._id
        });

      if (managesEmployee) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(403);

      throw new Error(
        "You do not have access to this request"
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

export const reviewRequest = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      status,
      reviewerComment = ""
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        "Invalid request ID"
      );
    }

    if (
      !["approved", "rejected"].includes(
        status
      )
    ) {
      res.status(400);

      throw new Error(
        "Status must be approved or rejected"
      );
    }

    const request =
      await Request.findById(id);

    if (!request) {
      res.status(404);

      throw new Error(
        "Request not found"
      );
    }

    if (request.status !== "pending") {
      res.status(409);

      throw new Error(
        "Only pending requests can be reviewed"
      );
    }

    if (req.user.role === "manager") {
      const managesEmployee =
        await Project.exists({
          createdBy: req.user._id,
          members: request.requestedBy
        });

      if (!managesEmployee) {
        res.status(403);

        throw new Error(
          "You cannot review this employee's request"
        );
      }
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewerComment =
      reviewerComment.trim();
    request.reviewedAt = new Date();

    await request.save();

    await logActivity({
     performedBy: req.user._id,
     action:
       status === "approved"
      ? "REQUEST_APPROVED"
      : "REQUEST_REJECTED",
     entityType: "request",
     entityId: request._id,
     description: `${req.user.name} ${status} '${request.title}'`,
     metadata: {
      requestedBy: request.requestedBy,
      reviewerComment: request.reviewerComment
  }
});

    await request.populate(
      "requestedBy",
      "name email role"
    );

    await request.populate(
      "reviewedBy",
      "name email role"
    );

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Request approved"
          : "Request rejected",
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error(
        "Invalid request ID"
      );
    }

    const request =
      await Request.findById(id);

    if (!request) {
      res.status(404);

      throw new Error(
        "Request not found"
      );
    }

    if (
      req.user.role !== "admin" &&
      request.requestedBy.toString() !==
        req.user._id.toString()
    ) {
      res.status(403);

      throw new Error(
        "You cannot cancel this request"
      );
    }

    if (request.status !== "pending") {
      res.status(409);

      throw new Error(
        "Only pending requests can be cancelled"
      );
    }

    request.status = "cancelled";

    await request.save();

    await logActivity({
     performedBy: req.user._id,
     action: "REQUEST_CANCELLED",
     entityType: "request",
     entityId: request._id,
     description: `${req.user.name} cancelled request '${request.title}'`,
     metadata: {
      requestType: request.requestType
    }
});

    await request.populate(
      "requestedBy",
      "name email role"
    );

    return res.status(200).json({
      success: true,
      message: "Request cancelled",
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

