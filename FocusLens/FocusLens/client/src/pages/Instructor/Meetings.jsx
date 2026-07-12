import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState("all"); // all, scheduled, active, completed

  useEffect(() => {
  loadMeetings();
}, []);

const loadMeetings = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:5000/api/meetings/my",
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

  const startMeeting = (meeting) => {
  alert(
    `Starting Meeting\n\nMeeting: ${meeting.title}\n\nCode: ${meeting.meetingCode}`
  );

  // Later:
  // navigate(`/meeting/${meeting.meetingCode}`);
};

  const editMeeting = (meeting) => {
  alert(`Edit: ${meeting.title}`);
};

const deleteMeeting = async (meetingId) => {
  console.log("Meeting ID:", meetingId);

  try {
    const token = localStorage.getItem("token");

    const res = await axios.delete(
      `http://localhost:5000/api/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(res.data);

    alert("Meeting Deleted Successfully");

    loadMeetings();

  } catch (err) {
    console.log("DELETE ERROR:", err.response);

    alert(err.response?.data?.message || err.message);
  }
};

  const filteredMeetings = meetings.filter((m) => {
    if (filter === "all") return true;

    return m.status.toLowerCase() === filter;
});

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
            <h2 className="page-title">Your Meetings</h2>
            <p className="muted">Manage all your scheduled sessions and start live classes.</p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="primary-btn" onClick={() => navigate("/instructor/create-meeting")}>
              + New Meeting
            </button>
            <button className="secondary-btn" onClick={() => navigate("/instructor/dashboard")}>
              ← Back
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["all", "scheduled", "active", "completed"].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? "primary-btn" : "secondary-btn"}
              onClick={() => setFilter(tab)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="ui-card">
            <h3>No Meetings Yet</h3>
            <p className="muted">Create your first meeting to get started.</p>
            <button className="primary-btn" onClick={() => navigate("/instructor/create-meeting")}>
              Create Meeting
            </button>
          </div>
        ) : (
          <div className="grid">
            {filteredMeetings.map((meeting) => (
  <div className="score-card" key={meeting._id}>

    <div className="card-header">
      <div>

        <div className="card-title">
          {meeting.title}
        </div>

        <p
          className="muted"
          style={{ marginTop: "4px", marginBottom: 0 }}
        >
          {meeting.subject}
        </p>

      </div>

      <div
        className="card-score"
        style={{
          textTransform: "capitalize",
          fontSize: "12px",
        }}
      >
        {meeting.status}
      </div>
    </div>

    {meeting.scheduledTime && (
      <p className="muted">
        <strong>Scheduled:</strong> {meeting.scheduledTime}
      </p>
    )}

    {meeting.description && (
      <p
        className="muted"
        style={{ fontSize: "14px" }}
      >
        {meeting.description}
      </p>
    )}

    <div
      style={{
        background: "rgba(6,182,212,0.1)",
        padding: "10px",
        borderRadius: "6px",
        marginTop: "12px",
      }}
    >
      <strong>Code:</strong> {meeting.meetingCode}
    </div>

    <div
      className="card-actions"
      style={{ gap: "8px", flexWrap: "wrap" }}
    >

      <button
        className="primary-btn"
        onClick={() => startMeeting(meeting)}
      >
        Start Meeting
      </button>

      <button
        className="secondary-btn"
        onClick={() => editMeeting(meeting)}
      >
        Edit
      </button>

      <button
        className="danger-btn"
        onClick={() => deleteMeeting(meeting._id)}
      >
        Delete
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