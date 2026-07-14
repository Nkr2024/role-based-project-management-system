import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <main className="page-center">
      <section className="status-card">
        <h1>403</h1>

        <h2>Access denied</h2>

        <p>
          You do not have permission to access this
          page.
        </p>

        <Link to="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
};

export default Unauthorized;