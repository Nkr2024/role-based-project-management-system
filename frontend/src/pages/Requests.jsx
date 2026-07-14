import {
  useCallback,
  useEffect,
  useState
} from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/api.js";

const emptyForm = {
  requestType: "leave",
  title: "",
  reason: "",
  startDate: "",
  endDate: "",
  amount: ""
};

const Requests = () => {
  const { user } = useAuth();

  const [requests, setRequests] =
    useState([]);

  const [filters, setFilters] =
    useState({
      status: "",
      requestType: ""
    });

  const [formData, setFormData] =
    useState(emptyForm);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [reviewComments, setReviewComments] =
    useState({});

  const isEmployee =
    user?.role === "employee";

  const canReview =
    user?.role === "admin" ||
    user?.role === "manager";

  const fetchRequests = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        if (filters.status) {
          params.set(
            "status",
            filters.status
          );
        }

        if (filters.requestType) {
          params.set(
            "requestType",
            filters.requestType
          );
        }

        const data = await apiRequest(
          `/requests?${params.toString()}`
        );

        setRequests(
          data.data.requests
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
    fetchRequests();
  }, [fetchRequests]);

  const handleFormChange = (event) => {
    const {
      name,
      value
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value
      })
    );
  };

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

  const createRequest = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = {
        requestType:
          formData.requestType,
        title: formData.title,
        reason: formData.reason
      };

      if (
        formData.requestType ===
          "leave" ||
        formData.requestType ===
          "work-from-home"
      ) {
        payload.startDate =
          formData.startDate;

        payload.endDate =
          formData.endDate;
      }

      if (
        formData.requestType ===
        "expense"
      ) {
        payload.amount =
          Number(formData.amount);
      }

      const data = await apiRequest(
        "/requests",
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

      setRequests(
        (previousRequests) => [
          data.data.request,
          ...previousRequests
        ]
      );

      setFormData(emptyForm);
      setShowForm(false);
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewRequest = async (
    requestId,
    status
  ) => {
    try {
      setUpdatingId(requestId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/requests/${requestId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            reviewerComment:
              reviewComments[
                requestId
              ] || ""
          })
        }
      );

      setRequests(
        (previousRequests) => {
          return previousRequests.map(
            (request) => {
              if (
                request._id ===
                requestId
              ) {
                return data.data.request;
              }

              return request;
            }
          );
        }
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelRequest = async (
    requestId
  ) => {
    try {
      setUpdatingId(requestId);
      setError("");
      setMessage("");

      const data = await apiRequest(
        `/requests/${requestId}/cancel`,
        {
          method: "PATCH"
        }
      );

      setRequests(
        (previousRequests) => {
          return previousRequests.map(
            (request) => {
              if (
                request._id ===
                requestId
              ) {
                return data.data.request;
              }

              return request;
            }
          );
        }
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Approval workflow
          </p>

          <h1>
            {isEmployee
              ? "My requests"
              : "Approval requests"}
          </h1>

          <p>
            {isEmployee
              ? "Submit and track your workplace requests."
              : "Review employee requests and record decisions."}
          </p>
        </div>

        {isEmployee && (
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
              : "New request"}
          </button>
        )}
      </div>

      {showForm && isEmployee && (
        <form
          className="request-form"
          onSubmit={createRequest}
        >
          <label>
            Request type

            <select
              name="requestType"
              value={
                formData.requestType
              }
              onChange={
                handleFormChange
              }
            >
              <option value="leave">
                Leave
              </option>

              <option value="work-from-home">
                Work from home
              </option>

              <option value="equipment">
                Equipment
              </option>

              <option value="expense">
                Expense
              </option>
            </select>
          </label>

          <label>
            Title

            <input
              name="title"
              value={formData.title}
              onChange={
                handleFormChange
              }
              placeholder="Enter request title"
              required
            />
          </label>

          <label>
            Reason

            <textarea
              name="reason"
              value={formData.reason}
              onChange={
                handleFormChange
              }
              placeholder="Explain your request"
              rows="5"
              required
            />
          </label>

          {(formData.requestType ===
            "leave" ||
            formData.requestType ===
              "work-from-home") && (
            <div className="date-row">
              <label>
                Start date

                <input
                  type="date"
                  name="startDate"
                  value={
                    formData.startDate
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />
              </label>

              <label>
                End date

                <input
                  type="date"
                  name="endDate"
                  value={
                    formData.endDate
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />
              </label>
            </div>
          )}

          {formData.requestType ===
            "expense" && (
            <label>
              Amount

              <input
                type="number"
                name="amount"
                min="1"
                value={formData.amount}
                onChange={
                  handleFormChange
                }
                placeholder="Enter amount"
                required
              />
            </label>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="primary-button"
          >
            {submitting
              ? "Submitting..."
              : "Submit request"}
          </button>
        </form>
      )}

      <section className="filter-card request-filters">
        <select
          name="status"
          value={filters.status}
          onChange={
            handleFilterChange
          }
        >
          <option value="">
            All statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <select
          name="requestType"
          value={
            filters.requestType
          }
          onChange={
            handleFilterChange
          }
        >
          <option value="">
            All request types
          </option>

          <option value="leave">
            Leave
          </option>

          <option value="work-from-home">
            Work from home
          </option>

          <option value="equipment">
            Equipment
          </option>

          <option value="expense">
            Expense
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
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-card">
          No requests found.
        </div>
      ) : (
        <section className="request-grid">
          {requests.map((request) => {
            const isUpdating =
              updatingId === request._id;

            return (
              <article
                className="request-card"
                key={request._id}
              >
                <div className="request-card-header">
                  <span
                    className={`request-status request-${request.status}`}
                  >
                    {request.status}
                  </span>

                  <span className="request-type">
                    {request.requestType.replaceAll(
                      "-",
                      " "
                    )}
                  </span>
                </div>

                <h2>
                  {request.title}
                </h2>

                {!isEmployee && (
                  <p>
                    Requested by:{" "}
                    <strong>
                      {
                        request
                          .requestedBy
                          ?.name
                      }
                    </strong>
                  </p>
                )}

                <p>
                  {request.reason}
                </p>

                {(request.startDate ||
                  request.endDate) && (
                  <p>
                    Dates:{" "}
                    {request.startDate
                      ? new Date(
                          request.startDate
                        ).toLocaleDateString()
                      : "-"}
                    {" — "}
                    {request.endDate
                      ? new Date(
                          request.endDate
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                )}

                {request.amount !== null &&
                  request.amount !==
                    undefined && (
                    <p>
                      Amount: ₹
                      {request.amount}
                    </p>
                  )}

                <p className="request-created">
                  Submitted:{" "}
                  {new Date(
                    request.createdAt
                  ).toLocaleDateString()}
                </p>

                {request.reviewedBy && (
                  <div className="review-summary">
                    <p>
                      Reviewed by:{" "}
                      {
                        request.reviewedBy
                          .name
                      }
                    </p>

                    {request.reviewerComment && (
                      <p>
                        Comment:{" "}
                        {
                          request.reviewerComment
                        }
                      </p>
                    )}
                  </div>
                )}

                {canReview &&
                  request.status ===
                    "pending" && (
                    <div className="review-controls">
                      <textarea
                        rows="3"
                        value={
                          reviewComments[
                            request._id
                          ] || ""
                        }
                        onChange={(
                          event
                        ) => {
                          setReviewComments(
                            (
                              previousComments
                            ) => ({
                              ...previousComments,
                              [request._id]:
                                event.target
                                  .value
                            })
                          );
                        }}
                        placeholder="Add review comment"
                      />

                      <div className="review-buttons">
                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          className="approve-button"
                          onClick={() => {
                            reviewRequest(
                              request._id,
                              "approved"
                            );
                          }}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            isUpdating
                          }
                          className="reject-button"
                          onClick={() => {
                            reviewRequest(
                              request._id,
                              "rejected"
                            );
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                {isEmployee &&
                  request.status ===
                    "pending" && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      className="cancel-button"
                      onClick={() => {
                        cancelRequest(
                          request._id
                        );
                      }}
                    >
                      {isUpdating
                        ? "Cancelling..."
                        : "Cancel request"}
                    </button>
                  )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default Requests;