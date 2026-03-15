import * as faceapi from "face-api.js/dist/face-api.min.js";
import { useEffect, useState, useRef } from "react";

function SearchFace() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [isIos, setIsIos] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const resultsRef = useRef();

  // Detect platform on mount
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));
  }, []);

  // ---------------- STYLES ----------------
  const styles = {
    container: {
      // minHeight: "100vh",git
      minHeight: "-webkit-fill-available",
      background: "#05060f",
      padding: "calc(20px + env(safe-area-inset-top)) 20px 40px",
      color: "#00f2ff",
      fontFamily: "'Segoe UI', Roboto, monospace",
    },
    title: {
      fontSize: "1.4rem",
      textAlign: "center",
      fontWeight: "900",
      letterSpacing: "4px",
      margin: "0 0 30px 0",
      textShadow: "0 0 10px rgba(0, 242, 255, 0.5)"
    },
    // iPhone Specific: Large centered upload area
    iosUploadZone: {
      width: "100%",
      maxWidth: "400px",
      margin: "0 auto",
      aspectRatio: "1/1",
      border: "2px dashed rgba(0, 242, 255, 0.3)",
      borderRadius: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255, 255, 255, 0.02)",
      cursor: "pointer",
      position: "relative"
    },
    // Android Specific: Scanner Box
    scannerBox: {
      width: "100%",
      maxWidth: "480px",
      position: "relative",
      background: "linear-gradient(45deg, #00f2ff, #7000ff)",
      padding: "4px",
      borderRadius: "16px",
      margin: "0 auto 25px"
    },
    video: {
      width: "100%",
      maxHeight: "350px",
      objectFit: "cover",
      borderRadius: "12px",
      display: "block",
      background: "#000"
    },
    hudStatus: {
      textAlign: "center",
      fontSize: "10px",
      letterSpacing: "2px",
      marginBottom: "20px",
      color: status === "MATCH_FOUND" ? "#00ff88" : "#00f2ff"
    },
    btn: {
      width: "100%",
      padding: "16px",
      marginBottom: "12px",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      fontWeight: "900",
      textTransform: "uppercase",
      fontSize: "12px",
      borderRadius: "8px",
      WebkitAppearance: "none"
    },
    resultGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "20px",
      marginTop: "40px"
    }
  };

  // ---------------- LOGIC ----------------
  useEffect(() => {
    const loadModels = async () => {
      const URI = "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(URI);
      await faceapi.nets.faceLandmark68Net.loadFromUri(URI);
      await faceapi.nets.faceRecognitionNet.loadFromUri(URI);
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = stream;
      setStatus("LENS_ACTIVE");
    } catch { alert("Camera Error"); }
  };

  const capture = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const img = canvas.toDataURL("image/png");
    setImage(img);
    autoFindFace(img);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    autoFindFace(url);
  };

  const autoFindFace = async (imgSrc) => {
    setStatus("ANALYZING_BIOMETRICS");
    const img = new Image();
    img.src = imgSrc;
    img.onload = async () => {
      const detect = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
      if (!detect) { setStatus("NO_FACE_DETECTED"); return; }
      
      try {
        const res = await fetch("https://facefinder-server.onrender.com/api/photos");
        const photos = await res.json();
        const found = photos.filter(p => {
          if (!p.descriptor) return false;
          return faceapi.euclideanDistance(detect.descriptor, new Float32Array(p.descriptor)) < 0.45;
        }).map(p => "https://facefinder-server.onrender.com/" + p.imagePath);

        setMatches(found);
        setStatus(found.length > 0 ? "MATCH_FOUND" : "NO_MATCH_IN_DATABASE");
        if (found.length > 0) resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch { setStatus("SERVER_ERROR"); }
    };
  };

  // ---------------- RENDER ----------------
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{isIos ? "iOS_PORTAL v3" : "DROID_TERMINAL v3"}</h2>
      <div style={styles.hudStatus}>[ {status} ]</div>

      {isIos ? (
        /* IPHONE VIEW: Elegant, centered file processing */
        <div style={{ textAlign: 'center' }}>
          <label style={styles.iosUploadZone}>
            {image ? (
              <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} alt="capture" />
            ) : (
              <>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>⊕</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>UPLOAD BIOMETRIC DATA</div>
                <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '8px' }}>SUPPORTED: JPEG, PNG, HEIC</div>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <p style={{ fontSize: '10px', marginTop: '20px', opacity: 0.4 }}>Tap zone to capture or select photo</p>
        </div>
      ) : (
        /* ANDROID VIEW: Full Lens / Scanner interface */
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={styles.scannerBox}>
            <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
            <div className="scanLine" style={{ position: 'absolute', width: '100%', height: '2px', background: '#00f2ff', top: 0, boxShadow: '0 0 15px #00f2ff', animation: 'scan 3s linear infinite' }}></div>
          </div>
          <button onClick={startCamera} style={styles.btn}>INITIALIZE LENS</button>
          <button onClick={capture} style={{ ...styles.btn, background: '#00f2ff', color: '#000' }}>SCAN SUBJECT</button>
          <input type="file" onChange={handleFileUpload} style={{ fontSize: '10px', marginTop: '10px' }} />
        </div>
      )}

      {/* MATCH RESULTS (Same for both) */}
      {matches.length > 0 && (
        <div ref={resultsRef} style={{ marginTop: '50px' }}>
          <h3 style={{ fontSize: '14px', textAlign: 'center', letterSpacing: '3px' }}>IDENTIFIED_RECORDS</h3>
          <div style={styles.resultGrid}>
            {matches.map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,242,255,0.2)' }}>
                <img src={m} width="100%" alt="match" style={{ height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                <button style={{ width: '100%', marginTop: '10px', padding: '8px', background: '#00f2ff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }} onClick={() => window.open(m)}>
                  VIEW_DATA
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <style>{`
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

export default SearchFace;