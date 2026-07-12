import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h2 className="page-title mb-2">Welcome Instructor 👨‍🏫</h2>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", right: 12, top: 6 }}>
          <button
            className="secondary-btn"
            onClick={() => navigate("/")}
          >
            Logout
          </button>
        </div>

        <div className="grid stacked-grid mt-4">

          {/* Create Meeting */}
          <article className="score-card">
            <div className="card-header">
              <div className="card-title">Create Meeting</div>
              <div className="card-score">+ New</div>
            </div>

            <p className="muted card-desc">
              Create a new online class and generate a meeting link to share.
            </p>

            <div className="card-actions">
              <button
                className="primary-btn"
                onClick={() => navigate("/instructor/create-meeting")}
              >
                Create Meeting
              </button>
            </div>
          </article>

          {/* Meetings */}
          <article className="score-card">
            <div className="card-header">
              <div className="card-title">Meetings</div>
              <div className="card-score">📅</div>
            </div>

            <p className="muted card-desc">
              View all meetings you've prepared and start your live sessions.
            </p>

            <div className="card-actions">
              <button
                className="primary-btn"
                onClick={() => navigate("/instructor/meetings")}
              >
                Manage Meetings
              </button>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;