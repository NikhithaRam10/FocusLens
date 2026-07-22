import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';

function LiveClass() {
  const navigate = useNavigate();
  const { meetingCode } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaError, setMediaError] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStudentStreams, setRemoteStudentStreams] = useState({});
  const [screenStream, setScreenStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [activeScreenSharer, setActiveScreenSharer] = useState(null);
  const [socket, setSocket] = useState(null);
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const meetingIdStr = meeting?._id?.toString();

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
  }, [meetingCode]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  useEffect(() => {
    if (!meetingIdStr) return;

    const socketInstance = ioClient(import.meta.env.VITE_API_URL || 'http://localhost:5001');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    socketInstance.on('connect', () => {
      socketInstance.emit('join-room', {
        meetingId: meetingIdStr,
        userId: currentUser.id || currentUser._id,
        role: currentUser.role,
        name: currentUser.name || 'Instructor',
        email: currentUser.email || '',
      });
    });

    socketInstance.on('room-update', ({ participants: nextParticipants }) => {
      setParticipants(nextParticipants);
    });

    socketInstance.on('join-approved', ({ student, meetingId }) => {
      console.log('join-approved', student, meetingId);
    });

    socketInstance.on('screen-share', ({ from, active }) => {
      setActiveScreenSharer(active ? from : null);
    });

    socketInstance.on('meeting-state-changed', ({ status }) => {
      setMeeting((prev) => prev ? { ...prev, status } : prev);
    });

    socketInstance.on('meeting-ended', () => {
      setError('The meeting has ended.');
    });

    socketInstance.on('signal', async (payload) => {
      const { from, data } = payload;
      if (!peerConnections.current) peerConnections.current = {};
      if (data.type === 'student-ready') {
        try {
          if (!localStreamRef.current && !screenStreamRef.current) {
            console.warn('No host stream available to share');
            return;
          }

          if (peerConnections.current[from]) {
            console.log('Closing existing peer connection for', from);
            peerConnections.current[from].close();
          }

          const pc = createPeerConnection();
          peerConnections.current[from] = pc;

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, screenStreamRef.current));
          }

          pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStudentStreams((prev) => ({
              ...prev,
              [from]: remoteStream,
            }));
          };

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              socketInstance.emit('signal', { meetingId: meetingIdStr, to: from, from: socketInstance.id, data: { candidate: e.candidate } });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socketInstance.emit('signal', { meetingId: meetingIdStr, to: from, from: socketInstance.id, data: pc.localDescription });
        } catch (err) {
          console.error('Failed to create offer', err);
        }
        return;
      }

      const pc = peerConnections.current[from];
      if (!pc) return;

      if (data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate || data);
        } catch (e) {
          console.error('Failed to add ICE candidate', e);
        }
      }
    });

    socketInstance.on('disconnect', () => console.log('socket disconnected'));

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      if (peerConnections.current) {
        Object.values(peerConnections.current).forEach((pc) => {
          try {
            pc.close();
          } catch (e) {
            /* ignore */
          }
        });
        peerConnections.current = {};
      }
    };
  }, [meetingIdStr]);

  useEffect(() => {
    const requestLocalMedia = async () => {
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
        setMediaError(false);
      } catch (err) {
        setMediaError(true);
      }
    };

    if (!localStream) {
      requestLocalMedia();
    }
  }, []);

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

  const retryLocalMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOn;
      });
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
      setLocalStream(mediaStream);
      setMediaError(false);
    } catch (err) {
      setMediaError(true);
    }
  };;

  const startScreenShare = async () => {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
        setSharing(false);
        socket?.emit('screen-share', { meetingId: meetingIdStr, from: socket.id, active: false });
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(displayStream);
      setSharing(true);
      socket?.emit('screen-share', { meetingId: meetingIdStr, from: socket.id, active: true });
    } catch (err) {
      setError('Unable to start screen sharing.');
    }
  };

  const approveRequest = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/join-request/${meeting._id}/${requestId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMeeting((prev) => ({
        ...prev,
        joinRequests: prev.joinRequests.map((req) =>
          req._id === requestId ? { ...req, status } : req
        ),
      }));

      if (socket) {
        socket.emit('signal', { meetingId: meetingIdStr, to: null, from: socket.id, data: { type: 'approval', requestId, status } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update join request.');
    }
  };

  const startMeetingFromRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/start/${meeting._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMeeting((m) => ({ ...m, status: 'Active' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start meeting');
    }
  };

  const endMeetingFromRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/meetings/end/${meeting._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('meeting-ended', { meetingId: meetingIdStr });
      }

      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }

      // Navigate to the reports page
      navigate(`/instructor/reports/${meeting._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to end meeting');
    }
  };

  const hostParticipant = participants.find((participant) => participant.role === 'instructor') || {
    id: socket?.id,
    name: user?.name || 'Instructor',
    role: 'instructor',
  };

  const pinnedParticipant = useMemo(() => {
    if (!pinnedParticipantId) return hostParticipant;
    return participants.find((participant) => participant.id === pinnedParticipantId) || hostParticipant;
  }, [pinnedParticipantId, participants, hostParticipant]);

  const createPeerConnection = () => new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ],
  });

  const isPinnedUserHost = pinnedParticipant?.role === 'instructor';
  const mainStageStream = activeScreenSharer
    ? (activeScreenSharer === socket?.id ? screenStream : (remoteStudentStreams[activeScreenSharer] || null))
    : (isPinnedUserHost
      ? localStream
      : (remoteStudentStreams[pinnedParticipant?.id] || null));

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
    return <div className="page-container"><div className="dashboard-shell"><h2 className="page-title">Opening class room...</h2></div></div>;
  }

  if (error || !meeting) {
    return <div className="page-container"><div className="dashboard-shell"><h2 className="page-title">Class unavailable</h2><p className="muted">{error || 'The requested room could not be loaded.'}</p></div></div>;
  }

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="room-header" style={{ position: "relative", paddingTop: "48px" }}>
          <button className="primary-btn top-left-pill-btn" style={{ position: "absolute", top: 0, left: 0 }} onClick={() => navigate('/instructor/meetings')}>
            ← Back
          </button>
          <div style={{ paddingTop: "4px" }}>
            <h2 className="page-title">{meeting.title}</h2>
            <p className="muted">Host controls • {meeting.meetingCode}</p>
          </div>
        </div>

        <div className="ui-card room-controls-card">
          <div className="room-controls">
            <button className="primary-btn" onClick={() => setCameraOn((prev) => !prev)}>
              {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            </button>
            <button className="secondary-btn" onClick={() => setMicOn((prev) => !prev)}>
              {micOn ? 'Mute Mic' : 'Unmute Mic'}
            </button>
            <button className="secondary-btn" onClick={startScreenShare}>
              {sharing ? 'Stop Screen Share' : 'Share Screen'}
            </button>
            {meeting.status !== 'Active' && meeting.status !== 'Completed' && (
              <button className="primary-btn" onClick={startMeetingFromRoom}>
                Start Meeting
              </button>
            )}
            {meeting.status === 'Active' && (
              <button className="secondary-btn" onClick={endMeetingFromRoom}>
                End Meeting
              </button>
            )}
            <span className="muted room-host">Host: {user?.name || 'Instructor'}</span>
          </div>
        </div>

        <div className="live-room-shell">
          <div className={`live-room-main ${pinnedParticipantId ? 'pinned' : ''}`}>
            <div className="ui-card live-stage-card">
              <div className="live-stage-header">
                <div>
                  <p className="muted">Live classroom</p>
                  <h3>{meeting.title}</h3>
                </div>
                <div className="status-pill">● Live</div>
              </div>

              <div className="live-stage-video">
                {mainStageStream ? (
                  <video
                    autoPlay
                    muted
                    playsInline
                    ref={(video) => {
                      if (video && video.srcObject !== mainStageStream) {
                        video.srcObject = mainStageStream;
                      }
                    }}
                  />
                ) : (
                  <div className="video-placeholder">
                    {pinnedParticipantId && !isPinnedUserHost ? (
                      <>
                        <h4>Student Camera Offline</h4>
                        <p>{pinnedParticipant?.name || 'Student'} is not streaming video.</p>
                      </>
                    ) : (
                      <>
                        <h4>Camera is off</h4>
                        <p>Students will see the live room here once the host camera is enabled.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {screenStream && (
                <div className="screen-share-card">
                  <h4>Screen Share</h4>
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && video.srcObject !== screenStream) {
                        video.srcObject = screenStream;
                      }
                    }}
                  />
                </div>
              )}

              {participants.filter((p) => p.role !== 'instructor').length > 0 && (
                <div className="screen-share-card">
                  <h4>Student cameras</h4>
                  <div className="participant-video-grid">
                    {participants
                      .filter((p) => p.role !== 'instructor')
                      .map((studentParticipant) => {
                        const remoteStream = remoteStudentStreams[studentParticipant.id];
                        const attention = studentParticipant?.attention;
                        return (
                          <div className="participant-video-card" key={studentParticipant.id} style={{ position: 'relative' }}>
                            {remoteStream ? (
                              <video
                                autoPlay
                                playsInline
                                ref={(video) => {
                                  if (video && video.srcObject !== remoteStream) {
                                    video.srcObject = remoteStream;
                                  }
                                }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📷</div>
                                <div style={{ fontSize: '12px', color: '#aaa' }}>Camera not connected</div>
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.72)', color: '#fff', padding: '3px 9px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                              {studentParticipant.name}
                            </div>
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              background: attention !== undefined
                                ? (attention >= 70 ? 'rgba(34,197,94,0.88)' : attention >= 40 ? 'rgba(234,179,8,0.88)' : 'rgba(239,68,68,0.88)')
                                : 'rgba(0,0,0,0.65)',
                              color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700
                            }}>
                              👁 {attention !== undefined ? `${Number(attention).toFixed(1)}% attentive` : 'Connecting...'}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="ui-card participant-panel">
              <div className="panel-title">
                <h3>Participants</h3>
                <span>{participants.length} joined</span>
              </div>
              <div className="participant-list">
                <div className="participant-card host-card">
                  <div>
                    <div className="participant-name">{hostParticipant.name}</div>
                    <div className="muted">Instructor • Host</div>
                  </div>
                  <button
                    className={`secondary-btn ${pinnedParticipantId === hostParticipant.id ? 'active' : ''}`}
                    onClick={() => setPinnedParticipantId(hostParticipant.id)}
                  >
                    {pinnedParticipantId === hostParticipant.id ? 'Pinned' : 'Pin'}
                  </button>
                </div>

                {participants
                  .filter((participant) => participant.role !== 'instructor')
                  .map((participant, index) => (
                    <div className="participant-card" key={participant.id || `${participant.name}-${index}`}>
                      <div style={{ flex: 1 }}>
                        <div className="participant-name">
                          {participant.name}
                          <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                            {participant.micOn === false ? '🔇' : '🎤'}
                            {participant.cameraOn === false ? ' 🚫📷' : ' 📷'}
                          </span>
                        </div>
                        <div className="muted">Student • {participant.status}</div>
                        <div style={{
                          marginTop: '4px',
                          display: 'inline-block',
                          background: participant.attention !== undefined
                            ? (participant.attention >= 70 ? 'rgba(34,197,94,0.15)' : participant.attention >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)')
                            : 'rgba(100,100,100,0.12)',
                          color: participant.attention !== undefined
                            ? (participant.attention >= 70 ? '#16a34a' : participant.attention >= 40 ? '#ca8a04' : '#dc2626')
                            : '#888',
                          padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700
                        }}>
                          👁 {participant.attention !== undefined ? `${Number(participant.attention).toFixed(1)}% attentive` : 'AI pending'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {participant.micOn !== false && (
                          <button
                            className="secondary-btn"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            onClick={() => {
                              if (socket) {
                                socket.emit('signal', {
                                  meetingId: meetingIdStr,
                                  to: participant.id,
                                  from: socket.id,
                                  data: { type: 'mute-mic' }
                                });
                              }
                            }}
                          >
                            Mute
                          </button>
                        )}
                        <button
                          className={`secondary-btn ${pinnedParticipantId === participant.id ? 'active' : ''}`}
                          onClick={() => setPinnedParticipantId(participant.id)}
                        >
                          {pinnedParticipantId === participant.id ? 'Pinned' : 'Pin'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="ui-card request-panel">
            <h3>Student Join Requests</h3>
            {meeting.joinRequests?.length === 0 ? (
              <p className="muted">No students have requested to join yet.</p>
            ) : (
              <div className="request-list">
                {meeting.joinRequests.map((request) => (
                  <div className="score-card request-card" key={request._id}>
                    <div className="card-title">{request.name}</div>
                    <p className="muted">{request.email}</p>
                    <p className="muted">Status: {request.status}</p>
                    {request.status === 'pending' && (
                      <div className="card-actions" style={{ marginTop: '10px' }}>
                        <button className="primary-btn" onClick={() => approveRequest(request._id, 'approved')}>Allow</button>
                        <button className="secondary-btn" onClick={() => approveRequest(request._id, 'rejected')}>Deny</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {mediaError && (
          <div className="ui-card room-controls-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 className="page-title">Camera & Microphone Required</h4>
                <p className="muted">Camera and microphone access is required to start the class room.</p>
              </div>
              <div>
                <button className="primary-btn" onClick={retryLocalMedia}>Retry Camera & Mic</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default LiveClass;
