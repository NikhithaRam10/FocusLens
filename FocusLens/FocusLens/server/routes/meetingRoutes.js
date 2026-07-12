const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { isInstructor } = require("../middleware/role");

const {
  createMeeting,
  getAllMeetings,
  getInstructorMeetings,
} = require("../controllers/meetingController");

router.post(
  "/create",
  auth,
  isInstructor,
  createMeeting
);

router.get(
  "/all",
  auth,
  getAllMeetings
);

router.get(
  "/my",
  auth,
  isInstructor,
  getInstructorMeetings
);

module.exports = router;