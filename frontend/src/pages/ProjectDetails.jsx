import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/api.js";

const emptyTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: ""
};

/*
Employee transitions:
todo -> in-progress
in-progress -> todo or under-review

Manager/admin transitions:
under-review -> completed or in-progress
completed -> in-progress
*/
const getAllowedTaskStatuses = (
  task,
  user,
  canManageProject
) => {
  const currentUserId =
    user?.id || user?._id;

  const assignedEmployeeId =
    task.assignedTo?._id ||
    task.assignedTo;

  const isAssignedEmployee =
    user?.role === "employee" &&
    assignedEmployeeId?.toString() ===
      currentUserId?.toString();

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

    return (
      employeeTransitions[task.status] ||
      []
    );
  }

  if (
    canManageProject ||
    user?.role === "admin"
  ) {
    const managerTransitions = {
      todo: [],

      "in-progress": [],

      "under-review": [
        "completed",
        "in-progress"
      ],

      completed: ["in-progress"]
    };

    return (
      managerTransitions[task.status] ||
      []
    );
  }

  return [];
};

const formatStatus = (status) => {
  return status
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const ProjectDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [project, setProject] =
    useState(null);

  const [tasks, setTasks] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [
    selectedEmployee,
    setSelectedEmployee
  ] = useState("");

  const [taskForm, setTaskForm] =
    useState(emptyTaskForm);

  const [showTaskForm, setShowTaskForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingEmployees,
    setLoadingEmployees
  ] = useState(false);

  const [
    submittingMember,
    setSubmittingMember
  ] = useState(false);

  const [
    submittingTask,
    setSubmittingTask
  ] = useState(false);

  const [
    updatingTaskId,
    setUpdatingTaskId
  ] = useState(null);

  const [
    removingMemberId,
    setRemovingMemberId
  ] = useState(null);

  const [
    deletingProject,
    setDeletingProject
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const currentUserId =
    user?.id || user?._id;

  const projectOwnerId =
    project?.createdBy?._id ||
    project?.createdBy;

  const canManageProject =
    user?.role === "admin" ||
    (
      user?.role === "manager" &&
      projectOwnerId?.toString() ===
        currentUserId?.toString()
    );

  const fetchProject = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(
          `/projects/${id}`
        );

        setProject(data.data.project);

        setTasks(data.data.tasks);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  const fetchEmployees = useCallback(
    async () => {
      if (!canManageProject) {
        return;
      }

      try {
        setLoadingEmployees(true);

        const data = await apiRequest(
          "/users/employees"
        );

        setEmployees(
          data.data.employees
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingEmployees(false);
      }
    },
    [canManageProject]
  );

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (
      project &&
      canManageProject
    ) {
      fetchEmployees();
    }
  }, [
    project,
    canManageProject,
    fetchEmployees
  ]);

  const availableEmployees =
    useMemo(() => {
      const memberIds = new Set(
        (project?.members || []).map(
          (member) => {
            const memberId =
              member?._id || member;

            return memberId?.toString();
          }
        )
      );

      return employees.filter(
        (employee) => {
          return !memberIds.has(
            employee._id.toString()
          );
        }
      );
    }, [
      employees,
      project?.members
    ]);

  const handleAddMember = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedEmployee) {
      setError(
        "Please select an employee"
      );

      return;
    }

    try {
      setSubmittingMember(true);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/projects/${id}/members`,
        {
          method: "POST",

          body: JSON.stringify({
            userId: selectedEmployee
          })
        }
      );

      setProject(
        (previousProject) => ({
          ...previousProject,

          members:
            data.data.project.members
        })
      );

      setSelectedEmployee("");

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (
    memberId
  ) => {
    const confirmed = window.confirm(
      "Remove this employee from the project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/projects/${id}/members/${memberId}`,
        {
          method: "DELETE"
        }
      );

      setProject(
        (previousProject) => ({
          ...previousProject,

          members:
            data.data.project.members
        })
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleTaskFormChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setTaskForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value
      })
    );
  };

  const handleCreateTask = async (
    event
  ) => {
    event.preventDefault();

    if (!taskForm.assignedTo) {
      setError(
        "Please select an employee"
      );

      return;
    }

    try {
      setSubmittingTask(true);
      setError("");
      setMessage("");

      const data = await apiRequest(
        "/tasks",
        {
          method: "POST",

          body: JSON.stringify({
            title: taskForm.title,

            description:
              taskForm.description,

            projectId: id,

            assignedTo:
              taskForm.assignedTo,

            priority:
              taskForm.priority,

            dueDate:
              taskForm.dueDate
          })
        }
      );

      setTasks(
        (previousTasks) => [
          data.data.task,
          ...previousTasks
        ]
      );

      setTaskForm(emptyTaskForm);

      setShowTaskForm(false);

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleTaskStatusChange = async (
    taskId,
    status
  ) => {
    try {
      setUpdatingTaskId(taskId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/tasks/${taskId}/status`,
        {
          method: "PATCH",

          body: JSON.stringify({
            status
          })
        }
      );

      setTasks(
        (previousTasks) => {
          return previousTasks.map(
            (task) => {
              if (task._id === taskId) {
                return data.data.task;
              }

              return task;
            }
          );
        }
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDeleteTask = async (
    taskId
  ) => {
    const confirmed = window.confirm(
      "Delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/tasks/${taskId}`,
        {
          method: "DELETE"
        }
      );

      setTasks(
        (previousTasks) => {
          return previousTasks.filter(
            (task) =>
              task._id !== taskId
          );
        }
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDeleteProject =
    async () => {
      const confirmed =
        window.confirm(
          "Delete this project and all of its tasks?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingProject(true);
        setError("");

        await apiRequest(
          `/projects/${id}`,
          {
            method: "DELETE"
          }
        );

        navigate("/projects");
      } catch (error) {
        setError(error.message);
      } finally {
        setDeletingProject(false);
      }
    };

  if (loading) {
    return (
      <main className="page-center">
        <h2>
          Loading project...
        </h2>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="project-details-page">
        <div className="error-message">
          {error ||
            "Project not found"}
        </div>

        <Link to="/projects">
          Return to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="project-details-page">
      <div className="project-details-navigation">
        <Link to="/projects">
          ← Back to projects
        </Link>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      <section className="project-details-header">
        <div>
          <div className="project-heading-badges">
            <span
              className={`project-status status-${project.status}`}
            >
              {formatStatus(
                project.status
              )}
            </span>

            <span className="project-member-count">
              {project.members?.length ||
                0}{" "}
              members
            </span>
          </div>

          <h1>
            {project.title}
          </h1>

          <p>
            {project.description ||
              "No project description provided."}
          </p>

          <div className="project-detail-meta">
            <span>
              Owner:{" "}
              <strong>
                {
                  project.createdBy
                    ?.name
                }
              </strong>
            </span>

            <span>
              Start:{" "}
              {new Date(
                project.startDate
              ).toLocaleDateString()}
            </span>

            <span>
              Deadline:{" "}
              {new Date(
                project.deadline
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {canManageProject && (
          <button
            type="button"
            className="danger-project-button"
            disabled={
              deletingProject
            }
            onClick={
              handleDeleteProject
            }
          >
            {deletingProject
              ? "Deleting..."
              : "Delete project"}
          </button>
        )}
      </section>

      <section className="project-details-layout">
        <div className="project-main-column">
          <section className="project-section-card">
            <div className="section-heading">
              <div>
                <h2>
                  Project tasks
                </h2>

                <p>
                  Create, assign and
                  track work for this
                  project.
                </p>
              </div>

              {canManageProject && (
                <button
                  type="button"
                  className="primary-action-button"
                  disabled={
                    project.members
                      .length === 0
                  }
                  onClick={() => {
                    setShowTaskForm(
                      (
                        previousValue
                      ) =>
                        !previousValue
                    );
                  }}
                >
                  {showTaskForm
                    ? "Close form"
                    : "Create task"}
                </button>
              )}
            </div>

            {canManageProject &&
              project.members.length ===
                0 && (
                <div className="warning-message">
                  Add a project member
                  before creating a
                  task.
                </div>
              )}

            {showTaskForm &&
              canManageProject && (
                <form
                  className="task-create-form"
                  onSubmit={
                    handleCreateTask
                  }
                >
                  <label>
                    Task title

                    <input
                      name="title"
                      value={
                        taskForm.title
                      }
                      onChange={
                        handleTaskFormChange
                      }
                      placeholder="Enter task title"
                      required
                    />
                  </label>

                  <label>
                    Description

                    <textarea
                      name="description"
                      value={
                        taskForm.description
                      }
                      onChange={
                        handleTaskFormChange
                      }
                      rows="4"
                      placeholder="Describe the work"
                    />
                  </label>

                  <div className="task-form-row">
                    <label>
                      Assign to

                      <select
                        name="assignedTo"
                        value={
                          taskForm.assignedTo
                        }
                        onChange={
                          handleTaskFormChange
                        }
                        required
                      >
                        <option value="">
                          Select employee
                        </option>

                        {project.members.map(
                          (member) => (
                            <option
                              key={
                                member._id
                              }
                              value={
                                member._id
                              }
                            >
                              {
                                member.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Priority

                      <select
                        name="priority"
                        value={
                          taskForm.priority
                        }
                        onChange={
                          handleTaskFormChange
                        }
                      >
                        <option value="low">
                          Low
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="high">
                          High
                        </option>

                        <option value="urgent">
                          Urgent
                        </option>
                      </select>
                    </label>

                    <label>
                      Due date

                      <input
                        type="date"
                        name="dueDate"
                        value={
                          taskForm.dueDate
                        }
                        max={
                          project.deadline
                            ? project.deadline.slice(
                                0,
                                10
                              )
                            : undefined
                        }
                        onChange={
                          handleTaskFormChange
                        }
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      submittingTask
                    }
                  >
                    {submittingTask
                      ? "Creating..."
                      : "Create task"}
                  </button>
                </form>
              )}

            {tasks.length === 0 ? (
              <div className="project-empty-state">
                No tasks have been
                created yet.
              </div>
            ) : (
              <div className="project-task-list">
                {tasks.map(
                  (task) => {
                    const assignedEmployeeId =
                      task
                        .assignedTo
                        ?._id ||
                      task.assignedTo;

                    const isAssignedEmployee =
                      assignedEmployeeId?.toString() ===
                      currentUserId?.toString();

                    const allowedStatuses =
                      getAllowedTaskStatuses(
                        task,
                        user,
                        canManageProject
                      );

                    const isUpdating =
                      updatingTaskId ===
                      task._id;

                    return (
                      <article
                        className="project-task-item"
                        key={
                          task._id
                        }
                      >
                        <div className="project-task-info">
                          <div className="project-task-badges">
                            <span
                              className={`priority priority-${task.priority}`}
                            >
                              {
                                task.priority
                              }
                            </span>

                            <span
                              className={`task-status task-${task.status}`}
                            >
                              {formatStatus(
                                task.status
                              )}
                            </span>
                          </div>

                          <h3>
                            {
                              task.title
                            }
                          </h3>

                          <p>
                            {task.description ||
                              "No task description provided."}
                          </p>

                          <div className="project-task-meta">
                            <span>
                              Assigned
                              to:{" "}
                              <strong>
                                {
                                  task
                                    .assignedTo
                                    ?.name
                                }
                              </strong>
                            </span>

                            <span>
                              Due:{" "}
                              {new Date(
                                task.dueDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="project-task-actions">
                          {allowedStatuses.length >
                          0 ? (
                            <select
                              value={
                                task.status
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) => {
                                handleTaskStatusChange(
                                  task._id,
                                  event
                                    .target
                                    .value
                                );
                              }}
                            >
                              <option
                                value={
                                  task.status
                                }
                              >
                                {formatStatus(
                                  task.status
                                )}
                              </option>

                              {allowedStatuses.map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {formatStatus(
                                      status
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <span className="status-action-message">
                              {task.status ===
                                "under-review" &&
                              user?.role ===
                                "employee" &&
                              isAssignedEmployee
                                ? "Waiting for manager review"
                                : task.status ===
                                    "completed"
                                  ? "Task completed"
                                  : canManageProject &&
                                      task.status ===
                                        "in-progress"
                                    ? "Waiting for employee submission"
                                    : canManageProject &&
                                        task.status ===
                                          "todo"
                                      ? "Waiting for employee to start"
                                      : "No status action available"}
                            </span>
                          )}

                          {canManageProject && (
                            <button
                              type="button"
                              className="task-delete-button"
                              disabled={
                                isUpdating
                              }
                              onClick={() => {
                                handleDeleteTask(
                                  task._id
                                );
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="project-sidebar-column">
          <section className="project-section-card">
            <div className="section-heading">
              <div>
                <h2>Members</h2>

                <p>
                  Employees assigned
                  to this project.
                </p>
              </div>
            </div>

            {canManageProject && (
              <form
                className="member-add-form"
                onSubmit={
                  handleAddMember
                }
              >
                <select
                  value={
                    selectedEmployee
                  }
                  disabled={
                    loadingEmployees ||
                    submittingMember
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedEmployee(
                      event.target
                        .value
                    );
                  }}
                >
                  <option value="">
                    {loadingEmployees
                      ? "Loading employees..."
                      : "Select employee"}
                  </option>

                  {availableEmployees.map(
                    (employee) => (
                      <option
                        key={
                          employee._id
                        }
                        value={
                          employee._id
                        }
                      >
                        {employee.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="submit"
                  disabled={
                    submittingMember ||
                    !selectedEmployee
                  }
                  className="member-add-button"
                >
                  {submittingMember
                    ? "Adding..."
                    : "Add member"}
                </button>
              </form>
            )}

            {canManageProject &&
              !loadingEmployees &&
              availableEmployees.length ===
                0 && (
                <p className="small-muted-text">
                  No additional active
                  employees are
                  available.
                </p>
              )}

            {project.members.length ===
            0 ? (
              <div className="project-empty-state">
                No members added.
              </div>
            ) : (
              <div className="member-list">
                {project.members.map(
                  (member) => (
                    <article
                      className="member-item"
                      key={
                        member._id
                      }
                    >
                      <div className="member-avatar">
                        {member.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="member-details">
                        <strong>
                          {
                            member.name
                          }
                        </strong>

                        <span>
                          {
                            member.email
                          }
                        </span>
                      </div>

                      {canManageProject && (
                        <button
                          type="button"
                          className="member-remove-button"
                          disabled={
                            removingMemberId ===
                            member._id
                          }
                          onClick={() => {
                            handleRemoveMember(
                              member._id
                            );
                          }}
                        >
                          {removingMemberId ===
                          member._id
                            ? "..."
                            : "Remove"}
                        </button>
                      )}
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
};

export default ProjectDetails;