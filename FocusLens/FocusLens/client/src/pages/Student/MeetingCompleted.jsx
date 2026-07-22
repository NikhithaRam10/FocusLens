import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function MeetingCompleted() {
  const { meetingCode } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API}/api/meetings/room/${meetingCode}`, { headers })
      .then((res) => {
        const meetingObj = res.data.meeting;
        setMeeting(meetingObj);
        return axios.get(`${API}/api/meetings/student-report/today`, { headers })
          .then((reportRes) => {
            const reports = reportRes.data;
            if (Array.isArray(reports)) {
              const match = reports.find(
                (r) => r.meetingId === meetingObj?._id
              );
              setReport(match || reports[0] || null);
            } else {
              setReport(reports || null);
            }
          });
      })
      .catch(() => {});

    // refetch with meetingId once meeting is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCode]);

  useEffect(() => {
    if (!meeting?._id) return;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API}/api/meetings/student-report/today`, { headers })
      .then((res) => {
        const reports = Array.isArray(res.data) ? res.data : [res.data];
        const match = reports.find((r) => r.meetingId === meeting._id);
        if (match) setReport(match);
      })
      .catch(() => {});
  }, [meeting]);

  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="page-container">
      <div className="dashboard-shell" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            fontSize: 40,
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          ✓
        </div>

        <h2 className="page-title">Meeting Completed</h2>

        {meeting && (
          <h3 style={{ color: '#fff', marginTop: 8 }}>{meeting.title}</h3>
        )}

        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          The instructor has ended this meeting.
        </p>

        {report ? (
          <div className="ui-card" style={{ marginTop: 24 }}>
            <h3>Your Attentiveness Summary</h3>

            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: getScoreColor(report.averageScore),
                margin: '16px 0 4px',
              }}
            >
              {Math.round(report.averageScore)}%
            </div>

            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Average attentiveness score
            </p>

            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {report.totalEntries} readings captured
            </p>
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 24 }}>
            Your attentiveness data will be available shortly.
          </p>
        )}

        <div style={{ marginTop: 24 }}>
          <button
            className="primary-btn top-left-pill-btn"
            onClick={() => navigate('/student/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
