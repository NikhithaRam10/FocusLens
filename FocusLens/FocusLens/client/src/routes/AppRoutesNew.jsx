import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import InstructorLogin from "../pages/Auth/InstructorLoginNew";
import StudentLogin from "../pages/Auth/StudentLogin";
import InstructorChoice from "../pages/Auth/InstructorChoice";
import StudentChoice from "../pages/Auth/StudentChoice";
import InstructorSignup from "../pages/Auth/InstructorSignup";
import StudentSignup from "../pages/Auth/StudentSignup";
import InstructorDashboard from "../pages/Instructor/Dashboard";
import StudentDashboard from "../pages/Student/Dashboard";
import CreateMeeting from "../pages/Instructor/CreateMeeting";
import InstructorMeetings from "../pages/Instructor/Meetings";
import StudentMeetings from "../pages/Student/Meetings";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/instructor-choice" element={<InstructorChoice />} />
        <Route path="/student-choice" element={<StudentChoice />} />

        <Route path="/instructor-login" element={<InstructorLogin />} />
        <Route path="/student-login" element={<StudentLogin />} />

        <Route path="/instructor-signup" element={<InstructorSignup />} />
        <Route path="/student-signup" element={<StudentSignup />} />

        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />

        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        <Route path="/create-meeting" element={<CreateMeeting />} />
        <Route path="/instructor/create-meeting" element={<CreateMeeting />} />

        <Route path="/instructor-meetings" element={<InstructorMeetings />} />
        <Route path="/instructor/meetings" element={<InstructorMeetings />} />

        <Route path="/student-meetings" element={<StudentMeetings />} />
        <Route path="/student/meetings" element={<StudentMeetings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
