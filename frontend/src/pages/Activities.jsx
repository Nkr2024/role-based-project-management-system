import {
  useCallback,
  useEffect,
  useState
} from "react";

import { apiRequest } from "../utils/api.js";

const Activities = () => {
  const [activities, setActivities] =
    useState([]);

  const [filters, setFilters] =
    useState({
      entityType: "",
      action: ""
    });

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      totalPages: 1,
      totalActivities: 0
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchActivities = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (filters.entityType) {
          params.set(
            "entityType",
            filters.entityType
          );
        }

        if (filters.action.trim()) {
          params.set(
            "action",
            filters.action.trim()
          );
        }

        params.set("page", page);
        params.set("limit", 15);

        const data = await apiRequest(
          `/activities?${params.toString()}`
        );

        setActivities(
          data.data.activities
        );

        setPagination(
          data.data.pagination
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  const handleFilterChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFilters(
      (previousFilters) => ({
        ...previousFilters,
        [name]: value
      })
    );
  };

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    fetchActivities(page);
  };

  return (
    <main className="activities-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            System audit
          </p>

          <h1>Activity logs</h1>

          <p>
            Review important changes performed
            across the system.
          </p>
        </div>

        <div className="user-count">
          {pagination.totalActivities || 0}{" "}
          activities
        </div>
      </div>

      <section className="filter-card activity-filters">
        <select
          name="entityType"
          value={filters.entityType}
          onChange={handleFilterChange}
        >
          <option value="">
            All entity types
          </option>

          <option value="user">
            User
          </option>

          <option value="project">
            Project
          </option>

          <option value="task">
            Task
          </option>

          <option value="request">
            Request
          </option>

          <option value="authentication">
            Authentication
          </option>
        </select>

        <input
          type="search"
          name="action"
          value={filters.action}
          onChange={handleFilterChange}
          placeholder="Search action"
        />
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="activity-page-card">
        {loading ? (
          <div className="table-message">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="table-message">
            No activity logs found.
          </div>
        ) : (
          <div className="activity-page-list">
            {activities.map(
              (activity) => (
                <article
                  className="activity-page-item"
                  key={activity._id}
                >
                  <div className="activity-icon">
                    {activity.entityType
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="activity-page-content">
                    <p>
                      {activity.description}
                    </p>

                    <div className="activity-details">
                      <span>
                        By:{" "}
                        {activity.performedBy
                          ?.name ||
                          "Unknown user"}
                      </span>

                      <span>
                        Role:{" "}
                        {activity.performedBy
                          ?.role ||
                          "Unknown"}
                      </span>

                      <span>
                        Type:{" "}
                        {activity.entityType}
                      </span>

                      <span>
                        {new Date(
                          activity.createdAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span className="activity-action">
                    {activity.action.replaceAll(
                      "_",
                      " "
                    )}
                  </span>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <div className="pagination">
        <button
          type="button"
          disabled={
            pagination.currentPage <= 1 ||
            loading
          }
          onClick={() => {
            goToPage(
              pagination.currentPage - 1
            );
          }}
        >
          Previous
        </button>

        <span>
          Page {pagination.currentPage} of{" "}
          {Math.max(
            pagination.totalPages,
            1
          )}
        </span>

        <button
          type="button"
          disabled={
            pagination.currentPage >=
              pagination.totalPages ||
            loading
          }
          onClick={() => {
            goToPage(
              pagination.currentPage + 1
            );
          }}
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default Activities;