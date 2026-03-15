import { useNavigate, useLocation } from "react-router-dom";

function StartPage() {
  const nav = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "user";

  // ---------------- RESPONSIVE INLINE STYLES ----------------
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#05060f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      overflow: "hidden",
      position: "relative",
      fontFamily: "'Segoe UI', Roboto, monospace",
    },
    ambientGlow: {
      position: "absolute",
      width: "100%",
      height: "100%",
      background: "radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.05) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    heroBox: {
      position: "relative",
      width: "100%",
      maxWidth: "600px",
      padding: "clamp(30px, 8vw, 60px)",
      background: "rgba(255, 255, 255, 0.02)",
      backdropFilter: "blur(15px)",
      borderRadius: "20px",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      textAlign: "center",
      boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
      animation: "float 6s ease-in-out infinite",
    },
    systemTag: {
      fontSize: "10px",
      letterSpacing: "4px",
      color: "#00f2ff",
      opacity: 0.6,
      marginBottom: "15px",
      textTransform: "uppercase",
    },
    title: {
      fontSize: "clamp(2rem, 8vw, 3.5rem)",
      margin: "0 0 10px 0",
      fontWeight: "900",
      color: "#fff",
      letterSpacing: "2px",
      textShadow: "0 0 20px rgba(0, 242, 255, 0.6)",
    },
    subtitle: {
      fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
      color: "rgba(0, 242, 255, 0.7)",
      marginBottom: "40px",
      lineHeight: "1.6",
      maxWidth: "400px",
      margin: "0 auto 40px auto",
    },
    btnGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      alignItems: "center",
    },
    neonBtn: {
      width: "100%",
      maxWidth: "280px",
      padding: "16px 30px",
      fontSize: "14px",
      fontWeight: "900",
      letterSpacing: "2px",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: "transparent",
      color: "#00f2ff",
      border: "1px solid #00f2ff",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 0 15px rgba(0, 242, 255, 0.2)",
    },
    // Corner brackets for that "Targeting" look
    corner: {
      position: "absolute",
      width: "20px",
      height: "20px",
      borderColor: "#00f2ff",
      borderStyle: "solid",
      opacity: 0.5,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.ambientGlow}></div>
      
      {/* Background Animated Scan Line */}
      <div className="bg-scanline"></div>

      <div style={styles.heroBox}>
        {/* Decorative Corners */}
        <div style={{ ...styles.corner, top: 0, left: 0, borderTopWidth: '2px', borderLeftWidth: '2px', borderRadius: '15px 0 0 0' }}></div>
        <div style={{ ...styles.corner, top: 0, right: 0, borderTopWidth: '2px', borderRightWidth: '2px', borderRadius: '0 15px 0 0' }}></div>
        <div style={{ ...styles.corner, bottom: 0, left: 0, borderBottomWidth: '2px', borderLeftWidth: '2px', borderRadius: '0 0 0 15px' }}></div>
        <div style={{ ...styles.corner, bottom: 0, right: 0, borderBottomWidth: '2px', borderRightWidth: '2px', borderRadius: '0 0 15px 0' }}></div>

        <div style={styles.systemTag}>PROTOCOL_INITIATED // v3.0</div>

        <h1 style={styles.title}>FACE FINDER AI</h1>

        <p style={styles.subtitle}>
          {role === "admin" 
            ? "Biometric Database Management & Administrative Terminal." 
            : "High-speed Facial Recognition & Identity Verification Terminal."}
        </p>

        <div style={styles.btnGroup}>
          {role === "admin" ? (
            <button
              className="neon-btn-hover"
              style={styles.neonBtn}
              onClick={() => nav("/upload")}
            >
              DATABASE ENTRY
            </button>
          ) : (
            <button
              className="neon-btn-hover"
              style={{ ...styles.neonBtn, background: "rgba(0, 242, 255, 0.1)" }}
              onClick={() => nav("/scan")}
            >
              LIVE TERMINAL
            </button>
          )}
          
          <div style={{ marginTop: '20px', fontSize: '10px', opacity: 0.4 }}>
            STATUS: <span style={{ color: '#00ff88' }}>SYSTEMS_OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .neon-btn-hover:hover {
          background: #00f2ff !important;
          color: #000 !important;
          box-shadow: 0 0 30px rgba(0, 242, 255, 0.8) !important;
          transform: scale(1.05);
        }

        .bg-scanline {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(0, 242, 255, 0.03) 50%,
            transparent
          );
          background-size: 100% 4px;
          animation: scanmove 4s linear infinite;
          pointer-events: none;
        }

        @keyframes scanmove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

export default StartPage;