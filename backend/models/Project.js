import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [3, "Project title must contain at least 3 characters"],
      maxlength: [100, "Project title cannot exceed 100 characters"]
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Project description cannot exceed 1000 characters"
      ],
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    status: {
      type: String,
      enum: [
        "planned",
        "in-progress",
        "completed",
        "on-hold"
      ],
      default: "planned"
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    deadline: {
      type: Date,
      required: [true, "Project deadline is required"]
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({
  createdBy: 1,
  status: 1
});

projectSchema.index({
  members: 1
});

const Project = mongoose.model(
  "Project",
  projectSchema
);

export default Project;