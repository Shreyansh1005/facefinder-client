import { useNavigate } from "react-router-dom";
import "../futuristic.css";

function RolePage() {

  const nav = useNavigate();

  const goAdmin = () => {
    nav("/start", { state: { role: "admin" } });
  };

  const goUser = () => {
    nav("/start", { state: { role: "user" } });
  };

  return (

    <div className="startContainer">

      <div className="ambient-glow"></div>

      <div className="heroBox central-glow">

        <div className="system-tag">
          ACCESS CONTROL
        </div>

        <h1 className="title">
          SELECT MODE
        </h1>

        <p className="subtitle">
          Choose authorization level
        </p>

        <div className="btnGroup">

          <button
            className="neonBtn action-btn"
            onClick={goAdmin}
          >
            ADMIN MODE
          </button>

          <button
            className="neonBtn action-btn"
            onClick={goUser}
          >
            USER MODE
          </button>

        </div>

      </div>

    </div>

  );
}

export default RolePage;