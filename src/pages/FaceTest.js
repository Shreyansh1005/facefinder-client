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
      // FIX: Use -webkit-fill-available for iOS height issues
      // minHeight: "100vh",
      minHeight: "-webkit-fill-available", 
      background: "#05060f",
      // FIX: Added padding-top to avoid the iOS notch
      padding: "calc(20px + env(safe-area-inset-top)) 15px env(safe-area-inset-bottom)",
      color: "#00f2ff",
      fontFamily: "'Segoe UI', Roboto, monospace",
      overflowX: "hidden",
      WebkitFontSmoothing: "antialiased"
    },
    header: {
      textAlign: "center",
      borderBottom: "1px solid rgba(0, 242, 255, 0.2)",
      paddingBottom: "10px",
      marginBottom: "20px",
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
      // Force column on mobile regardless of exact width for consistency
      flexDirection: window.innerWidth < 1024 ? "column" : "row",
      gap: "20px",
      alignItems: "center"
    },
    sidebar: {
      width: "100%",
      maxWidth: "320px",
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)", // Required for iOS
      border: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "20px",
      borderRadius: "15px",
    },
    btn: {
      width: "100%",
      padding: "12px",
      marginBottom: "12px",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      cursor: "pointer",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "1px",
      fontSize: "11px",
      borderRadius: "4px", // Ensure consistent radius on iOS
      WebkitAppearance: "none" // Remove iOS default button styling
    },
    scannerBox: {
      width: "100%",
      maxWidth: "480px",
      position: "relative",
      background: "linear-gradient(45deg, #00f2ff, #7000ff)",
      padding: "4px",
      borderRadius: "16px",
      margin: "0 auto",
      overflow: "hidden",
      WebkitMaskImage: "-webkit-radial-gradient(white, black)" // Fixes iOS border-radius overflow bug
    },
    hudStatus: {
      position: "absolute",
      top: "15px",
      left: "15px",
      zIndex: 10,
      background: "rgba(0, 0, 0, 0.75)",
      padding: "6px 12px",
      borderRadius: "4px",
      borderLeft: "3px solid #00f2ff",
      fontSize: "11px",
      fontWeight: "bold",
      fontFamily: "monospace",
      pointerEvents: "none",
      boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
    },
    video: {
      width: "100%",
      maxHeight: "300px",
      objectFit: "cover",
      borderRadius: "10px",
      display: "block",
      background: "#000",
      // FIX: Prevents iOS from forcing full-screen video
      WebkitTransform: "translateZ(0)" 
    },
    previewThumb: {
      marginTop: "15px",
      padding: "8px",
      background: "rgba(0, 0, 0, 0.4)",
      borderRadius: "10px",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      textAlign: "center",
      maxWidth: "100px",
      margin: "15px auto 0"
    },
    resultGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "20px",
      marginTop: "30px"
    },
    card: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(0, 242, 255, 0.2)",
      borderRadius: "15px",
      padding: "12px",
      textAlign: "center"
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
      fontSize: "11px",
      WebkitAppearance: "none"
    }
  };

  // ---------------- LOGIC ----------------

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
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
      // FIX: Added explicit constraints for iOS
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 } 
        } 
      });
      videoRef.current.srcObject = stream;
      setStatus("LENS_ACTIVE");
    } catch {
      alert("Camera denied. On iPhone, ensure Safari is allowed camera access in Settings.");
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

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    autoFindFace(url);
  };

  const autoFindFace = async (imgSrc) => {
    setStatus("ANALYZING");
    const img = new Image();
    img.src = imgSrc;
    img.onload = async () => {
      const detect = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
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
          return dist < 0.45;
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
        <h2 style={styles.title}>AI_TERMINAL v3</h2>
      </header>

      <div style={styles.layout}>
        <div style={styles.scannerBox}>
          <div style={styles.hudStatus}>
             <span style={{ color: status === "MATCH_FOUND" || status === "LENS_ACTIVE" ? "#00ff88" : "#ff3e3e", marginRight: '8px' }}>●</span>
             {status}
          </div>
          
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
            {/* playsInline is CRITICAL for iPhone to keep video inside the box */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={styles.video} 
            />
            <div className="scanLine" style={{ position: 'absolute', width: '100%', height: '2px', background: '#00f2ff', top: 0, boxShadow: '0 0 15px #00f2ff', animation: 'scan 3s linear infinite' }}></div>
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={{ marginBottom: '15px', fontSize: '10px', opacity: 0.5, letterSpacing: '1px' }}>SYSTEM_CONTROLS</div>
          <button onClick={startCamera} style={styles.btn}>ACTIVATE LENS</button>
          <button onClick={capture} style={{ ...styles.btn, background: '#00f2ff', color: '#000' }}>IDENTIFY SUBJECT</button>
          
          <div style={{ marginTop: '10px' }}>
            {/* Added style to file input for better iOS visibility */}
            <input type="file" onChange={handleImage} style={{ fontSize: '10px', color: '#00f2ff', width: '100%' }} />
          </div>

          {image && (
            <div style={styles.previewThumb}>
              <img src={image} width="100%" alt="subject" style={{ borderRadius: '4px', border: '1px solid #00f2ff' }} />
              <div style={{ fontSize: '8px', marginTop: '5px', opacity: 0.7 }}>CAPTURED_IMG</div>
            </div>
          )}
        </div>
      </div>

      {matches.length > 0 && (
        <div ref={resultsRef} style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
          <h3 style={{ letterSpacing: '4px', fontSize: '16px', textAlign: 'center', marginBottom: '30px' }}>IDENTIFIED_MATCHES</h3>
          <div style={styles.resultGrid}>
            {matches.map((m, i) => (
              <div key={i} style={styles.card}>
                <div style={{ fontSize: '10px', textAlign: 'left', marginBottom: '8px', opacity: 0.4 }}>REF_0{i + 1}</div>
                <img src={m} width="100%" alt="match" style={{ height: '180px', objectFit: 'cover', borderRadius: '10px' }} />
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
        /* Prevents tap highlight gray box on iOS */
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

export default SearchFace;