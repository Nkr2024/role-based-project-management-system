import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Users from "./pages/Users.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFound from "./pages/NotFound.jsx";

import Projects from "./pages/Projects.jsx";
import Tasks from "./pages/Tasks.jsx";
import Requests from "./pages/Requests.jsx";

import Activities from "./pages/Activities.jsx";
import ProjectDetails from "./pages/ProjectDetails.jsx";


const App = () => {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

           <Route
             path="/tasks"
             element={<Tasks />}
           />
           <Route
             path="/requests"
             element={<Requests />}
            />
        </Route>

        <Route
          element={
            <RoleRoute
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/users"
            element={<Users />}
          />

          <Route
           path="/activities"
          element={<Activities />}
         />

        </Route>

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </>
  );
};

export default App;