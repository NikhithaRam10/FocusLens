import "./Landing.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthBackground from "../../components/AuthBackground";

function Landing() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [typed, setTyped] = useState("");

  // Typing loop: type -> pause -> delete -> repeat
  useEffect(() => {
    const full = "FocusLens";
    let idx = 0;
    let deleting = false;
    let timer = null;

    function tick() {
      setTyped((prev) => {
        if (!deleting) {
          const next = full.slice(0, idx + 1);
          return next;
        } else {
          const next = full.slice(0, idx - 1);
          return next;
        }
      });

      if (!deleting) {
        idx += 1;
        if (idx >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1000);
          return;
        }
        timer = setTimeout(tick, 120);
      } else {
        idx -= 1;
        if (idx <= 0) {
          deleting = false;
          timer = setTimeout(tick, 600);
          return;
        }
        timer = setTimeout(tick, 80);
      }
    }

    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, []);

  function handleMove(e) {
    const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMouse({ x, y });
  }

  const t1 = `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)`;
  const t2 = `translate3d(${mouse.x * -18}px, ${mouse.y * 14}px, 0)`;
  const t3 = `translate3d(${mouse.x * 10}px, ${mouse.y * -12}px, 0)`;

  return (
    <div onMouseMove={handleMove}>
      <AuthBackground>
        <header className="top-brand">FocusLens</header>

        <h1 className="title accent-gradient"><span>{typed || 'FocusLens'}</span><span className="typing-cursor">&nbsp;</span></h1>

        <div className="button-group">
          <Link to="/instructor-choice">
            <button className="primary-btn">Instructor</button>
          </Link>

          <Link to="/student-choice">
            <button className="primary-btn">Student</button>
          </Link>
        </div>

      </AuthBackground>
      <div className="floating-shapes" style={{ zIndex: 1 }}>
        <span className="blob b1" style={{ transform: t1 }} />
        <span className="blob b2" style={{ transform: t2 }} />
        <span className="blob b3" style={{ transform: t3 }} />
      </div>
    </div>
  );
}

export default Landing;