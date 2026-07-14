import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="page-center">
      <div>
        <h1>404</h1>

        <p>The requested page was not found.</p>

        <Link to="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
};

export default NotFound;