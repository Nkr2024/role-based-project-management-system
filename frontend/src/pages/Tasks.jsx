import {
  useCallback,
  useEffect,
  useState
} from "react";

import { apiRequest } from "../utils/api.js";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  const fetchTasks = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        const data = await apiRequest(
          `/tasks?${params.toString()}`
        );

        setTasks(data.data.tasks);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = async (
    taskId,
    newStatus
  ) => {
    try {
      setUpdatingId(taskId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/tasks/${taskId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      setTasks((previousTasks) => {
        return previousTasks.map(
          (task) => {
            if (task._id === taskId) {
              return data.data.task;
            }

            return task;
          }
        );
      });

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="tasks-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Work assigned to you
          </p>

          <h1>Tasks</h1>

          <p>
            Track and update task progress.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value
            );
          }}
        >
          <option value="">
            All statuses
          </option>

          <option value="todo">
            Todo
          </option>

          <option value="in-progress">
            In progress
          </option>

          <option value="under-review">
            Under review
          </option>

          <option value="completed">
            Completed
          </option>
        </select>
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

      {loading ? (
        <div className="table-message">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-card">
          No tasks found.
        </div>
      ) : (
        <section className="task-grid">
          {tasks.map((task) => (
            <article
              className="task-card"
              key={task._id}
            >
              <div className="task-card-top">
                <span
                  className={`priority priority-${task.priority}`}
                >
                  {task.priority}
                </span>

                <span>
                  {task.project?.title}
                </span>
              </div>

              <h2>{task.title}</h2>

              <p>
                {task.description ||
                  "No description provided."}
              </p>

              <p>
                Due:{" "}
                {new Date(
                  task.dueDate
                ).toLocaleDateString()}
              </p>

              <select
                value={task.status}
                disabled={
                  updatingId === task._id
                }
                onChange={(event) => {
                  updateStatus(
                    task._id,
                    event.target.value
                  );
                }}
              >
                <option value="todo">
                  Todo
                </option>

                <option value="in-progress">
                  In progress
                </option>

                <option value="under-review">
                  Under review
                </option>

                <option value="completed">
                  Completed
                </option>
              </select>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Tasks;