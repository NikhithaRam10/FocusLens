const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const { isInstructor } = require("../middleware/role");

const {
createMeeting,
getInstructorMeetings,
getAllMeetings,
deleteMeeting,
updateMeeting,
startMeeting,
endMeeting,
getMeetingByCode,
requestJoinMeeting,
handleJoinRequest,
getMeetingByLink,
getMeetingReport,
getStudentTodayReport,
getInstructorReportsList
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

router.get(
  "/instructor/reports",
  auth,
  isInstructor,
  getInstructorReportsList
);

router.get(
  "/student-report/today",
  auth,
  getStudentTodayReport
);

router.get(
  "/:meetingId/report",
  auth,
  getMeetingReport
);

router.get(
  "/room/:meetingCode",
  auth,
  getMeetingByCode
);

router.get(
  "/link/:linkId",
  getMeetingByLink
);

router.post(
  "/join-request/:id",
  auth,
  requestJoinMeeting
);

router.put(
  "/join-request/:id/:requestId",
  auth,
  handleJoinRequest
);

router.put(
"/:id",
auth,
isInstructor,
updateMeeting
);

router.put(
"/start/:id",
auth,
isInstructor,
startMeeting
);

router.put(
"/end/:id",
auth,
isInstructor,
endMeeting
);

router.delete(
  "/:id",
  auth,
  isInstructor,
  deleteMeeting
);
module.exports = router;