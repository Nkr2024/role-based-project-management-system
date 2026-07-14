import {
  Link,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link
        to="/dashboard"
        className="brand"
      >
        WorkFlow
      </Link>

      <nav>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">
              Dashboard
            </Link>

            <Link to="/projects">
               Projects
            </Link>

            <Link to="/tasks">
               Tasks
            </Link>

            <Link to="/requests">
              Requests
            </Link>

            {user?.role === "admin" && (
              
              <>

              <Link to="/users">
                Users
              </Link>

              <Link to="/activities">
                Activities
              </Link>

              </>

            )}

            <span className="user-summary">
              {user?.name} · {user?.role}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              Login
            </Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;