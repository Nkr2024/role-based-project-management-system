import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => {
      return {
        ...previousData,
        [name]: value
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Email and password are required"
      );

      return;
    }

    try {
      setSubmitting(true);

      await login({
        email: formData.email.trim(),
        password: formData.password
      });

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Welcome back</h1>

        <p className="subtitle">
          Login to continue to your dashboard.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="primary-button"
          >
            {submitting
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="auth-link">
          Do not have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Login;