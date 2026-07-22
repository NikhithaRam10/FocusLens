import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function MeetRedirect() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Looking up meeting...');

  useEffect(() => {
    const lookup = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/link/${linkId}`);
        const meeting = res.data.meeting;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const instructorId = meeting?.instructor?._id || meeting?.instructor?.id;
        const isInstructor = user && user.role === 'instructor' && user.id?.toString() === instructorId?.toString();

        if (isInstructor) {
          navigate(`/instructor/live/${meeting.meetingCode}`);
          return;
        }

        navigate(`/student/live/${meeting.meetingCode}`);
      } catch (err) {
        setMsg(err.response?.data?.message || 'Meeting not found');
      }
    };

    lookup();
  }, [linkId]);

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <h2 className="page-title">Redirecting...</h2>
        <p className="muted">{msg}</p>
      </div>
    </div>
  );
}
