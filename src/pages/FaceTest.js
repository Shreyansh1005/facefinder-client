import * as faceapi from "face-api.js";
import { useEffect, useState, useRef } from "react";
import "../futuristic.css";

function SearchFace() {
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      console.log("Models loaded");
    };
    loadModels();
  }, []);

  const downloadImage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Extracts filename from path or defaults to 'match.png'
    const filename = imageUrl.split('/').pop() || 'biometric_match.png';
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed", error);
    // Fallback: try opening in new tab if blob fetch fails
    window.open(imageUrl, "_blank");
  }
};
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = canvas.toDataURL("image/png");
    setImage(img);
  };

  const findFace = async () => {
    const img = document.getElementById("inputImg");
    if (!img) { alert("No image"); return; }
    const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!detections) { alert("No face found"); return; }
    const descriptor = detections.descriptor;
    const res = await fetch("https://facefinder-server.onrender.com/api/photos");
    const photos = await res.json();
    let found = [];
    photos.forEach((p) => {
      if (!p.descriptor || p.descriptor.length === 0) return;
      const dist = faceapi.euclideanDistance(descriptor, new Float32Array(p.descriptor));
      if (dist < 0.5) { found.push("https://facefinder-server.onrender.com/" + p.imagePath); }
    });
    if (found.length > 0) { setMatches(found); } else { alert("No Match"); }
  };

  return (
    <div className="scanContainer">
      <div className="terminal-header">
        <h1 className="scanTitle">LIVE TERMINAL v3.0</h1>
        <div className="status-indicator">
          <span className="dot"></span> SYSTEM ONLINE
        </div>
      </div>

      <div className="terminal-grid">
        {/* LEFT: CONTROLS & LOGS */}
        <div className="glass-card terminal-sidebar">
          <div className="log-section">
            <p className="log-text">{">"} INITIALIZING BIOMETRIC PROTOCOLS...</p>
            <p className="log-text">{">"} NEURAL NETWORKS LOADED.</p>
            {image && <p className="log-text cyan-text">{">"} SUBJECT CAPTURED. READY FOR ANALYSIS.</p>}
          </div>
          
          <div className="control-group">
            <button onClick={startCamera} className="neonBtn full-width">ACTIVATE LENS</button>
            <button onClick={capture} className="neonBtn full-width">FREEZE FRAME</button>
            <div className="upload-alt">
              <span>OR LOAD DATA:</span>
              <input type="file" onChange={handleImage} className="fileInput" />
            </div>
          </div>
        </div>

        {/* CENTER: LIVE HUD */}
        <div className="main-scanner">
          <div className="camera-wrapper central-glow">
            <div className="cameraBox">
              <video ref={videoRef} autoPlay width="480" />
              <div className="scanLine"></div>
              <div className="hud-overlay">
                <div className="corner tl"></div><div className="corner tr"></div>
                <div className="corner bl"></div><div className="corner br"></div>
                <div className="scan-text-overlay">AI_CORE_ACTIVE</div>
              </div>
            </div>
          </div>
          
          {image && (
            <div className="preview-zone">
              <img id="inputImg" src={image} crossOrigin="anonymous" className="preview-glow" />
              <button onClick={findFace} className="neonBtn scan-trigger">RUN BIOMETRIC MATCH</button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: MATCH RESULTS */}
      {matches.length > 0 && (
        <div className="results-panel glass-card">
          <h2 className="match-title">IDENTIFIED MATCHES</h2>
          <div className="resultGrid">
            {matches.length > 0 && (
  <div className="results-panel glass-card">
    <h2 className="match-title">IDENTIFIED MATCHES</h2>
    <div className="resultGrid">
      {matches.map((m, i) => (
        <div key={i} className="match-card confirmed-entry">
          <div className="match-header">MATCH #{i + 1}</div>
          <img src={m} alt="match" />
          
          <div className="match-footer">
            <div className="match-status-tag">CONFIRMED</div>
            <button 
              onClick={() => downloadImage(m)} 
              className="neonBtn download-main-btn"
            >
              <span className="icon">⬇</span> DOWNLOAD DATA
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

export default SearchFace;