import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    entityType: {
      type: String,
      enum: [
        "user",
        "project",
        "task",
        "request",
        "authentication"
      ],
      required: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [
        500,
        "Activity description cannot exceed 500 characters"
      ]
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({
  performedBy: 1,
  createdAt: -1
});

activityLogSchema.index({
  entityType: 1,
  createdAt: -1
});

const ActivityLog = mongoose.model(
  "ActivityLog",
  activityLogSchema
);

export default ActivityLog;