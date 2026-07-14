import {
  Navigate,
  Outlet
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const RoleRoute = ({ allowedRoles }) => {
  const {
    user,
    loading,
    isAuthenticated
  } = useAuth();

  if (loading) {
    return (
      <div className="page-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
};

export default RoleRoute;