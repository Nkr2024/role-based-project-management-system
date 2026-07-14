import {
  useCallback,
  useEffect,
  useState
} from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/api.js";

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: ""
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    pageSize: 10
  });

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(
    async (page = 1) => {
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

        if (filters.role) {
          params.set("role", filters.role);
        }

        if (filters.status) {
          params.set("status", filters.status);
        }

        params.set("page", page);
        params.set("limit", 10);

        const data = await apiRequest(
          `/users?${params.toString()}`
        );

        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previousFilters) => {
      return {
        ...previousFilters,
        [name]: value
      };
    });
  };

  const handleRoleChange = async (
    userId,
    newRole
  ) => {
    try {
      setUpdatingId(userId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/users/${userId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({
            role: newRole
          })
        }
      );

      setUsers((previousUsers) => {
        return previousUsers.map((user) => {
          if (user._id === userId) {
            return data.data.user;
          }

          return user;
        });
      });

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (
    userId,
    newStatus
  ) => {
    try {
      setUpdatingId(userId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/users/${userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: newStatus
          })
        }
      );

      setUsers((previousUsers) => {
        return previousUsers.map((user) => {
          if (user._id === userId) {
            return data.data.user;
          }

          return user;
        });
      });

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    fetchUsers(page);
  };

  return (
    <main className="users-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h1>User management</h1>

          <p>
            Search users, assign roles and control
            account access.
          </p>
        </div>

        <div className="user-count">
          {pagination.totalUsers} users
        </div>
      </div>

      <section className="filter-card">
        <input
          type="search"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name or email"
        />

        <select
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
        >
          <option value="">
            All roles
          </option>

          <option value="admin">
            Admin
          </option>

          <option value="manager">
            Manager
          </option>

          <option value="employee">
            Employee
          </option>
        </select>

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
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

      <section className="table-card">
        {loading ? (
          <div className="table-message">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="table-message">
            No users found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isCurrentUser =
                    user._id === currentUser.id ||
                    user._id === currentUser._id;

                  const isUpdating =
                    updatingId === user._id;

                  return (
                    <tr key={user._id}>
                      <td>
                        <strong>
                          {user.name}
                        </strong>

                        <span className="table-email">
                          {user.email}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`role-badge role-${user.role}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.isActive
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          user.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {isCurrentUser ? (
                          <span className="self-label">
                            Current user
                          </span>
                        ) : (
                          <div className="table-actions">
                            <select
                              value={user.role}
                              disabled={isUpdating}
                              onChange={(event) => {
                                handleRoleChange(
                                  user._id,
                                  event.target.value
                                );
                              }}
                            >
                              <option value="admin">
                                Admin
                              </option>

                              <option value="manager">
                                Manager
                              </option>

                              <option value="employee">
                                Employee
                              </option>
                            </select>

                            <button
                              type="button"
                              disabled={isUpdating}
                              className={
                                user.isActive
                                  ? "danger-button"
                                  : "activate-button"
                              }
                              onClick={() => {
                                handleStatusChange(
                                  user._id,
                                  !user.isActive
                                );
                              }}
                            >
                              {isUpdating
                                ? "Updating..."
                                : user.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          {Math.max(pagination.totalPages, 1)}
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

export default Users;