import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import AuthBackground from "../../components/AuthBackground";

function StudentLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`,
        formData
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login Successful");

      navigate("/student-dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <AuthBackground>
      <div className="auth-container">
        <div className="auth-card">

          <h2 className="auth-title">Student Login</h2>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label className="form-label">Email</label>

              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>

              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="primary-btn">
              Login
            </button>

          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/student-signup">
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </AuthBackground>
  );
}

export default StudentLogin;