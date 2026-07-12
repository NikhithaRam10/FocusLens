import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiShare2 } from "react-icons/fi";
import axios from "axios";

function CreateMeeting() {
  const navigate = useNavigate();
  const [meetingName, setMeetingName] = useState("");
  const [subject, setSubject] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [description, setDescription] = useState("");

  const [meetingCode] = useState(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  });

  const [meetingLink] = useState(() => {
    const id = Math.random().toString(36).substring(2, 10);
    return `http://localhost:5173/meet/${id}`;
  });

  const copyCode = () => {
    navigator.clipboard.writeText(meetingCode);
    alert("Meeting Code Copied!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    alert("Meeting Link Copied!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FocusLens Meeting",
          text: `Join my meeting: ${meetingName}`,
          url: meetingLink,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(meetingLink);
      alert("Sharing isn't supported. Link copied instead.");
    }
  };

const handleCreateMeeting = async () => {

  if (!meetingName || !subject) {
    alert("Please fill in Meeting Name and Subject.");
    return;
  }

  try {

    const token = localStorage.getItem("token");

    const res = await axios.post(
      "http://localhost:5000/api/meetings/create",
      {
        title: meetingName,
        subject,
        description,
        scheduledTime,
        meetingCode,
        meetingLink,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(res.data.message);

    navigate("/instructor/meetings");

  } catch (err) {

    console.error(err);

    alert(
      err.response?.data?.message ||
      "Unable to create meeting."
    );

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
            <h2 className="page-title">Create a New Meeting</h2>
            <p className="muted">Prepare a live session and generate the meeting details to share.</p>
          </div>

          <button className="secondary-btn" onClick={() => navigate("/instructor/meetings")}>
            ← Back
          </button>
        </div>

        <div className="ui-card" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Left Column - Form */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Meeting Details</h3>

              <label className="muted" style={{ display: "block", marginBottom: "8px" }}>
                Meeting Name *
              </label>
              <input
                className="form-input mb-3"
                placeholder="e.g., AI Workshop Session 1"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
              />

              <label className="muted" style={{ display: "block", marginBottom: "8px" }}>
                Subject *
              </label>
              <input
                className="form-input mb-3"
                placeholder="e.g., Computer Vision Basics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <label className="muted" style={{ display: "block", marginBottom: "8px" }}>
                Scheduled Time
              </label>
              <input
                className="form-input mb-3"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />

              <label className="muted" style={{ display: "block", marginBottom: "8px" }}>
                Description
              </label>
              <textarea
                className="form-input mb-3"
                placeholder="Add any additional details about this meeting..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>

            {/* Right Column - Preview */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Meeting Details Preview</h3>

              <div
                style={{
                  background: "rgba(6, 182, 212, 0.1)",
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ marginBottom: "12px" }}>
                  <strong>Meeting Code:</strong>
                </p>
                <div
                  style={{
                    background: "#1f2937",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#06b6d4", fontWeight: "600", fontSize: "18px" }}>
                    {meetingCode}
                  </span>
                  <button className="secondary-btn" onClick={copyCode} style={{ padding: "6px 12px" }}>
                    Copy
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(124, 58, 237, 0.1)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <p style={{ marginBottom: "12px" }}>
                  <strong>Meeting Link:</strong>
                </p>
                <div style={{ marginBottom: "12px" }}>
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    style={{
                      width: "100%",
                      background: "#1f2937",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      padding: "10px",
                      borderRadius: "6px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      wordBreak: "break-all",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="secondary-btn" onClick={copyLink} style={{ flex: 1, padding: "8px" }}>
                    <FiCopy /> Copy
                  </button>
                  <button className="secondary-btn" onClick={shareLink} style={{ flex: 1, padding: "8px" }}>
                    <FiShare2 /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
            <button className="primary-btn" onClick={handleCreateMeeting}>
  Create Meeting
</button>
            <button className="secondary-btn" onClick={() => navigate("/instructor/meetings")}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateMeeting;