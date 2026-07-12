const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { isInstructor } = require("../middleware/role");

const {
  createMeeting,
  getAllMeetings,
  getInstructorMeetings,
  deleteMeeting,
} = require("../controllers/meetingController");


router.post("/create", auth, isInstructor, createMeeting);

router.get("/my", auth, isInstructor, getInstructorMeetings);

router.get("/all", auth, getAllMeetings);
router.delete(
  "/:id",
  auth,
  isInstructor,
  deleteMeeting
);

module.exports = router;