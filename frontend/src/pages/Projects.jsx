import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/api.js";

const Projects = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    status: ""
  });

  const [showForm, setShowForm] =
    useState(false);

  const [formData, setFormData] =
    useState({
      title: "",
      description: "",
      status: "planned",
      startDate: "",
      deadline: ""
    });

  const canCreateProject =
    user?.role === "admin" ||
    user?.role === "manager";

  const fetchProjects = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (filters.search.trim()) {
          params.set(
            "search",
            filters.search.trim()
          );
        }

        if (filters.status) {
          params.set(
            "status",
            filters.status
          );
        }

        const data = await apiRequest(
          `/projects?${params.toString()}`
        );

        setProjects(data.data.projects);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value
    }));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleCreateProject = async (
    event
  ) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const data = await apiRequest(
        "/projects",
        {
          method: "POST",
          body: JSON.stringify(formData)
        }
      );

      setProjects((previousProjects) => [
        data.data.project,
        ...previousProjects
      ]);

      setFormData({
        title: "",
        description: "",
        status: "planned",
        startDate: "",
        deadline: ""
      });

      setShowForm(false);
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="projects-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Project workspace
          </p>

          <h1>Projects</h1>

          <p>
            View projects and monitor their
            current progress.
          </p>
        </div>

        {canCreateProject && (
          <button
            type="button"
            className="primary-action-button"
            onClick={() => {
              setShowForm(
                (previousValue) =>
                  !previousValue
              );
            }}
          >
            {showForm
              ? "Close form"
              : "Create project"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          className="project-form"
          onSubmit={handleCreateProject}
        >
          <input
            name="title"
            value={formData.title}
            onChange={handleFormChange}
            placeholder="Project title"
            required
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            placeholder="Project description"
            rows="4"
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleFormChange}
          >
            <option value="planned">
              Planned
            </option>

            <option value="in-progress">
              In progress
            </option>

            <option value="on-hold">
              On hold
            </option>

            <option value="completed">
              Completed
            </option>
          </select>

          <label>
            Start date

            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleFormChange}
            />
          </label>

          <label>
            Deadline

            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleFormChange}
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button"
          >
            Create project
          </button>
        </form>
      )}

      <section className="filter-card project-filters">
        <input
          type="search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search projects"
        />

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">
            All statuses
          </option>

          <option value="planned">
            Planned
          </option>

          <option value="in-progress">
            In progress
          </option>

          <option value="on-hold">
            On hold
          </option>

          <option value="completed">
            Completed
          </option>
        </select>
      </section>

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
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-card">
          No projects found.
        </div>
      ) : (
        <section className="project-grid">
          {projects.map((project) => (
            <article
              className="project-card"
              key={project._id}
            >
              <div className="project-card-top">
                <span
                  className={`project-status status-${project.status}`}
                >
                  {project.status}
                </span>

                <span>
                  {
                    project.members
                      ?.length
                  }{" "}
                  members
                </span>
              </div>

              <h2>{project.title}</h2>

              <p>
                {project.description ||
                  "No description provided."}
              </p>

              <div className="project-meta">
                <span>
                  Owner:{" "}
                  {project.createdBy?.name}
                </span>

                <span>
                  Deadline:{" "}
                  {new Date(
                    project.deadline
                  ).toLocaleDateString()}
                </span>
              </div>

              <Link
                to={`/projects/${project._id}`}
                className="project-link"
              >
                View project
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Projects;