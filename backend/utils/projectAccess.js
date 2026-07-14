export const isProjectOwner = (
  project,
  user
) => {
  const ownerId =
    project.createdBy._id ||
    project.createdBy;

  return (
    ownerId.toString() ===
    user._id.toString()
  );
};

export const isProjectMember = (
  project,
  user
) => {
  return project.members.some(
    (member) => {
      const memberId =
        member._id || member;

      return (
        memberId.toString() ===
        user._id.toString()
      );
    }
  );
};

export const canViewProject = (
  project,
  user
) => {
  if (user.role === "admin") {
    return true;
  }

  if (
    user.role === "manager" &&
    isProjectOwner(project, user)
  ) {
    return true;
  }

  if (
    user.role === "employee" &&
    isProjectMember(project, user)
  ) {
    return true;
  }

  return false;
};

export const canManageProject = (
  project,
  user
) => {
  if (user.role === "admin") {
    return true;
  }

  return (
    user.role === "manager" &&
    isProjectOwner(project, user)
  );
};