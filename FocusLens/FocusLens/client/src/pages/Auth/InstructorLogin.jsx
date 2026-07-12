import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function InstructorLogin() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Instructor Login</h2>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="Enter Email" />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Enter Password" />
        </div>

        <button className="primary-btn" onClick={() => navigate("/instructor-dashboard")}>Login</button>

        <button className="google-btn" onClick={() => alert('Google Sign-In placeholder')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.6 12.23c0-.72-.06-1.41-.18-2.07H12v3.92h5.35c-.23 1.26-.92 2.33-1.98 3.05v2.53h3.2c1.87-1.72 2.93-4.27 2.93-7.43z" fill="#4285F4"/>
            <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.2-2.53c-.88.6-2.02.96-3.43.96-2.64 0-4.88-1.78-5.67-4.18H2.9v2.62C4.56 19.93 7.99 22 12 22z" fill="#34A853"/>
            <path d="M6.33 13.8A6.998 6.998 0 0 1 6 12c0-.66.09-1.3.25-1.9V7.48H2.9A10.98 10.98 0 0 0 2 12c0 1.78.42 3.46 1.17 4.98l3.16-3.18z" fill="#FBBC05"/>
            <path d="M12 6.5c1.47 0 2.8.5 3.84 1.48l2.88-2.88C16.95 3.58 14.7 2.5 12 2.5 7.99 2.5 4.56 4.57 2.9 7.38l3.58 2.62C7.12 8.28 9.36 6.5 12 6.5z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider" />

        <h3 className="auth-subtitle">Create an account</h3>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" placeholder="Your name" />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="Your email" />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Create Password" />
        </div>

        <button className="primary-btn" onClick={() => navigate("/instructor-dashboard")}>Sign Up</button>
      </div>
    </div>
  );
}

export default InstructorLogin;