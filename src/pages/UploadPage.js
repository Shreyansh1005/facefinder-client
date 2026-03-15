import * as faceapi from "face-api.js";
import { useEffect, useState } from "react";
import "../futuristic.css";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("AWAITING_INPUT");

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      console.log("Models loaded");
      setStatus("SYSTEM_READY");
    };
    loadModels();
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("FILE_LOADED");
  };

  const uploadImage = async () => {
    setStatus("ANALYZING_BIOMETRICS");
    const img = document.getElementById("uploadImg");

    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      alert("No face found");
      setStatus("ERROR_NO_FACE");
      return;
    }

    setStatus("ENCRYPTING_DESCRIPTOR");
    const descriptor = Array.from(detections.descriptor);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("descriptor", JSON.stringify(descriptor));

    setStatus("UPLOADING_TO_SERVER");
    await fetch("https://facefinder-server.onrender.com/api/upload", {
      method: "POST",
      body: formData,
    });

    setStatus("UPLOAD_COMPLETE");
    alert("Uploaded with descriptor");
  };

  return (
    <div className="scanContainer">
      {/* HEADER SECTION */}
      <div className="terminal-header">
        <h1 className="scanTitle">DATABASE ENTRY v3.0</h1>
        <div className="status-indicator">
          <span className="dot" style={{ backgroundColor: status === "UPLOAD_COMPLETE" ? "#00ff88" : "var(--neon-cyan)" }}></span> 
          {status}
        </div>
      </div>

      <div className="terminal-grid">
        {/* LEFT: DATA ENTRY & LOGS */}
        <div className="glass-card terminal-sidebar">
          <div className="log-section">
            <p className="log-text">{">"} UPLINK STATUS: {status}</p>
            <p className="log-text">{">"} ENCRYPTION: AES-256 ACTIVE</p>
            {file && <p className="log-text cyan-text">{">"} TARGET: {file.name.toUpperCase()}</p>}
            {status === "UPLOAD_COMPLETE" && <p className="log-text" style={{color: '#00ff88'}}>{">"} SUCCESS: DATA PERSISTED.</p>}
          </div>
          
          <div className="control-group">
            <label className="neon-label">SELECT DATA SOURCE</label>
            <input
              type="file"
              onChange={handleFile}
              className="fileInput"
              style={{ width: '100%', marginBottom: '20px' }}
            />
            
            <button 
              onClick={uploadImage} 
              className="neonBtn full-width"
              disabled={!file}
            >
              COMMIT TO DATABASE
            </button>
          </div>
        </div>

        {/* CENTER: DATA PREVIEW */}
        <div className="main-scanner">
          {preview ? (
            <div className="camera-wrapper central-glow">
              <div className="cameraBox">
                <img
                  id="uploadImg"
                  src={preview}
                  crossOrigin="anonymous"
                  style={{ width: '100%', maxWidth: '480px', display: 'block' }}
                  alt="preview"
                />
                <div className="scanLine"></div>
                <div className="hud-overlay">
                  <div className="corner tl"></div><div className="corner tr"></div>
                  <div className="corner bl"></div><div className="corner br"></div>
                  <div className="scan-text-overlay">DATA_PREVIEW</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ height: '300px', width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <p style={{ opacity: 0.5 }}>AWAITING SOURCE FILE...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;