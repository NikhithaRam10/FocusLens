const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const studentRoutes = require("./routes/studentRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

dotenv.config();

const connectDB = require("./config/db");

connectDB();

const http = require('http');

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
        res.send("FocusLens Backend Running...");
});

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const { Server } = require('socket.io');
const { setIo } = require('./socket');

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
    },
});

setIo(io);

const roomParticipants = new Map();

function broadcastRoomUpdate(meetingId) {
    const room = roomParticipants.get(meetingId);
    const participants = room ? Array.from(room.values()) : [];
    io.to(meetingId).emit('room-update', { meetingId, participants });
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('join-room', ({ meetingId, userId, role, name, email }) => {
        socket.join(meetingId);
        socket.meetingId = meetingId;
        socket.userId = userId;
        socket.role = role;

        if (!roomParticipants.has(meetingId)) {
            roomParticipants.set(meetingId, new Map());
        }

        const room = roomParticipants.get(meetingId);
        room.set(socket.id, {
            id: socket.id,
            userId: userId || socket.id,
            role: role || 'student',
            name: name || 'Participant',
            email: email || '',
            joinedAt: new Date().toISOString(),
            status: role === 'instructor' ? 'Host' : 'In room',
            attention: 0,
            micOn: true,
            cameraOn: true,
        });

        broadcastRoomUpdate(meetingId);
    });

    socket.on('signal', (payload) => {
        const { to } = payload;
        if (to) {
            io.to(to).emit('signal', payload);
        } else if (socket.meetingId) {
            socket.to(socket.meetingId).emit('signal', payload);
        }
    });

    // Relay screen share start/stop to the room so clients can update main stage
    socket.on('screen-share', (payload) => {
        // payload should include { meetingId, from, active }
        if (socket.meetingId) {
            socket.to(socket.meetingId).emit('screen-share', payload);
        }
    });

    socket.on('student-attention', async ({ meetingId, studentId, attention }) => {
        const room = roomParticipants.get(meetingId);
        if (!room) return;

        const participant = Array.from(room.values()).find((entry) =>
            entry.userId === studentId || entry.id === studentId
        );

        if (participant) {
            participant.attention = Number(attention) || participant.attention;
            broadcastRoomUpdate(meetingId);
        }

        const mongoose = require("mongoose");
        if (mongoose.Types.ObjectId.isValid(studentId) && mongoose.Types.ObjectId.isValid(meetingId)) {
            try {
                const AttentionReport = require("./models/AttentionReport");
                const score = Number(attention) || 0;

                let report = await AttentionReport.findOne({ meeting: meetingId, student: studentId });
                if (!report) {
                    report = new AttentionReport({
                        meeting: meetingId,
                        student: studentId,
                        logs: [],
                        averageScore: 0,
                        totalEntries: 0
                    });
                }

                const now = new Date();
                const lastLog = report.logs.length > 0 ? report.logs[report.logs.length - 1] : null;

                // Log every 30 seconds to the database
                if (!lastLog || (now - new Date(lastLog.timestamp)) >= 30000) {
                    report.logs.push({
                        timestamp: now,
                        score: score
                    });

                    const sum = report.logs.reduce((acc, log) => acc + log.score, 0);
                    report.totalEntries = report.logs.length;
                    report.averageScore = sum / report.totalEntries;

                    await report.save();
                }
            } catch (err) {
                console.error("Error saving attention log:", err.message);
            }
        }
    });

    socket.on('toggle-media', ({ meetingId, type, enabled }) => {
        const room = roomParticipants.get(meetingId);
        if (!room) return;
        const participant = room.get(socket.id);
        if (participant) {
            if (type === 'audio') participant.micOn = enabled;
            if (type === 'video') participant.cameraOn = enabled;
            broadcastRoomUpdate(meetingId);
        }
    });

    socket.on('meeting-ended', ({ meetingId }) => {
        if (!meetingId) return;
        io.to(meetingId).emit('meeting-ended', { meetingId });
    });

    socket.on('disconnect', () => {
        const meetingId = socket.meetingId;
        if (meetingId) {
            const room = roomParticipants.get(meetingId);
            if (room) {
                room.delete(socket.id);
                if (room.size === 0) {
                    roomParticipants.delete(meetingId);
                } else {
                    broadcastRoomUpdate(meetingId);
                }
            }
        }
        console.log('socket disconnected', socket.id);
    });
});

server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
});