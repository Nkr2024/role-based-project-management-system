import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    requestType: {
      type: String,
      enum: [
        "leave",
        "work-from-home",
        "equipment",
        "expense"
      ],
      required: [
        true,
        "Request type is required"
      ]
    },

    title: {
      type: String,
      required: [
        true,
        "Request title is required"
      ],
      trim: true,
      minlength: [
        3,
        "Request title must contain at least 3 characters"
      ],
      maxlength: [
        120,
        "Request title cannot exceed 120 characters"
      ]
    },

    reason: {
      type: String,
      required: [
        true,
        "Request reason is required"
      ],
      trim: true,
      minlength: [
        10,
        "Request reason must contain at least 10 characters"
      ],
      maxlength: [
        1000,
        "Request reason cannot exceed 1000 characters"
      ]
    },

    startDate: {
      type: Date,
      default: null
    },

    endDate: {
      type: Date,
      default: null
    },

    amount: {
      type: Number,
      min: [
        0,
        "Amount cannot be negative"
      ],
      default: null
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "cancelled"
      ],
      default: "pending"
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewerComment: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Reviewer comment cannot exceed 500 characters"
      ],
      default: ""
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

requestSchema.index({
  requestedBy: 1,
  status: 1
});

requestSchema.index({
  status: 1,
  createdAt: -1
});

const Request = mongoose.model(
  "Request",
  requestSchema
);

export default Request;