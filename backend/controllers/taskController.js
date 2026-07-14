import mongoose from "mongoose";

import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { logActivity } from "../utils/logActivity.js";

import {
  canManageProject,
  canViewProject
} from "../utils/projectAccess.js";

export const createTask = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      dueDate
    } = req.body;

    if (
      !title ||
      !projectId ||
      !assignedTo ||
      !dueDate
    ) {
      res.status(400);

      throw new Error(
        "Title, project, assignee and due date are required"
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        projectId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        assignedTo
      )
    ) {
      res.status(400);

      throw new Error(
        "Invalid project or assignee ID"
      );
    }

    const project =
      await Project.findById(projectId);

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (
      !canManageProject(project, req.user)
    ) {
      res.status(403);

      throw new Error(
        "You cannot create tasks for this project"
      );
    }

    const assignee = await User.findById(
      assignedTo
    );

    if (!assignee) {
      res.status(404);

      throw new Error("Assignee not found");
    }

    if (
      !assignee.isActive ||
      assignee.role !== "employee"
    ) {
      res.status(400);

      throw new Error(
        "The assignee must be an active employee"
      );
    }

    const isProjectMember =
      project.members.some((memberId) => {
        return (
          memberId.toString() ===
          assignedTo
        );
      });

    if (!isProjectMember) {
      res.status(400);

      throw new Error(
        "The assignee must be a member of this project"
      );
    }

    const taskDueDate = new Date(dueDate);

    if (
      Number.isNaN(taskDueDate.getTime())
    ) {
      res.status(400);

      throw new Error(
        "Please provide a valid due date"
      );
    }

    if (taskDueDate > project.deadline) {
      res.status(400);

      throw new Error(
        "Task due date cannot exceed the project deadline"
      );
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      dueDate: taskDueDate
    });

    await task.populate(
      "assignedTo",
      "name email role"
    );

    await task.populate(
      "assignedBy",
      "name email role"
    );

    await logActivity({
     performedBy: req.user._id,
     action: "TASK_CREATED",
     entityType: "task",
     entityId: task._id,
     description: `${req.user.name} assigned task '${task.title}' to ${assignee.name}`,
     metadata: {
      projectId: project._id,
      assignedTo: assignee._id,
      priority: task.priority
  }
});

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req,
  res,
  next
) => {
  try {
    const {
      projectId,
      status,
      priority
    } = req.query;

    const query = {};

    if (projectId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          projectId
        )
      ) {
        res.status(400);

        throw new Error(
          "Invalid project ID"
        );
      }

      query.project = projectId;
    }

    if (
      status &&
      [
        "todo",
        "in-progress",
        "under-review",
        "completed"
      ].includes(status)
    ) {
      query.status = status;
    }

    if (
      priority &&
      [
        "low",
        "medium",
        "high",
        "urgent"
      ].includes(priority)
    ) {
      query.priority = priority;
    }

    if (req.user.role === "employee") {
      query.assignedTo = req.user._id;
    }

    if (req.user.role === "manager") {
      const managerProjects =
        await Project.find({
          createdBy: req.user._id
        }).select("_id");

      query.project = {
        $in: managerProjects.map(
          (project) => project._id
        )
      };

      if (projectId) {
        const ownsRequestedProject =
          managerProjects.some((project) => {
            return (
              project._id.toString() ===
              projectId
            );
          });

        if (!ownsRequestedProject) {
          res.status(403);

          throw new Error(
            "You cannot view tasks from this project"
          );
        }

        query.project = projectId;
      }
    }

    const tasks = await Task.find(query)
      .populate(
        "project",
        "title status deadline"
      )
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "assignedBy",
        "name email role"
      )
      .sort({
        dueDate: 1,
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      data: {
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "todo",
      "in-progress",
      "under-review",
      "completed"
    ];

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error("Invalid task ID");
    }

    if (!allowedStatuses.includes(status)) {
      res.status(400);

      throw new Error("Invalid task status");
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404);

      throw new Error("Task not found");
    }

    const project = await Project.findById(
      task.project
    );

    if (!project) {
      res.status(404);

      throw new Error(
        "Associated project not found"
      );
    }

    const previousStatus = task.status;

    const isAssignedEmployee =
      req.user.role === "employee" &&
      task.assignedTo.toString() ===
        req.user._id.toString();

    const isProjectManager =
      req.user.role === "manager" &&
      canManageProject(project, req.user);

    const isAdmin =
      req.user.role === "admin";

    if (isAssignedEmployee) {
      const employeeTransitions = {
        todo: ["in-progress"],
        "in-progress": [
          "todo",
          "under-review"
        ],
        "under-review": [],
        completed: []
      };

      const allowedNextStatuses =
        employeeTransitions[previousStatus];

      if (
        !allowedNextStatuses.includes(status)
      ) {
        res.status(403);

        throw new Error(
          `Employee cannot change task status from ${previousStatus} to ${status}`
        );
      }
    } else if (isProjectManager || isAdmin) {
      const managerTransitions = {
        todo: [],
        "in-progress": [],
        "under-review": [
          "completed",
          "in-progress"
        ],
        completed: [
          "in-progress"
        ]
      };

      const allowedNextStatuses =
        managerTransitions[previousStatus];

      if (
        !allowedNextStatuses.includes(status)
      ) {
        res.status(403);

        throw new Error(
          `Manager cannot change task status from ${previousStatus} to ${status}`
        );
      }
    } else {
      res.status(403);

      throw new Error(
        "You cannot update this task"
      );
    }

    task.status = status;

    await task.save();

    await logActivity({
      performedBy: req.user._id,
      action: "TASK_STATUS_UPDATED",
      entityType: "task",
      entityId: task._id,
      description: `${req.user.name} changed task '${task.title}' from ${previousStatus} to ${status}`,
      metadata: {
        previousStatus,
        newStatus: status,
        projectId: project._id
      }
    });

    await task.populate(
      "assignedTo",
      "name email role"
    );

    await task.populate(
      "assignedBy",
      "name email role"
    );

    await task.populate(
      "project",
      "title status deadline"
    );

    return res.status(200).json({
      success: true,
      message: "Task status updated",
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
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

      throw new Error("Invalid task ID");
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404);

      throw new Error("Task not found");
    }

    const project = await Project.findById(
      task.project
    );

    if (
      !project ||
      !canManageProject(project, req.user)
    ) {
      res.status(403);

      throw new Error(
        "You cannot delete this task"
      );
    }

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

