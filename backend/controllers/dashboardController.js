import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

const getAdminDashboard = async (user) => {
  const [
    totalUsers,
    activeUsers,
    managerCount,
    employeeCount,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    pendingRequests,
    recentActivities
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      isActive: true
    }),

    User.countDocuments({
      role: "manager",
      isActive: true
    }),

    User.countDocuments({
      role: "employee",
      isActive: true
    }),

    Project.countDocuments(),

    Project.countDocuments({
      status: "in-progress"
    }),

    Task.countDocuments(),

    Task.countDocuments({
      status: "completed"
    }),

    Request.countDocuments({
      status: "pending"
    }),

    ActivityLog.find()
      .populate(
        "performedBy",
        "name email role"
      )
      .sort({ createdAt: -1 })
      .limit(8)
  ]);

  const taskCompletionRate =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) *
            100
        );

  return {
    role: user.role,

    statistics: {
      totalUsers,
      activeUsers,
      managerCount,
      employeeCount,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      pendingRequests
    },

    recentActivities
  };
};

const getManagerDashboard = async (user) => {
  const managerProjects =
    await Project.find({
      createdBy: user._id
    }).select("_id title status deadline members");

  const projectIds = managerProjects.map(
    (project) => project._id
  );

  const employeeIdSet = new Set();

  managerProjects.forEach((project) => {
    project.members.forEach((memberId) => {
      employeeIdSet.add(
        memberId.toString()
      );
    });
  });

  const employeeIds = Array.from(
    employeeIdSet
  );

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    pendingRequests,
    recentTasks,
    recentActivities
  ] = await Promise.all([
    Task.countDocuments({
      project: {
        $in: projectIds
      }
    }),

    Task.countDocuments({
      project: {
        $in: projectIds
      },
      status: "completed"
    }),

    Task.countDocuments({
      project: {
        $in: projectIds
      },
      status: {
        $ne: "completed"
      }
    }),

    Request.countDocuments({
      requestedBy: {
        $in: employeeIds
      },
      status: "pending"
    }),

    Task.find({
      project: {
        $in: projectIds
      }
    })
      .populate(
        "project",
        "title status"
      )
      .populate(
        "assignedTo",
        "name email"
      )
      .sort({ createdAt: -1 })
      .limit(5),

    ActivityLog.find({
      $or: [
        {
          performedBy: user._id
        },
        {
          "metadata.projectId": {
            $in: projectIds
          }
        }
      ]
    })
      .populate(
        "performedBy",
        "name email role"
      )
      .sort({ createdAt: -1 })
      .limit(8)
  ]);

  const taskCompletionRate =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) *
            100
        );

  return {
    role: user.role,

    statistics: {
      totalProjects:
        managerProjects.length,
      teamMembers: employeeIds.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      taskCompletionRate,
      pendingRequests
    },

    recentProjects: managerProjects
      .slice(0, 5),

    recentTasks,
    recentActivities
  };
};

const getEmployeeDashboard = async (
  user
) => {
  const [
    totalProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    pendingRequests,
    recentTasks,
    recentRequests,
    recentActivities
  ] = await Promise.all([
    Project.countDocuments({
      members: user._id
    }),

    Task.countDocuments({
      assignedTo: user._id
    }),

    Task.countDocuments({
      assignedTo: user._id,
      status: "todo"
    }),

    Task.countDocuments({
      assignedTo: user._id,
      status: "in-progress"
    }),

    Task.countDocuments({
      assignedTo: user._id,
      status: "completed"
    }),

    Request.countDocuments({
      requestedBy: user._id,
      status: "pending"
    }),

    Task.find({
      assignedTo: user._id
    })
      .populate(
        "project",
        "title status"
      )
      .sort({
        dueDate: 1,
        createdAt: -1
      })
      .limit(5),

    Request.find({
      requestedBy: user._id
    })
      .sort({ createdAt: -1 })
      .limit(5),

    ActivityLog.find({
      performedBy: user._id
    })
      .populate(
        "performedBy",
        "name email role"
      )
      .sort({ createdAt: -1 })
      .limit(8)
  ]);

  const taskCompletionRate =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) *
            100
        );

  return {
    role: user.role,

    statistics: {
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      taskCompletionRate,
      pendingRequests
    },

    recentTasks,
    recentRequests,
    recentActivities
  };
};

export const getDashboard = async (
  req,
  res,
  next
) => {
  try {
    let dashboardData;

    if (req.user.role === "admin") {
      dashboardData =
        await getAdminDashboard(req.user);
    }

    if (req.user.role === "manager") {
      dashboardData =
        await getManagerDashboard(req.user);
    }

    if (req.user.role === "employee") {
      dashboardData =
        await getEmployeeDashboard(req.user);
    }

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

