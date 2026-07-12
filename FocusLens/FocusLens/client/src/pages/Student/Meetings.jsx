import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    loadMeetings();
}, []);

const loadMeetings = async () => {
    try {

        const token = localStorage.getItem("token");

        const res = await axios.get(
            "http://localhost:5000/api/meetings/all",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        setMeetings(res.data);

    } catch (err) {

        console.error(err);

        alert("Unable to load meetings");

    }
};

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            gap: "12px",
          }}
        >
          <div>
            <h2 className="page-title">Available Meetings</h2>
            <p className="muted">Browse your class sessions and join when they are live.</p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/student/dashboard")}>
            ← Back
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="ui-card">
            <h3>No Meetings Available</h3>
            <p className="muted">No instructor has created a meeting yet.</p>
          </div>
        ) : (
          <div className="grid stacked-grid">
            {meetings.map((meeting) => (
              <div className="score-card" key={meeting._id}>
                <div className="card-header">
                  <div className="card-title">{meeting.title}</div>
                  <div className="card-score">Live</div>
                </div>

                <p className="muted">
                  <strong>Subject:</strong> {meeting.subject}
                </p>

                <p style={{ marginTop: "12px", wordBreak: "break-all" }}>{meeting.meetingLink}</p>

                <div className="card-actions" style={{ marginTop: "18px" }}>
                  <button
                    className="primary-btn"
                    onClick={() =>
                      window.open(meeting.meetingLink, "_blank")
                    }
                  >
                    Join Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Meetings;