import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <h2 className="page-title">Welcome Student</h2>

            <div className="dashboard-shell">
                <div style={{ position: "absolute", right: 12, top: 6 }}>
                    <button className="secondary-btn" onClick={() => navigate("/")}>
                        Logout
                    </button>
                </div>

                <div className="grid stacked-grid mt-4">
                    <article className="score-card">
                        <div className="card-header">
                            <div className="card-title">Join Meeting</div>
                            <div className="card-score">Live</div>
                        </div>
                        <p className="muted card-desc">Jump into your next class with a meeting code.</p>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Meeting Code"
                            />
                        </div>
                        <div className="card-actions" style={{ justifyContent: "flex-start" }}>
                            <button className="primary-btn">Join</button>
                        </div>
                    </article>

                    <article className="score-card">
                        <div className="card-header">
                            <div className="card-title">Today's Attention</div>
                            <div className="card-score">--</div>
                        </div>
                        <p className="muted card-desc">Your current session attention and focus status.</p>
                        <div className="card-actions">
                            <button className="secondary-btn">Refresh</button>
                        </div>
                    </article>

                    <article className="score-card">
                        <div className="card-header">
                            <div className="card-title">Meetings</div>
                            <div className="card-score">📅</div>
                        </div>

                        <p className="muted card-desc">View all available meetings.</p>

                        <div className="card-actions">
                            <button
                                className="primary-btn"
                                onClick={() => navigate("/student/meetings")}
                            >
                                View Meetings
                            </button>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;