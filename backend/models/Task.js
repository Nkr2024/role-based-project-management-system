import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Task title must contain at least 3 characters"],
      maxlength: [120, "Task title cannot exceed 120 characters"]
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        "Task description cannot exceed 1000 characters"
      ],
      default: ""
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    status: {
      type: String,
      enum: [
        "todo",
        "in-progress",
        "under-review",
        "completed"
      ],
      default: "todo"
    },

    dueDate: {
      type: Date,
      required: [true, "Task due date is required"]
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({
  project: 1,
  status: 1
});

taskSchema.index({
  assignedTo: 1,
  status: 1
});

const Task = mongoose.model("Task", taskSchema);

export default Task;