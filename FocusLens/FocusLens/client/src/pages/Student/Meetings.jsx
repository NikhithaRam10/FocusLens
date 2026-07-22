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
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/all`,
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

  const joinMeeting = async (meeting) => {

    if (meeting.status !== "Active") {
      alert("This meeting has not been started yet.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || '{}');

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/join-request/${meeting._id}`,
        {
          name: user.name || "Student",
          email: user.email || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Your join request has been sent to the instructor.");
      navigate(`/student/live/${meeting.meetingCode}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to request meeting access.");
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-shell">

        <div
          style={{
            position: "relative",
            paddingTop: "48px",
            marginBottom: "24px",
            minHeight: "70px",
          }}
        >
          <button
            className="primary-btn top-left-pill-btn"
            style={{ position: "absolute", top: 0, left: 0 }}
            onClick={() => navigate("/student/dashboard")}
          >
            ← Back
          </button>

          <div style={{ paddingTop: "4px" }}>
            <h2 className="page-title">Available Meetings</h2>
            <p className="muted">
              Browse your class sessions and join when they are live.
            </p>
          </div>
        </div>

        {meetings.length === 0 ? (
          <div className="ui-card">
            <h3>No Meetings Available</h3>
            <p className="muted">
              No instructor has created any meetings yet.
            </p>
          </div>
        ) : (
          <div className="grid stacked-grid">
            {meetings.map((meeting) => (
              <div className="score-card" key={meeting._id}>

                <div className="card-header">

                  <div>
                    <div className="card-title">
                      {meeting.title}
                    </div>

                    <p className="muted">
                      {meeting.subject}
                    </p>
                  </div>

                  <div className="card-score">
                    {meeting.status}
                  </div>

                </div>

                {meeting.description && (
                  <p className="muted">
                    {meeting.description}
                  </p>
                )}

                <p>
                  <strong>Meeting Code:</strong>{" "}
                  {meeting.meetingCode}
                </p>

                <p>
                  <strong>Scheduled:</strong>{" "}
                  {meeting.scheduledTime}
                </p>

                <div
                  className="card-actions"
                  style={{ marginTop: "20px" }}
                >
                  <button
                    className="primary-btn"
                    onClick={() => joinMeeting(meeting)}
                    disabled={meeting.status !== "Active"}
                  >
                    {meeting.status === "Active"
                      ? "Join Meeting"
                      : "Waiting"}
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