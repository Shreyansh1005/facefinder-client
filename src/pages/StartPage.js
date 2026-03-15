import { useNavigate, useLocation } from "react-router-dom";
import "../futuristic.css";

function StartPage() {

  const nav = useNavigate();
  const location = useLocation();

  const role = location.state?.role || "user";

  return (

    <div className="startContainer">

      <div className="ambient-glow"></div>

      <div className="heroBox central-glow">

        <div className="system-tag">
          BIOMETRIC SYSTEM v3.0
        </div>

        <h1 className="title">
          FACE FINDER AI
        </h1>

        <p className="subtitle">
          Secure Database Facial Recognition & Matching
        </p>

        <div className="btnGroup">

          {role === "admin" && (

            <button
              className="neonBtn action-btn"
              onClick={() => nav("/upload")}
            >
              DATABASE ENTRY
            </button>

          )}
          {role === "user" && (

            <button
              className="neonBtn action-btn"
              onClick={() => nav("/scan")}
            >
              LIVE TERMINAL
            </button>

          )}

        </div>

      </div>

    </div>

  );
}

export default StartPage;