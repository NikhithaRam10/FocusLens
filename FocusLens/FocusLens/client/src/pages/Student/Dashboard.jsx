import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const displayName = user?.name || 'Student';
    const [todayReports, setTodayReports] = useState([]);
    const [fetchingReports, setFetchingReports] = useState(false);

    const fetchReports = async () => {
        setFetchingReports(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/student-report/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTodayReports(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingReports(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="page-container">
            <div className="dashboard-shell">
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
                    <h2 className="page-title" style={{ margin: 0, paddingTop: 4 }}>Welcome {displayName}</h2>
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
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                type="text"
                                className="form-input"
                                placeholder="Enter Meeting Code"
                            />
                        </div>
                        <div className="card-actions" style={{ justifyContent: "flex-start" }}>
                            <button className="primary-btn" onClick={async () => {
                                if (!code.trim()) return alert('Enter meeting code');
                                setLoading(true);
                                try {
                                    const token = localStorage.getItem('token');
                                    const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/room/${encodeURIComponent(code.trim())}`, { headers: { Authorization: `Bearer ${token}` } });
                                    const meeting = res.data.meeting;
                                    if (!meeting) return alert('Meeting not found');
                                    if (meeting.status !== 'Active') return alert('Meeting not active');
                                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                                    await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/join-request/${meeting._id}`, { name: user.name || 'Student', email: user.email || '' }, { headers: { Authorization: `Bearer ${token}` } });
                                    alert('Join request sent');
                                    navigate(`/student/live/${meeting.meetingCode}`);
                                } catch (err) {
                                    console.error(err);
                                    alert(err.response?.data?.message || 'Unable to join by code');
                                } finally { setLoading(false); }
                            }} disabled={loading}>{loading ? 'Joining...' : 'Join'}</button>
                        </div>
                    </article>

                    <article className="score-card" style={{ minHeight: 'auto' }}>
                        <div className="card-header">
                            <div className="card-title">Today's Attentiveness Report</div>
                            <div className="card-score">👁</div>
                        </div>
                        <p className="muted card-desc">Your attentiveness average for classes attended today.</p>

                        {fetchingReports ? (
                            <p className="muted">Loading reports...</p>
                        ) : todayReports.length === 0 ? (
                            <p className="muted" style={{ fontStyle: 'italic' }}>No classes attended today yet.</p>
                        ) : (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {todayReports.map((rep, idx) => (
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
                                            <div className="muted" style={{ fontSize: '12px' }}>{rep.meetingSubject || 'No Subject'} • {rep.meetingCode}</div>
                                        </div>
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
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="card-actions" style={{ marginTop: '16px' }}>
                            <button className="secondary-btn" onClick={fetchReports} disabled={fetchingReports}>
                                {fetchingReports ? 'Refreshing...' : 'Refresh'}
                            </button>
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