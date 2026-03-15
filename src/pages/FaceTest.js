import * as faceapi from "face-api.js/dist/face-api.min.js";
import { useEffect, useState, useRef } from "react";

function SearchFace() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");

  const videoRef = useRef();
  const canvasRef = useRef();
  const resultsRef = useRef();

  // ---------------- RESPONSIVE INLINE STYLES ----------------
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#05060f",
      padding: "20px 15px",
      color: "#00f2ff",
      fontFamily: "'Segoe UI', Roboto, monospace",
      overflowX: "hidden"
    },
    header: {
      textAlign: "center",
      borderBottom: "1px solid rgba(0, 242, 255, 0.2)",
      paddingBottom: "10px",
      marginBottom: "20px"
    },
    title: {
      fontSize: "1.2rem",
      margin: 0,
      fontWeight: "900",
      letterSpacing: "3px",
      textShadow: "0 0 10px rgba(0, 242, 255, 0.5)"
    },
    layout: {
      display: "flex",
      flexDirection: window.innerWidth < 1024 ? "column" : "row",
      gap: "20px",
      alignItems: "center",
      justifyContent: "center"
    },
    sidebar: {
      width: "100%",
      maxWidth: "320px",
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "15px",
      borderRadius: "15px",
      textAlign: "center"
    },
    btn: {
      width: "100%",
      padding: "12px",
      marginBottom: "10px",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "1px"
    },
    scannerBox: {
      width: "100%",
      maxWidth: "450px", // Reduced camera area
      position: "relative",
      background: "linear-gradient(45deg, #00f2ff, #7000ff)",
      padding: "3px",
      borderRadius: "12px",
      overflow: "hidden"
    },
    hudStatus: {
      position: "absolute",
      top: "10px",
      left: "10px",
      zIndex: 10,
      background: "rgba(0, 0, 0, 0.7)",
      padding: "5px 10px",
      borderRadius: "4px",
      borderLeft: "3px solid #00f2ff",
      fontSize: "10px",
      fontFamily: "monospace",
      pointerEvents: "none",
      textTransform: "uppercase"
    },
    video: {
      width: "100%",
      maxHeight: "300px", // Limits camera height on phone
      objectFit: "cover",
      borderRadius: "10px",
      display: "block",
      background: "#000"
    },
    previewThumb: {
      marginTop: "10px",
      padding: "5px",
      background: "rgba(0, 0, 0, 0.5)",
      borderRadius: "8px",
      border: "1px solid rgba(0, 242, 255, 0.3)",
      width: "80px", // Smaller captured image
      margin: "10px auto 0"
    },
    resultGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "15px",
      marginTop: "20px"
    },
    card: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      borderRadius: "12px",
      padding: "10px",
      textAlign: "center"
    },
    downloadBtn: {
      marginTop: "10px",
      width: "100%",
      padding: "8px",
      background: "linear-gradient(90deg, #00f2ff, #7000ff)",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "10px"
    }
  };

  // ---------------- LOGIC ----------------

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  useEffect(() => {
    let timer;
    if (status === "NO_FACE" || status === "NO_MATCH") {
      timer = setTimeout(() => {
        setImage(null);
        setStatus("SYSTEM_READY");
      }, 3000);
    }

    if (status === "MATCH_FOUND" && resultsRef.current) {
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
      alert("Camera access denied");
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
        setStatus("SERVER_ERROR");
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
        <h2 style={styles.title}>BIOMETRIC_SCAN_v3</h2>
      </header>

      <div style={styles.layout}>
        {/* SCANNER VIEW */}
        <div style={styles.scannerBox}>
          {/* Status integrated near camera */}
          <div style={styles.hudStatus}>
             <span style={{ color: status === "MATCH_FOUND" || status === "LENS_ACTIVE" ? "#00ff88" : "#ff3e3e", marginRight: '5px' }}>●</span>
             {status}
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
            <video ref={videoRef} autoPlay playsInline style={styles.video} />
            <div className="scanLine" style={{ position: 'absolute', width: '100%', height: '2px', background: '#00f2ff', top: 0, boxShadow: '0 0 15px #00f2ff', animation: 'scan 2.5s linear infinite' }}></div>
          </div>
        </div>

        {/* SIDEBAR / CONTROLS */}
        <div style={styles.sidebar}>
          <button onClick={startCamera} style={styles.btn}>ACTIVATE LENS</button>
          <button onClick={capture} style={{ ...styles.btn, background: '#00f2ff', color: '#000' }}>IDENTIFY SUBJECT</button>
          
          <div style={{ marginTop: '10px' }}>
            <input type="file" onChange={handleImage} style={{ fontSize: '10px', color: '#00f2ff', width: '100%' }} />
          </div>

          {image && (
            <div style={styles.previewThumb}>
              <img src={image} width="100%" alt="subject" style={{ borderRadius: '4px' }} />
            </div>
          )}
        </div>
      </div>

      {/* RESULTS PANEL */}
      {matches.length > 0 && (
        <div ref={resultsRef} style={{ marginTop: '40px', borderTop: '1px solid rgba(0,242,255,0.2)', paddingTop: '20px' }}>
          <h3 style={{ letterSpacing: '2px', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>IDENTIFIED_MATCHES</h3>
          <div style={styles.resultGrid}>
            {matches.map((m, i) => (
              <div key={i} style={styles.card}>
                <img src={m} width="100%" alt="match" style={{ height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                <button style={styles.downloadBtn} onClick={() => downloadImage(m, i)}>
                  DOWNLOAD_DATA
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