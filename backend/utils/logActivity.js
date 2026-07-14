import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async ({
  performedBy,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {}
}) => {
  try {
    await ActivityLog.create({
      performedBy,
      action,
      entityType,
      entityId,
      description,
      metadata
    });
  } catch (error) {
    console.error(
      "Activity logging failed:",
      error.message
    );
  }
};