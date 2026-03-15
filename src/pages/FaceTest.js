import * as faceapi from "face-api.js/dist/face-api.min.js";
import { useEffect, useState, useRef } from "react";

function SearchFace() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");
  const videoRef = useRef();
  const canvasRef = useRef();

  // Inline Responsive Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#05060f',
      padding: 'clamp(15px, 5vw, 40px)',
      color: '#00f2ff',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      marginBottom: '30px',
      borderBottom: '1px solid rgba(0, 242, 255, 0.2)',
      paddingBottom: '15px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'window.innerWidth > 1024 ? "300px 1fr" : "1fr"',
      gap: '30px',
    },
    cameraWrapper: {
      position: 'relative',
      width: '100%',
      maxWidth: '640px',
      margin: '0 auto',
      padding: '8px',
      background: 'linear-gradient(45deg, #00f2ff, #7000ff)',
      borderRadius: '15px',
      boxShadow: '0 0 30px rgba(0, 242, 255, 0.2)'
    },
    video: {
      width: '100%',
      borderRadius: '10px',
      display: 'block',
      backgroundColor: '#000'
    },
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '25px',
      marginTop: '25px'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(0, 242, 255, 0.3)',
      borderRadius: '16px',
      padding: '15px',
      backdropFilter: 'blur(10px)'
    },
    btn: {
      width: '100%',
      padding: '14px',
      marginBottom: '10px',
      background: 'transparent',
      border: '1px solid #00f2ff',
      color: '#00f2ff',
      fontWeight: 'bold',
      cursor: 'pointer',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      console.log("Models loaded");
    };
    loadModels();
  }, []);

  // Trigger analysis automatically whenever 'image' state changes
  useEffect(() => {
    if (image) {
      autoFindFace();
    }
  }, [image]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStatus("LENS_ACTIVE");
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video.videoWidth) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imgData = canvas.toDataURL("image/png");
    setImage(imgData);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  const autoFindFace = async () => {
    setStatus("ANALYZING...");
    const tempImg = new Image();
    tempImg.src = image;
    tempImg.onload = async () => {
      const detections = await faceapi.detectSingleFace(tempImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      
      if (!detections) {
        setStatus("NO_FACE_DETECTED");
        return;
      }

      const res = await fetch("https://facefinder-server.onrender.com/api/photos");
      const photos = await res.json();
      const found = photos.filter(p => {
        if (!p.descriptor) return false;
        const dist = faceapi.euclideanDistance(detections.descriptor, new Float32Array(p.descriptor));
        return dist < 0.5;
      }).map(p => "https://facefinder-server.onrender.com/" + p.imagePath);

      setMatches(found);
      setStatus(found.length > 0 ? "MATCHES_IDENTIFIED" : "NO_MATCH_FOUND");
    };
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: 0, fontWeight: 900 }}>AI_TERMINAL v3.0</h1>
        <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          <span style={{ color: '#00ff88' }}>●</span> STATUS: {status}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: window.innerWidth < 1000 ? 'column' : 'row', gap: '30px' }}>
        {/* SIDEBAR */}
        <div style={{ flex: '0 0 300px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.6 }}>{">"} SESSION_START: {new Date().toLocaleTimeString()}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#00f2ff' }}>{">"} SCAN_MODE: AUTO_TRIGGER</p>
            <div style={{ marginTop: '20px' }}>
              <button onClick={startCamera} style={styles.btn}>ACTIVATE LENS</button>
              <button onClick={capture} style={{ ...styles.btn, background: '#00f2ff', color: '#000' }}>FREEZE FRAME</button>
              <input type="file" onChange={handleImage} style={{ fontSize: '12px', marginTop: '10px', width: '100%' }} />
            </div>
          </div>
        </div>

        {/* MAIN SCANNER */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={styles.cameraWrapper}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
              <video ref={videoRef} autoPlay style={styles.video} />
              <div className="scanLine" style={{ position: 'absolute', width: '100%', height: '2px', background: '#00f2ff', top: 0, boxShadow: '0 0 15px #00f2ff', animation: 'scan 3s linear infinite' }}></div>
            </div>
          </div>

          {image && (
            <div style={{ marginTop: '30px' }}>
              <p style={{ fontSize: '12px', letterSpacing: '2px' }}>LAST_CAPTURE</p>
              <img src={image} alt="subject" style={{ width: '150px', borderRadius: '10px', border: '2px solid #00f2ff', boxShadow: '0 0 20px rgba(0,242,255,0.3)' }} />
            </div>
          )}
        </div>
      </div>

      {/* RESULTS SECTION */}
      {matches.length > 0 && (
        <div style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
          <h2 style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}>IDENTIFIED_MATCHES</h2>
          <div style={styles.resultGrid}>
            {matches.map((m, i) => (
              <div key={i} style={styles.card}>
                <div style={{ fontSize: '10px', marginBottom: '10px', opacity: 0.5 }}>MATCH_REF_0{i + 1}</div>
                <img src={m} alt="match" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 'bold' }}>CONFIRMED</span>
                  <a href={m} download style={{ color: '#00f2ff', textDecoration: 'none', fontSize: '12px' }}>DOWNLOAD</a>
                </div>
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