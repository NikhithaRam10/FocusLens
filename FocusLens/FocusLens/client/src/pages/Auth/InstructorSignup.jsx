import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import AuthBackground from "../../components/AuthBackground";

function InstructorSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/signup`,
        {
          ...formData,
          role: "instructor",
        }
      );

      alert(res.data.message);

      navigate("/instructor-login");

    } catch (err) {
      alert(err.response?.data?.message || "Signup Failed");
    }
  };

  return (
    <AuthBackground>
      <div className="auth-container">
        <div className="auth-card">

          <h2 className="auth-title">Instructor Sign Up</h2>

          <form onSubmit={handleSignup}>

            <div className="form-group">
              <label className="form-label">Full Name</label>

              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Enter Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>

              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>

              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="Create Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="primary-btn">
              Sign Up
            </button>

          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/instructor-login">
              Login
            </Link>
          </p>

        </div>
      </div>
    </AuthBackground>
  );
}

export default InstructorSignup;