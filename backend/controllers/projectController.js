import mongoose from "mongoose";

import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { logActivity } from "../utils/logActivity.js";

import {
  canManageProject,
  canViewProject
} from "../utils/projectAccess.js";

export const createProject = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      status,
      startDate,
      deadline
    } = req.body;

    if (!title || !deadline) {
      res.status(400);

      throw new Error(
        "Project title and deadline are required"
      );
    }

    const deadlineDate = new Date(deadline);

    if (
      Number.isNaN(deadlineDate.getTime())
    ) {
      res.status(400);

      throw new Error(
        "Please provide a valid deadline"
      );
    }

    const projectStartDate = startDate
      ? new Date(startDate)
      : new Date();

    if (
      Number.isNaN(projectStartDate.getTime())
    ) {
      res.status(400);

      throw new Error(
        "Please provide a valid start date"
      );
    }

    if (deadlineDate <= projectStartDate) {
      res.status(400);

      throw new Error(
        "Deadline must be after the start date"
      );
    }

    const project = await Project.create({
      title,
      description,
      status,
      startDate: projectStartDate,
      deadline: deadlineDate,
      createdBy: req.user._id,
      members: []
    });

    await project.populate(
      "createdBy",
      "name email role"
    );

    await logActivity({
       performedBy: req.user._id,
       action: "PROJECT_CREATED",
       entityType: "project",
       entityId: project._id,
       description: `${req.user.name} created project '${project.title}'`,
       metadata: {
       projectStatus: project.status,
       deadline: project.deadline
    }
});
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req,
  res,
  next
) => {
  try {
    const {
      search = "",
      status,
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

    if (req.user.role === "manager") {
      query.createdBy = req.user._id;
    }

    if (req.user.role === "employee") {
      query.members = req.user._id;
    }

    if (search.trim()) {
      query.$or = [
        {
          title: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    if (
      status &&
      [
        "planned",
        "in-progress",
        "completed",
        "on-hold"
      ].includes(status)
    ) {
      query.status = status;
    }

    const skip =
      (pageNumber - 1) * pageSize;

    const [projects, totalProjects] =
      await Promise.all([
        Project.find(query)
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "members",
            "name email role isActive"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize),

        Project.countDocuments(query)
      ]);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(
            totalProjects / pageSize
          ),
          pageSize,
          totalProjects
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
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

      throw new Error("Invalid project ID");
    }

    const project = await Project.findById(id)
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "members",
        "name email role isActive"
      );

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (!canViewProject(project, req.user)) {
      res.status(403);

      throw new Error(
        "You do not have access to this project"
      );
    }

    const tasks = await Task.find({
      project: project._id
    })
      .populate(
        "assignedTo",
        "name email role"
      )
      .populate(
        "assignedBy",
        "name email role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        project,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      status,
      startDate,
      deadline
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400);

      throw new Error("Invalid project ID");
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (
      !canManageProject(project, req.user)
    ) {
      res.status(403);

      throw new Error(
        "You cannot update this project"
      );
    }

    if (title !== undefined) {
      project.title = title;
    }

    if (description !== undefined) {
      project.description = description;
    }

    if (status !== undefined) {
      project.status = status;
    }

    if (startDate !== undefined) {
      project.startDate = new Date(startDate);
    }

    if (deadline !== undefined) {
      project.deadline = new Date(deadline);
    }

    if (
      project.deadline <= project.startDate
    ) {
      res.status(400);

      throw new Error(
        "Deadline must be after the start date"
      );
    }

    await project.save();

    await project.populate(
      "createdBy",
      "name email role"
    );

    await project.populate(
      "members",
      "name email role isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      res.status(400);

      throw new Error(
        "Invalid project or user ID"
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (
      !canManageProject(project, req.user)
    ) {
      res.status(403);

      throw new Error(
        "You cannot manage members of this project"
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404);

      throw new Error("User not found");
    }

    if (!user.isActive) {
      res.status(400);

      throw new Error(
        "An inactive user cannot be added"
      );
    }

    if (user.role !== "employee") {
      res.status(400);

      throw new Error(
        "Only employees can be added as project members"
      );
    }

    const memberAlreadyExists =
      project.members.some((memberId) => {
        return (
          memberId.toString() === userId
        );
      });

    if (memberAlreadyExists) {
      res.status(409);

      throw new Error(
        "User is already a project member"
      );
    }

    project.members.push(userId);

    await project.save();

    await logActivity({
      performedBy: req.user._id,
      action: "PROJECT_MEMBER_ADDED",
      entityType: "project",
      entityId: project._id,
      description: `${req.user.name} added ${user.name} to project '${project.title}'`,
      metadata: {
      memberId: user._id
    }
});

    await project.populate(
      "members",
      "name email role isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Project member added",
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (
  req,
  res,
  next
) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      res.status(400);

      throw new Error(
        "Invalid project or user ID"
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (!canManageProject(project, req.user)) {
      res.status(403);

      throw new Error(
        "You cannot manage members of this project"
      );
    }

    const removedUser = await User.findById(userId)
      .select("name email");

    if (!removedUser) {
      res.status(404);

      throw new Error("User not found");
    }

    const isProjectMember = project.members.some(
      (member) => {
        const memberId = member._id || member;

        return memberId.toString() === userId;
      }
    );

    if (!isProjectMember) {
      res.status(404);

      throw new Error(
        "User is not a project member"
      );
    }

    const assignedTaskExists = await Task.exists({
      project: project._id,
      assignedTo: userId,
      status: {
        $ne: "completed"
      }
    });

    if (assignedTaskExists) {
      res.status(400);

      throw new Error(
        "Complete or reassign the user's pending tasks before removing them"
      );
    }

    project.members = project.members.filter(
      (member) => {
        const memberId = member._id || member;

        return memberId.toString() !== userId;
      }
    );

    await project.save();

    await logActivity({
      performedBy: req.user._id,
      action: "PROJECT_MEMBER_REMOVED",
      entityType: "project",
      entityId: project._id,
      description: `${req.user.name} removed ${removedUser.name} from project '${project.title}'`,
      metadata: {
        memberId: removedUser._id,
        projectId: project._id
      }
    });

    await project.populate(
      "members",
      "name email role isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Project member removed",
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
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

      throw new Error("Invalid project ID");
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404);

      throw new Error("Project not found");
    }

    if (
      !canManageProject(project, req.user)
    ) {
      res.status(403);

      throw new Error(
        "You cannot delete this project"
      );
    }

    await Task.deleteMany({
      project: project._id
    });

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Project and its tasks were deleted"
    });
  } catch (error) {
    next(error);
  }
};