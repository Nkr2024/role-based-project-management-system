import ActivityLog from "../models/ActivityLog.js";

export const getActivityLogs = async (
  req,
  res,
  next
) => {
  try {
    const {
      entityType,
      action,
      page = 1,
      limit = 15
    } = req.query;

    const pageNumber = Math.max(
      Number.parseInt(page, 10) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number.parseInt(limit, 10) || 15,
        1
      ),
      50
    );

    const query = {};

    if (
      entityType &&
      [
        "user",
        "project",
        "task",
        "request",
        "authentication"
      ].includes(entityType)
    ) {
      query.entityType = entityType;
    }

    if (action?.trim()) {
      query.action = {
        $regex: action.trim(),
        $options: "i"
      };
    }

    const skip =
      (pageNumber - 1) * pageSize;

    const [activities, totalActivities] =
      await Promise.all([
        ActivityLog.find(query)
          .populate(
            "performedBy",
            "name email role"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize),

        ActivityLog.countDocuments(query)
      ]);

    return res.status(200).json({
      success: true,
      data: {
        activities,

        pagination: {
          currentPage: pageNumber,

          totalPages: Math.ceil(
            totalActivities / pageSize
          ),

          pageSize,
          totalActivities
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

