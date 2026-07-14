import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/api.js";

const formatLabel = (value) => {
  return value
    .replace(/([A-Z])/g, " $1")
    .replaceAll("-", " ")
    .replace(/^./, (character) =>
      character.toUpperCase()
    );
};

const Dashboard = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(
          "/dashboard"
        );

        setDashboard(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <main className="page-center">
        <h2>Loading dashboard...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="error-message">
          {error}
        </div>
      </main>
    );
  }

  const statistics =
    dashboard?.statistics || {};

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">
            {user?.role} dashboard
          </p>

          <h1>
            Welcome, {user?.name}
          </h1>

          <p>
            Here is the latest overview of your
            workspace.
          </p>
        </div>

        <span className="dashboard-role">
          {user?.role}
        </span>
      </section>

      <section className="statistics-grid">
        {Object.entries(statistics).map(
          ([key, value]) => {
            const isPercentage =
              key
                .toLowerCase()
                .includes("rate");

            return (
              <article
                className="statistic-card"
                key={key}
              >
                <span>
                  {formatLabel(key)}
                </span>

                <strong>
                  {value}
                  {isPercentage ? "%" : ""}
                </strong>
              </article>
            );
          }
        )}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>

            {user?.role === "admin" && (
              <Link to="/activities">
                View all
              </Link>
            )}
          </div>

          {dashboard?.recentActivities
            ?.length ? (
            <div className="activity-list">
              {dashboard.recentActivities.map(
                (activity) => (
                  <div
                    className="activity-item"
                    key={activity._id}
                  >
                    <div className="activity-marker" />

                    <div>
                      <p>
                        {activity.description}
                      </p>

                      <span>
                        {new Date(
                          activity.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="empty-text">
              No recent activity.
            </p>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <h2>Quick actions</h2>
          </div>

          <div className="quick-actions">
            <Link
              to="/projects"
              className="quick-action-link"
            >
              View projects
            </Link>

            <Link
              to="/tasks"
              className="quick-action-link"
            >
              View tasks
            </Link>

            <Link
              to="/requests"
              className="quick-action-link"
            >
              {user?.role === "employee"
                ? "Submit request"
                : "Review requests"}
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/users"
                className="quick-action-link"
              >
                Manage users
              </Link>
            )}
          </div>
        </article>
      </section>

      {dashboard?.recentTasks?.length > 0 && (
        <section className="dashboard-panel dashboard-wide-panel">
          <div className="panel-heading">
            <h2>Recent tasks</h2>

            <Link to="/tasks">
              View all
            </Link>
          </div>

          <div className="dashboard-task-list">
            {dashboard.recentTasks.map(
              (task) => (
                <article
                  className="dashboard-task"
                  key={task._id}
                >
                  <div>
                    <strong>
                      {task.title}
                    </strong>

                    <span>
                      {task.project?.title ||
                        "Project"}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`priority priority-${task.priority}`}
                    >
                      {task.priority}
                    </span>

                    <span
                      className={`task-status task-${task.status}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      )}

      {dashboard?.recentProjects?.length >
        0 && (
        <section className="dashboard-panel dashboard-wide-panel">
          <div className="panel-heading">
            <h2>Recent projects</h2>

            <Link to="/projects">
              View all
            </Link>
          </div>

          <div className="dashboard-project-list">
            {dashboard.recentProjects.map(
              (project) => (
                <Link
                  to={`/projects/${project._id}`}
                  className="dashboard-project"
                  key={project._id}
                >
                  <div>
                    <strong>
                      {project.title}
                    </strong>

                    <span>
                      {project.members?.length ||
                        0}{" "}
                      members
                    </span>
                  </div>

                  <span
                    className={`project-status status-${project.status}`}
                  >
                    {project.status}
                  </span>
                </Link>
              )
            )}
          </div>
        </section>
      )}

      {dashboard?.recentRequests?.length >
        0 && (
        <section className="dashboard-panel dashboard-wide-panel">
          <div className="panel-heading">
            <h2>Recent requests</h2>

            <Link to="/requests">
              View all
            </Link>
          </div>

          <div className="dashboard-request-list">
            {dashboard.recentRequests.map(
              (request) => (
                <article
                  className="dashboard-request"
                  key={request._id}
                >
                  <div>
                    <strong>
                      {request.title}
                    </strong>

                    <span>
                      {formatLabel(
                        request.requestType
                      )}
                    </span>
                  </div>

                  <span
                    className={`request-status request-${request.status}`}
                  >
                    {request.status}
                  </span>
                </article>
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default Dashboard;