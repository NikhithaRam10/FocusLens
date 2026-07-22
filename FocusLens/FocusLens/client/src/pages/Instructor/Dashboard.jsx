import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = user?.name || 'Instructor';
  const [reports, setReports] = useState([]);
  const [fetchingReports, setFetchingReports] = useState(false);

  const fetchReports = async () => {
    setFetchingReports(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/instructor/reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setFetchingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="page-container">
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative", paddingTop: 44, marginBottom: 16 }}>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}>
            <i className="bi bi-box-arrow-left"></i> Logout
          </button>
          <h2 className="page-title mb-2" style={{ margin: 0, paddingTop: 4 }}>Welcome {displayName}</h2>
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

          {/* Attentiveness Reports */}
          <article className="score-card" style={{ minHeight: 'auto' }}>
            <div className="card-header">
              <div className="card-title">Class Attentiveness Reports</div>
              <div className="card-score">📊</div>
            </div>
            <p className="muted card-desc">
              View attentiveness reports and student engagement for your sessions.
            </p>

            {fetchingReports ? (
              <p className="muted">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="muted" style={{ fontStyle: 'italic' }}>No meetings created yet.</p>
            ) : (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reports.map((rep, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{rep.meetingTitle}</div>
                      <div className="muted" style={{ fontSize: '12px' }}>
                        {rep.meetingSubject || 'No Subject'} • {rep.meetingCode} • {new Date(rep.date).toLocaleDateString()}
                      </div>
                      <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {rep.studentCount} student(s) attended
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {rep.averageScore !== null ? (
                        <div style={{
                          background: rep.averageScore >= 70 ? 'rgba(34,197,94,0.15)' : rep.averageScore >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                          color: rep.averageScore >= 70 ? '#22c55e' : rep.averageScore >= 40 ? '#eab308' : '#ef4444',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}>
                          {Math.round(rep.averageScore)}%
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#94a3b8',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          No Data
                        </div>
                      )}
                      <button 
                        className="primary-btn" 
                        style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'auto', borderRadius: '6px' }}
                        onClick={() => navigate(`/instructor/reports/${rep.meetingId}`)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="card-actions" style={{ marginTop: '16px' }}>
              <button className="secondary-btn" onClick={fetchReports} disabled={fetchingReports} style={{ padding: '8px 16px', fontSize: '13px' }}>
                {fetchingReports ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;