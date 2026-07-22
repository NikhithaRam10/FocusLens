const Meeting = require("../models/Meeting");


exports.createMeeting = async (req, res) => {

  try {

    const {
      title,
      subject,
      description,
      scheduledTime,
      meetingCode,
      meetingLink,
    } = req.body;

    const meeting = await Meeting.create({
      title,
      subject,
      description,
      scheduledTime,
      meetingCode,
      meetingLink,
      instructor: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Meeting Created Successfully",
      meeting,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

exports.getAllMeetings = async (req, res) => {

  try {

    const meetings = await Meeting.find()
      .populate("instructor", "name email");

    res.json(meetings);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};

exports.getInstructorMeetings = async (req, res) => {

  try {

    const meetings = await Meeting.find({
      instructor: req.user.id,
    });

    res.json(meetings);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Only the instructor who created the meeting can delete it
    if (meeting.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this meeting",
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Meeting deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateMeeting = async (req, res) => {
  try {

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (meeting.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

   meeting.title = req.body.title ?? meeting.title;
  meeting.subject = req.body.subject ?? meeting.subject;
  meeting.description = req.body.description ?? meeting.description;
  meeting.scheduledTime = req.body.scheduledTime ?? meeting.scheduledTime;
  meeting.meetingLink = req.body.meetingLink ?? meeting.meetingLink;

    await meeting.save();

    res.json({
      success: true,
      message: "Meeting Updated",
      meeting,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
exports.getMeetingByCode = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingCode: req.params.meetingCode })
      .populate("instructor", "name email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const isInstructor = req.user && meeting.instructor && meeting.instructor._id && meeting.instructor._id.toString() === req.user.id;

    res.json({
      success: true,
      meeting,
      isInstructor,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.requestJoinMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    const existingRequest = meeting.joinRequests.find(
      (request) => request.email === req.body.email || request.student?.toString() === req.user.id
    );

    if (existingRequest) {
      return res.json({
        success: true,
        message: "Your join request is already pending",
        meeting,
      });
    }

    meeting.joinRequests.push({
      student: req.user.id,
      name: req.body.name || req.user.name || "Student",
      email: req.body.email || req.user.email || "",
      status: "pending",
    });

    await meeting.save();

    res.json({
      success: true,
      message: "Join request sent",
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.handleJoinRequest = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    if (meeting.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const request = meeting.joinRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Join request not found",
      });
    }

    request.status = req.body.status === "approved" ? "approved" : "rejected";
    await meeting.save();

    // Emit approval/rejection over sockets so clients update in real-time
    try {
      const { getIo } = require('../socket');
      const io = getIo();
      if (io) {
        io.to(meeting._id.toString()).emit('join-request-updated', { requestId: request._id, status: request.status, meetingId: meeting._id.toString() });
        if (request.status === 'approved') {
          // notify specific student sockets in room
          io.to(meeting._id.toString()).emit('join-approved', { requestId: request._id, student: request.student, meetingId: meeting._id.toString() });
        }
      }
    } catch (err) {
      console.error('Socket emit error', err.message);
    }

    res.json({
      success: true,
      message: `Join request ${request.status}`,
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.startMeeting = async (req, res) => {
  try {

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    // Only the instructor who created it can start it
    if (meeting.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    meeting.status = "Active";

    await meeting.save();

    try {
      const { getIo } = require('../socket');
      const io = getIo();
      if (io) {
        io.to(meeting._id.toString()).emit('meeting-state-changed', { meetingId: meeting._id.toString(), status: 'Active' });
      }
    } catch (err) {
      console.error('Socket emit error', err.message);
    }

    res.json({
      success: true,
      message: "Meeting Started",
      meeting,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

exports.endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        message: "Meeting not found",
      });
    }

    if (meeting.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    meeting.status = "Completed";
    await meeting.save();

    try {
      const { getIo } = require('../socket');
      const io = getIo();
      if (io) {
        io.to(meeting._id.toString()).emit('meeting-state-changed', { meetingId: meeting._id.toString(), status: 'Completed' });
        io.to(meeting._id.toString()).emit('meeting-ended', { meetingId: meeting._id.toString() });
      }
    } catch (err) {
      console.error('Socket emit error', err.message);
    }

    res.json({
      success: true,
      message: "Meeting Ended",
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMeetingByLink = async (req, res) => {
  try {
    const linkId = req.params.linkId;
    // Match meetings where meetingLink contains the linkId
    const meeting = await Meeting.findOne({ meetingLink: { $regex: linkId } }).populate("instructor", "name email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.json({
      success: true,
      meeting,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const AttentionReport = require("../models/AttentionReport");

exports.getInstructorReportsList = async (req, res) => {
  try {
    const meetings = await Meeting.find({ instructor: req.user.id }).sort({ createdAt: -1 });
    
    const reportsList = [];
    for (const meeting of meetings) {
      const reports = await AttentionReport.find({ meeting: meeting._id });
      if (reports.length > 0) {
        const totalAverage = reports.reduce((sum, r) => sum + r.averageScore, 0);
        const overallAverage = totalAverage / reports.length;
        reportsList.push({
          meetingId: meeting._id.toString(),
          meetingTitle: meeting.title,
          meetingSubject: meeting.subject || "",
          meetingCode: meeting.meetingCode,
          date: meeting.createdAt,
          status: meeting.status,
          studentCount: reports.length,
          averageScore: Math.round(overallAverage * 10) / 10
        });
      } else {
        reportsList.push({
          meetingId: meeting._id.toString(),
          meetingTitle: meeting.title,
          meetingSubject: meeting.subject || "",
          meetingCode: meeting.meetingCode,
          date: meeting.createdAt,
          status: meeting.status,
          studentCount: 0,
          averageScore: null
        });
      }
    }
    
    res.json(reportsList);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getMeetingReport = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Find the meeting
    const meeting = await Meeting.findById(meetingId).populate("instructor", "name email");
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }
    
    // Find all attention reports for this meeting
    const attentionReports = await AttentionReport.find({ meeting: meetingId })
      .populate("student", "name email");
      
    // Format students array as expected by the frontend
    const students = attentionReports.map(rep => ({
      name: rep.student ? rep.student.name : "Unknown Student",
      email: rep.student ? rep.student.email : "unknown@student.com",
      avgScore: rep.averageScore,
      logs: rep.logs.map(log => ({
        timestamp: log.timestamp,
        score: log.score
      }))
    }));
    
    res.json({
      meeting: {
        title: meeting.title,
        subject: meeting.subject,
        meetingCode: meeting.meetingCode,
        date: meeting.createdAt,
      },
      students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getStudentTodayReport = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get start of today in local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    // Find attention reports for this student created today
    const reports = await AttentionReport.find({
      student: studentId,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    }).populate("meeting", "title subject meetingCode");
    
    const formattedReports = reports.map(rep => ({
      meetingId: rep.meeting ? rep.meeting._id.toString() : "",
      meetingTitle: rep.meeting ? rep.meeting.title : "Unknown Meeting",
      meetingSubject: rep.meeting ? rep.meeting.subject : "",
      meetingCode: rep.meeting ? rep.meeting.meetingCode : "",
      averageScore: rep.averageScore,
      totalEntries: rep.totalEntries
    }));
    
    res.json(formattedReports);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};