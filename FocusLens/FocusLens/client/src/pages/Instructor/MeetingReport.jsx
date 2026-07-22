import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function MeetingReport() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/api/meetings/${meetingId}/report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [meetingId]);

  const downloadCSV = (detailed = false) => {
    if (!report || !report.students) return;
    
    let csvRows = [];
    
    if (detailed) {
      csvRows.push(["Student Name", "Student Email", "Timestamp", "Attentiveness Score (%)"]);
      report.students.forEach(s => {
        (s.logs || []).forEach(log => {
          const time = new Date(log.timestamp).toLocaleString();
          csvRows.push([s.name, s.email, time, log.score]);
        });
      });
    } else {
      csvRows.push(["Student Name", "Student Email", "Average Attentiveness (%)", "Total Logs"]);
      report.students.forEach(s => {
        csvRows.push([s.name, s.email, Math.round(s.avgScore ?? 0), (s.logs || []).length]);
      });
    }
    
    const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `${meeting?.title || 'meeting'}_report_${detailed ? 'detailed' : 'summary'}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const scoreColor = (s) => (s >= 70 ? '#22c55e' : s >= 40 ? '#eab308' : '#ef4444');

  const badgeStyle = (avg) => ({
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: scoreColor(avg),
  });

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
  };

  const tdStyle = {
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: 13,
    color: '#cbd5e1',
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-shell">
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="dashboard-shell">
          <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 80 }}>{error}</p>
        </div>
      </div>
    );
  }

  const { meeting, students } = report || {};

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="room-header" style={{ position: 'relative', paddingTop: 48 }}>
          <button
            className="primary-btn top-left-pill-btn"
            style={{ position: 'absolute', top: 0, left: 0 }}
            onClick={() => navigate('/instructor/meetings')}
          >
            ← Back
          </button>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {meeting?.title || 'Meeting Report'}
          </h1>
          {meeting?.subject && (
            <p style={{ color: '#94a3b8', fontSize: 15, margin: '2px 0' }}>Subject: {meeting.subject}</p>
          )}
          {meeting?.meetingCode && (
            <p style={{ color: '#94a3b8', fontSize: 15, margin: '2px 0' }}>Code: {meeting.meetingCode}</p>
          )}
          {meeting?.date && (
            <p style={{ color: '#64748b', fontSize: 14, margin: '2px 0' }}>
              {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          {!students || students.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>
              No attentiveness data recorded for this meeting.
            </p>
          ) : (
            students.map((s, idx) => (
              <div className="ui-card" key={idx} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{s.name}</span>
                    <span style={{ color: '#64748b', fontSize: 13, marginLeft: 10 }}>{s.email}</span>
                  </div>
                  <div style={badgeStyle(s.avgScore ?? 0)}>
                    {Math.round(s.avgScore ?? 0)}%
                  </div>
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Time</th>
                        <th style={thStyle}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(s.logs || []).map((log, i) => (
                        <tr key={i}>
                          <td style={tdStyle}>{i + 1}</td>
                          <td style={tdStyle}>{formatTime(log.timestamp)}</td>
                          <td style={{ ...tdStyle, color: scoreColor(log.score), fontWeight: 600 }}>
                            {log.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingReport;
