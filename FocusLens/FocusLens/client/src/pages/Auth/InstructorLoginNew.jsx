import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import AuthBackground from "../../components/AuthBackground";

function InstructorLogin() {

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

      if (res.data.user.role !== "instructor") {
        alert("This account is not an Instructor account.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login Successful");

      navigate("/instructor-dashboard");

    } catch (err) {

      alert(err.response?.data?.message || "Login Failed");

    }
  };

  return (
    <AuthBackground>
      <div className="auth-container">
        <div className="auth-card">

          <h2 className="auth-title">Instructor Login</h2>

          <form onSubmit={handleLogin}>

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
            <Link to="/instructor-signup">
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </AuthBackground>
  );
}

export default InstructorLogin;