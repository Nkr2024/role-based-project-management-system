import mongoose from "mongoose";
import User from "../models/User.js";
import { logActivity } from "../utils/logActivity.js";

export const getUsers = async (req, res, next) => {
  try {
    const {
      search = "",
      role,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const pageNumber = Math.max(
      Number.parseInt(page, 10) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      50
    );

    const query = {};

    if (search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    if (
      role &&
      ["admin", "manager", "employee"].includes(role)
    ) {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    }

    if (status === "inactive") {
      query.isActive = false;
    }

    const skip = (pageNumber - 1) * pageSize;

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),

      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(
      totalUsers / pageSize
    );

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          pageSize,
          totalUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);

      throw new Error("Invalid user ID");
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404);

      throw new Error("User not found");
    }

    return res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = [
      "admin",
      "manager",
      "employee"
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);

      throw new Error("Invalid user ID");
    }

    if (!role) {
      res.status(400);

      throw new Error("Role is required");
    }

    if (!allowedRoles.includes(role)) {
      res.status(400);

      throw new Error(
        "Role must be admin, manager or employee"
      );
    }

    if (req.user._id.toString() === id) {
      res.status(400);

      throw new Error(
        "You cannot change your own role"
      );
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404);

      throw new Error("User not found");
    }

    const previousRole = user.role;

    user.role = role;

    await user.save();

    await logActivity({
     performedBy: req.user._id,
     action: "USER_ROLE_UPDATED",
     entityType: "user",
     entityId: user._id,
     description: `${req.user.name} changed ${user.name}'s role from ${previousRole} to ${user.role}`,
     metadata: {
      previousRole,
      newRole: user.role
  }
});   

    return res.status(200).json({
      success: true,
      message: `User role changed from ${previousRole} to ${user.role}`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);

      throw new Error("Invalid user ID");
    }

    if (typeof isActive !== "boolean") {
      res.status(400);

      throw new Error(
        "isActive must be a boolean value"
      );
    }

    if (req.user._id.toString() === id) {
      res.status(400);

      throw new Error(
        "You cannot deactivate your own account"
      );
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404);

      throw new Error("User not found");
    }

    const previousStatus = user.isActive;

    user.isActive = isActive;

    await user.save();

    await logActivity({
     performedBy: req.user._id,
     action: isActive
      ? "USER_ACTIVATED"
      : "USER_DEACTIVATED",
     entityType: "user",
     entityId: user._id,
     description: `${req.user.name} ${
      isActive ? "activated" : "deactivated"
    } ${user.name}'s account`,
    metadata: {
      previousStatus,
      newStatus: isActive
  }
});

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User account activated"
        : "User account deactivated",
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveEmployees = async (
  req,
  res,
  next
) => {
  try {
    const {
      search = ""
    } = req.query;

    const query = {
      role: "employee",
      isActive: true
    };

    if (search.trim()) {
      query.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    const employees = await User.find(query)
      .select("name email role isActive")
      .sort({
        name: 1
      });

    return res.status(200).json({
      success: true,
      data: {
        employees
      }
    });
  } catch (error) {
    next(error);
  }
};