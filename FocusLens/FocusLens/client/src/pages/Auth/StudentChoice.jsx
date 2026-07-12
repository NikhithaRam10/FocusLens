import { Link } from "react-router-dom";
import AuthBackground from "../../components/AuthBackground";
import "./Auth.css";

export default function StudentChoice(){
  return (
    <AuthBackground>
      <div className="auth-container">
        <div className="auth-card" style={{textAlign:'center'}}>
          <h2 className="auth-title">Student</h2>
          <p style={{color:'var(--text)', marginBottom:16}}>Do you want to login or create an account?</p>

          <div style={{display:'flex', gap:12, justifyContent:'center'}}>
            <Link to="/student-login"><button className="primary-btn">Login</button></Link>
            <Link to="/student-signup"><button className="secondary-btn">Sign Up</button></Link>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
