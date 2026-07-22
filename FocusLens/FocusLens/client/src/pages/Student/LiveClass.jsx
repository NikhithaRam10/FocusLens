import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';

function StudentLive() {
  const navigate = useNavigate();
  const { meetingCode } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [activeScreenSharer, setActiveScreenSharer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [attentionScore, setAttentionScore] = useState(0);
  const [attentionStatus, setAttentionStatus] = useState('Waiting for analysis');
  const pcRef = useRef(null);
  const previewVideoRef = useRef(null);
  const aiCanvasRef = useRef(null);
  const aiAnalyzingRef = useRef(false);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const myRequest = meeting?.joinRequests?.find((r) => r.email === (user.email || '') || r.student === (user._id || user.id));
  const isApproved = Boolean(myRequest && myRequest.status === 'approved');
  const meetingIdStr = meeting?._id?.toString();

  const hostParticipant = participants.find((participant) => participant.role === 'instructor') || {
    id: meeting?.instructor?._id || 'host',
    name: meeting?.instructor?.name || 'Instructor',
    role: 'instructor',
  };

  const pinnedParticipant = useMemo(() => {
    if (!pinnedParticipantId) return hostParticipant;
    return participants.find((participant) => participant.id === pinnedParticipantId) || hostParticipant;
  }, [pinnedParticipantId, participants, hostParticipant]);

  const isPinnedUserHost = pinnedParticipant?.role === 'instructor';
  const isPinnedUserSelf = pinnedParticipant?.id === socket?.id || pinnedParticipant?.userId === (user.id || user._id);

  const mainStageStream = isPinnedUserHost 
    ? remoteStream 
    : (isPinnedUserSelf ? localStream : null);

  // If someone is screen-sharing, prefer the shared screen as the main stage
  const effectiveMainStageStream = activeScreenSharer ? remoteStream : mainStageStream;

  const createPeerConnection = () => new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ],
  });

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    if (!pcRef.current) return;

    const addTracks = (stream) => {
      if (!stream) return;
      stream.getTracks().forEach((track) => {
        const alreadyAdded = pcRef.current.getSenders().some((sender) => sender.track?.id === track.id);
        if (!alreadyAdded) {
          pcRef.current.addTrack(track, stream);
        }
      });
    };

    addTracks(localStreamRef.current);
    addTracks(screenStreamRef.current);
  }, [localStream, screenStream]);

  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/room/${meetingCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMeeting({ ...res.data.meeting, isInstructor: Boolean(res.data.isInstructor) });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load class.');
      } finally {
        setLoading(false);
      }
    };

    loadMeeting();

    const poll = setInterval(loadMeeting, 5000);
    return () => clearInterval(poll);
  }, [meetingCode]);

  useEffect(() => {
    if (!meetingIdStr) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const shouldConnect = isApproved;

    if (!shouldConnect) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setParticipants([]);
      }
      return;
    }

    const socketInstance = ioClient(import.meta.env.VITE_API_URL || 'http://localhost:5001');

    socketInstance.on('connect', () => {
      socketInstance.emit('join-room', {
        meetingId: meetingIdStr,
        userId: currentUser.id || currentUser._id,
        role: currentUser.role,
        name: currentUser.name || 'Student',
        email: currentUser.email || '',
      });
    });

    socketInstance.on('room-update', ({ participants: nextParticipants }) => {
      setParticipants(nextParticipants);
    });

    socketInstance.on('join-approved', ({ student, meetingId }) => {
      if ((currentUser.id || currentUser._id) === (student || '').toString()) {
        socketInstance.emit('signal', { meetingId: meetingIdStr, from: socketInstance.id, data: { type: 'student-ready', studentId: currentUser.id || currentUser._id } });
      }
    });

    socketInstance.on('screen-share', ({ from, active }) => {
      setActiveScreenSharer(active ? from : null);
    });

    socketInstance.on('meeting-state-changed', ({ status }) => {
      setMeeting((prev) => prev ? { ...prev, status } : prev);
    });

    socketInstance.on('meeting-ended', () => {
      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Show alert message
      alert("The meeting has ended.");
      // Navigate to the meeting completed page
      navigate(`/student/meeting-completed/${meetingCode}`);
    });

    socketInstance.on('signal', async (payload) => {
      const { from, data } = payload;
      if (data.type === 'offer') {
        try {
          const pc = createPeerConnection();
          pcRef.current = pc;

          pc.ontrack = (e) => {
            const [remoteStream] = e.streams;
            setRemoteStream(remoteStream);
          };

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socketInstance.emit('signal', { meetingId: meetingIdStr, to: from, from: socketInstance.id, data: { candidate: e.candidate } });
            }
          };

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, screenStreamRef.current));
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socketInstance.emit('signal', { meetingId: meetingIdStr, to: from, from: socketInstance.id, data: pc.localDescription });
        } catch (err) {
          console.error('Failed to handle offer', err);
        }
      } else if (data.type === 'answer') {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
        }
      } else if (data.candidate) {
        try {
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(data.candidate || data);
          }
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      } else if (data.type === 'mute-mic') {
        setMicOn(false);
        alert("The instructor has muted your microphone.");
      }
    });

    setSocket(socketInstance);

    return () => {
      try {
        socketInstance.disconnect();
      } catch (e) {
        /* ignore */
      }
      setSocket(null);
    };
  }, [meetingIdStr, isApproved]);

  useEffect(() => {
    if (socket && isApproved && localStream && meetingIdStr) {
      console.log("Sending student-ready signal...");
      socket.emit('signal', {
        meetingId: meetingIdStr,
        from: socket.id,
        data: { type: 'student-ready', studentId: user.id || user._id || socket.id }
      });
    }
  }, [socket, isApproved, localStream, meetingIdStr, user.id, user._id]);

  // Request media stream ONCE when approved/joined
  useEffect(() => {
    if (!isApproved) {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      return;
    }

    const requestMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // Apply initial camera/mic states to tracks
        mediaStream.getVideoTracks().forEach((track) => {
          track.enabled = cameraOn;
        });
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = micOn;
        });
        setLocalStream(mediaStream);
      } catch (err) {
        setError('Camera and microphone access is required to join the class.');
      }
    };

    if (!localStream) {
      requestMedia();
    }
  }, [isApproved]);

  // Handle cameraOn changes and emit state
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOn;
      });
      socket?.emit('toggle-media', { meetingId: meetingIdStr, type: 'video', enabled: cameraOn });
    }
  }, [localStream, cameraOn, socket, meetingIdStr]);

  // Handle micOn changes and emit state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
      socket?.emit('toggle-media', { meetingId: meetingIdStr, type: 'audio', enabled: micOn });
    }
  }, [localStream, micOn, socket, meetingIdStr]);

  useEffect(() => {
    if (!isApproved || !localStream || !socket || !meeting) {
      return;
    }

    const analyzeFrames = async () => {
      if (aiAnalyzingRef.current) return;

      const video = previewVideoRef.current;
      const canvas = aiCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const width = video.videoWidth || 320;
      const height = video.videoHeight || 240;
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) return;

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      aiAnalyzingRef.current = true;
      try {
        const response = await fetch(`${import.meta.env.VITE_AI_URL || 'http://localhost:5002'}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`AI engine returned ${response.status}`);
        }

        const data = await response.json();
        if (data.focus_score !== undefined) {
          const nextScore = Number(data.focus_score || 0);
          setAttentionScore(nextScore);
          setAttentionStatus(data.status || 'Analyzing');
          socket.emit('student-attention', {
            meetingId: meetingIdStr,
            studentId: user.id || user._id || socket.id,
            attention: nextScore,
          });
        }
      } catch (err) {
        console.error('AI analysis failed', err);
        setAttentionStatus('AI engine offline');
      } finally {
        aiAnalyzingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      analyzeFrames();
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [isApproved, localStream, meetingIdStr, socket, user.id, user._id]);

  const startScreenShare = async () => {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
        setSharing(false);
        socket?.emit('screen-share', { meetingId: meetingIdStr, from: socket.id, active: false });
        return;
      }

      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(s);
      setSharing(true);
      socket?.emit('screen-share', { meetingId: meetingIdStr, from: socket.id, active: true });
    } catch (err) {
      setError('Unable to start screen sharing.');
    }
  };

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (loading) {
    return <div className="page-container"><div className="dashboard-shell"><h2 className="page-title">Opening class...</h2></div></div>;
  }

  if (error || !meeting) {
    return <div className="page-container"><div className="dashboard-shell"><h2 className="page-title">Class unavailable</h2><p className="muted">{error || 'The requested room could not be loaded.'}</p></div></div>;
  }

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="room-header" style={{ position: "relative", paddingTop: "48px" }}>
          <button className="primary-btn top-left-pill-btn" style={{ position: "absolute", top: 0, left: 0 }} onClick={() => navigate('/student/meetings')}>
            ← Back
          </button>
          <div style={{ paddingTop: "4px" }}>
            <h2 className="page-title">{meeting.title}</h2>
            <p className="muted">{meeting.meetingCode}</p>
          </div>
        </div>

        <div className="ui-card room-controls-card">
          <h3 style={{ marginTop: 0 }}>Your Access</h3>
          {!myRequest && (
            <p className="muted">You should have requested to join. If you haven't, go back and click Join Meeting.</p>
          )}

          {myRequest && myRequest.status === 'pending' && (
            <div>
              <p className="muted">Your request is pending approval from the instructor.</p>
            </div>
          )}

          {myRequest && myRequest.status === 'rejected' && (
            <p className="muted">Your request was denied.</p>
          )}

          {myRequest && myRequest.status === 'approved' && (
            <div>
              <p className="muted">You have been approved — use the controls below to share camera, mic, or screen.</p>

              <div className="room-controls" style={{ marginTop: '12px' }}>
                <button className="primary-btn" onClick={() => setCameraOn((p) => !p)}>{cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}</button>
                <button className="secondary-btn" onClick={() => setMicOn((p) => !p)}>{micOn ? 'Mute Mic' : 'Unmute Mic'}</button>
                <button className="secondary-btn" onClick={startScreenShare}>{sharing ? 'Stop Sharing' : 'Share Screen'}</button>
              </div>
            </div>
          )}
        </div>

        <div className="live-room-shell">
          <div className={`live-room-main ${pinnedParticipantId ? 'pinned' : ''}`}>
            <div className="ui-card live-stage-card">
              <div className="live-stage-header">
                <div>
                  <p className="muted">Classroom view</p>
                  <h3>{meeting.title}</h3>
                </div>
                <div className="status-pill">{isApproved ? '● Joined' : '● Waiting'}</div>
              </div>

              <div className="live-stage-video">
                {isApproved && effectiveMainStageStream ? (
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(v) => {
                      if (v && v.srcObject !== effectiveMainStageStream) {
                        v.srcObject = effectiveMainStageStream;
                      }
                    }}
                  />
                ) : isApproved ? (
                  <div className="video-placeholder">
                    {pinnedParticipantId && !isPinnedUserHost && !isPinnedUserSelf ? (
                      <>
                        <h4>Feed Unavailable</h4>
                        <p>Camera feed for {pinnedParticipant?.name || 'this participant'} is only visible to the instructor.</p>
                      </>
                    ) : (
                      <>
                        <h4>Waiting for instructor camera</h4>
                        <p>Your feed is ready. The instructor has not started their live camera stream yet.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="video-placeholder">
                    <h4>Awaiting approval</h4>
                    <p>The instructor must approve your entry before the classroom becomes active.</p>
                  </div>
                )}
              </div>

              {localStream && (
                <div className="self-preview-card" style={{ position: 'relative' }}>
                  <h4>Your preview</h4>
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(v) => {
                      if (v) {
                        if (v.srcObject !== localStream) {
                          v.srcObject = localStream;
                        }
                        previewVideoRef.current = v;
                      }
                    }}
                  />
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: attentionScore >= 70 ? 'rgba(34,197,94,0.9)' : attentionScore >= 40 ? 'rgba(234,179,8,0.9)' : 'rgba(239,68,68,0.9)',
                    color: '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 700
                  }}>
                    👁 {attentionScore.toFixed(1)}% attentive
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '12px' }}>
                    {attentionStatus}
                  </div>
                </div>
              )}

              <canvas ref={aiCanvasRef} style={{ display: 'none' }} />

              {isApproved && participants.length > 0 && (
                <div className="screen-share-card">
                  <h4>Participant tiles</h4>
                  <div className="participant-tiles-grid">
                    {participants.map((participant, index) => (
                      <div className="participant-tile-card" key={participant.id || `${participant.name}-${index}`} style={{ position: 'relative' }}>
                        <div className="tile-name">{participant.name}</div>
                        <div className="tile-meta">{participant.role === 'instructor' ? 'Instructor' : 'Student'}</div>
                        {participant.role !== 'instructor' && (
                          <div style={{
                            marginTop: '6px',
                            display: 'inline-block',
                            background: participant.attention !== undefined
                              ? (participant.attention >= 70 ? 'rgba(34,197,94,0.15)' : participant.attention >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)')
                              : 'rgba(100,100,100,0.1)',
                            color: participant.attention !== undefined
                              ? (participant.attention >= 70 ? '#16a34a' : participant.attention >= 40 ? '#ca8a04' : '#dc2626')
                              : '#999',
                            padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700
                          }}>
                            👁 {participant.attention !== undefined ? `${Number(participant.attention).toFixed(1)}%` : 'AI pending'}
                          </div>
                        )}
                        <button
                          className={`secondary-btn ${pinnedParticipantId === participant.id ? 'active' : ''}`}
                          onClick={() => setPinnedParticipantId(participant.id)}
                        >
                          {pinnedParticipantId === participant.id ? 'Pinned' : 'Pin'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {screenStream && (
                <div className="screen-share-card">
                  <h4>Screen Share</h4>
                  <video
                    autoPlay
                    playsInline
                    ref={(v) => {
                      if (v && v.srcObject !== screenStream) {
                        v.srcObject = screenStream;
                      }
                    }}
                  />
                </div>
              )}
            </div>

              {isApproved && (
              <div className="ui-card participant-panel">
              <div className="panel-title">
                <h3>Classroom</h3>
                <span>{participants.length} joined</span>
              </div>
              <div className="participant-list">
                {participants.map((participant, index) => (
                  <div className="participant-card" key={participant.id || `${participant.name}-${index}`}>
                    <div>
                      <div className="participant-name">{participant.name}</div>
                      <div className="muted">{participant.role === 'instructor' ? 'Instructor' : 'Student'} • {participant.status}</div>
                    </div>
                    <button
                      className={`secondary-btn ${pinnedParticipantId === participant.id ? 'active' : ''}`}
                      onClick={() => setPinnedParticipantId(participant.id)}
                    >
                      {pinnedParticipantId === participant.id ? 'Pinned' : 'Pin'}
                    </button>
                  </div>
                ))}
              </div>
              </div>
              )}
          </div>

          <div className="ui-card request-panel">
            <h3>Meeting Info</h3>
            <p className="muted">Status: {meeting.status}</p>
            <p className="muted">Instructor: {meeting.instructor?.name || 'Instructor'}</p>
            {socket && (
              <p className="muted" style={{ marginTop: '10px' }}>Connected to live room updates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLive;
