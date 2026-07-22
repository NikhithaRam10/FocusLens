import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function JoinMeeting() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return alert('Please enter a meeting code.');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/room/${encodeURIComponent(code.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const meeting = res.data.meeting;
      if (!meeting) {
        alert('Meeting not found for the provided code.');
        setLoading(false);
        return;
      }

      if (meeting.status !== 'Active') {
        alert('Meeting is not active yet. You can only join active meetings.');
        setLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/join-request/${meeting._id}`,
        { name: user.name || 'Student', email: user.email || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Join request sent. You will be taken to the classroom.');
      navigate(`/student/live/${meeting.meetingCode}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Unable to find or join meeting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 className="page-title">Join by Code</h2>
            <p className="muted">Enter the meeting code provided by your instructor.</p>
          </div>
        </div>

        <div className="ui-card" style={{ maxWidth: 560 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label className="muted">Meeting Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className="text-input" placeholder="Enter meeting code" />
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="primary-btn" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Join'}</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default JoinMeeting;
