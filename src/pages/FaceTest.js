import * as faceapi from "face-api.js/dist/face-api.min.js";
import { useEffect, useState, useRef } from "react";

function SearchFace() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");

  const videoRef = useRef();
  const canvasRef = useRef();
  const resultsRef = useRef(); // Ref for auto-scrolling

  // ---------------- RESPONSIVE INLINE STYLES ----------------
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#05060f",
      padding: "clamp(15px, 5vw, 40px)",
      color: "#00f2ff",
      fontFamily: "'Segoe UI', Roboto, monospace",
      overflowX: "hidden"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid rgba(0, 242, 255, 0.2)",
      paddingBottom: "15px",
      marginBottom: "30px",
      flexWrap: "wrap",
      gap: "10px"
    },
    title: {
      fontSize: "clamp(1.2rem, 4vw, 2rem)",
      margin: 0,
      fontWeight: "900",
      letterSpacing: "2px",
      textShadow: "0 0 15px rgba(0, 242, 255, 0.5)"
    },
    statusTag: {
      fontSize: "12px",
      fontFamily: "monospace",
      background: "rgba(0, 242, 255, 0.1)",
      padding: "5px 12px",
      borderRadius: "20px",
      border: "1px solid rgba(0, 242, 255, 0.3)"
    },
    layout: {
      display: "flex",
      // Changed: Mobile uses column-reverse so Video stays on top, Sidebar (buttons) on bottom
      flexDirection: window.innerWidth < 1024 ? "column-reverse" : "row",
      gap: "30px",
    },
    sidebar: {
      flex: "0 0 280px",
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "20px",
      borderRadius: "15px",
      height: "fit-content"
    },
    btn: {
      width: "100%",
      padding: "14px",
      marginBottom: "12px",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      cursor: "pointer",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "1px",
      transition: "0.3s"
    },
    scannerBox: {
      flex: 1,
      position: "relative",
      background: "linear-gradient(45deg, #00f2ff, #7000ff)",
      padding: "6px",
      borderRadius: "16px",
      maxWidth: "640px",
      margin: "0 auto",
      width: "100%"
    },
    video: {
      width: "100%",
      borderRadius: "10px",
      display: "block",
      background: "#000"
    },
    previewThumb: {
      marginTop: "20px",
      padding: "10px",
      background: "rgba(0, 0, 0, 0.4)",
      borderRadius: "12px",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      textAlign: "center",
      maxWidth: "150px", // Reduced size for mobile
      margin: "20px auto 0"
    },
    resultGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: "25px",
      marginTop: "30px"
    },
    card: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      borderRadius: "15px",
      padding: "12px",
      textAlign: "center",
      transition: "0.3s"
    },
    downloadBtn: {
      marginTop: "12px",
      width: "100%",
      padding: "10px",
      background: "linear-gradient(90deg, #00f2ff, #7000ff)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "12px"
    }
  };

  // ---------------- LOGIC UPDATES ----------------

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  // NEW: Effect to hide preview image and scroll to results
  useEffect(() => {
    let timer;
    if (status === "NO_FACE" || status === "NO_MATCH") {
      // Auto-disappear captured image after 3 seconds if no match
      timer = setTimeout(() => {
        setImage(null);
        setStatus("SYSTEM_READY");
      }, 3000);
    }

    if (status === "MATCH_FOUND" && resultsRef.current) {
      // Auto-scroll to results section
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    return () => clearTimeout(timer);
  }, [status]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = stream;
      setStatus("LENS_ACTIVE");
    } catch {
      alert("Camera denied");
    }
  };

  const capture = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const img = canvas.toDataURL("image/png");
    setImage(img);
    await autoFindFace(img);
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    await autoFindFace(url);
  };

  const autoFindFace = async (imgSrc) => {
    setStatus("ANALYZING");
    const img = new Image();
    img.src = imgSrc;
    img.onload = async () => {
      const detect = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      
      if (!detect) {
        setStatus("NO_FACE");
        setMatches([]);
        return;
      }

      try {
        const res = await fetch("https://facefinder-server.onrender.com/api/photos");
        const photos = await res.json();
        const found = photos.filter(p => {
          if (!p.descriptor) return false;
          const dist = faceapi.euclideanDistance(detect.descriptor, new Float32Array(p.descriptor));
          return dist < 0.5;
        }).map(p => "https://facefinder-server.onrender.com/" + p.imagePath);

        setMatches(found);
        setStatus(found.length > 0 ? "MATCH_FOUND" : "NO_MATCH");
      } catch (err) {
        console.error("API Error", err);
        setStatus("ERROR");
      }
    };
  };

  const downloadImage = async (url, i) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `match_${i + 1}.jpg`;
      link.click();
    } catch {
      window.open(url);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>AI_TERMINAL v3</h2>
        <div style={styles.statusTag}>
          <span style={{ color: status === "MATCH_FOUND" || status === "LENS_ACTIVE" ? "#00ff88" : "#ff3e3e", marginRight: '8px' }}>●</span>
          {status}
        </div>
      </header>

      <div style={styles.layout}>
        {/* SIDEBAR (Now appears below camera on mobile) */}
        <div style={styles.sidebar}>
          <div style={{ marginBottom: '20px', fontSize: '11px', opacity: 0.5, letterSpacing: '1px' }}>CONTROLS</div>
          <button onClick={startCamera} style={styles.btn}>ACTIVATE LENS</button>
          <button onClick={capture} style={{ ...styles.btn, background: '#00f2ff', color: '#000' }}>FREEZE FRAME</button>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '8px', opacity: 0.6 }}>MANUAL_UPLOAD</label>
            <input type="file" onChange={handleImage} style={{ fontSize: '12px', color: '#00f2ff', width: '100%' }} />
          </div>

          {/* Captured Image Preview: Disappears on "No Match" via useEffect */}
          {image && (
            <div style={styles.previewThumb}>
              <div style={{ fontSize: '9px', marginBottom: '5px', opacity: 0.5 }}>CAPTURED</div>
              <img src={image} width="100%" alt="subject" style={{ borderRadius: '8px', border: '1px solid #00f2ff' }} />
            </div>
          )}
        </div>

        {/* SCANNER VIEW (Always on top for mobile) */}
        <div style={styles.scannerBox}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
            <div className="scanLine" style={{ position: 'absolute', width: '100%', height: '2px', background: '#00f2ff', top: 0, boxShadow: '0 0 15px #00f2ff', animation: 'scan 3s linear infinite' }}></div>
          </div>
        </div>
      </div>

      {/* RESULTS PANEL */}
      {matches.length > 0 && (
        <div ref={resultsRef} style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
          <h3 style={{ letterSpacing: '4px', fontSize: '16px', textAlign: 'center', marginBottom: '30px' }}>IDENTIFIED_MATCHES</h3>
          <div style={styles.resultGrid}>
            {matches.map((m, i) => (
              <div key={i} style={styles.card}>
                <div style={{ fontSize: '10px', textAlign: 'left', marginBottom: '8px', opacity: 0.4 }}>REF_0{i + 1}</div>
                <img src={m} width="100%" alt="match" style={{ height: '200px', objectFit: 'cover', borderRadius: '10px' }} />
                <button style={styles.downloadBtn} onClick={() => downloadImage(m, i)}>
                  DOWNLOAD_BIOMETRIC_DATA
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default SearchFace;