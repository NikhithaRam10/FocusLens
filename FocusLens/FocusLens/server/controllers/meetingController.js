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