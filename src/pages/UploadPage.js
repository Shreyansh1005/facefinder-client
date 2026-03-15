import * as faceapi from "face-api.js";
import { useEffect, useState } from "react";
import "../futuristic.css";

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState("AWAITING_INPUT");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    
    // Create preview URLs for all selected images
    const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
    
    setStatus("BATCH_LOADED");
    setProgress({ current: 0, total: selectedFiles.length });
  };

  const uploadBatch = async () => {
    setStatus("BATCH_PROCESSING_START");
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length });
      setStatus(`ANALYZING_TARGET_${i + 1}`);

      // 1. Create a temporary image element to run face-api on
      const img = await faceapi.bufferToImage(file);

      // 2. Detect Face
      const detections = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        console.warn(`No face found in ${file.name}, skipping...`);
        continue;
      }

      // 3. Prepare Data
      const descriptor = Array.from(detections.descriptor);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("descriptor", JSON.stringify(descriptor));

      // 4. Upload
      try {
        await fetch("https://facefinder-server.onrender.com/api/upload", {
          method: "POST",
          body: formData,
        });
        successCount++;
      } catch (err) {
        console.error(`Upload failed for ${file.name}`, err);
      }
    }

    setStatus("UPLOAD_COMPLETE");
    alert(`Successfully processed ${successCount} of ${files.length} images.`);
  };

  return (
    <div className="scanContainer">
      <div className="terminal-header">
        <h1 className="scanTitle">BATCH DATABASE ENTRY</h1>
        <div className="status-indicator">
          <span className="dot" style={{ 
            backgroundColor: status === "UPLOAD_COMPLETE" ? "#00ff88" : "var(--neon-cyan)" 
          }}></span> 
          {status} {progress.total > 0 && `(${progress.current}/${progress.total})`}
        </div>
      </div>

      <div className="terminal-grid">
        <div className="glass-card terminal-sidebar">
          <div className="log-section">
            <p className="log-text">{">"} UPLINK STATUS: {status}</p>
            <p className="log-text">{">"} BATCH_SIZE: {files.length} ITEMS</p>
            {progress.total > 0 && (
              <p className="log-text cyan-text">
                {">"} PROCESSING: {Math.round((progress.current / progress.total) * 100)}%
              </p>
            )}
          </div>
          
          <div className="control-group">
            <label className="neon-label">SELECT MULTIPLE SOURCES</label>
            <input
              type="file"
              multiple // ALLOWS MULTIPLE SELECTION
              onChange={handleFileChange}
              className="fileInput"
              accept="image/*"
              style={{ width: '100%', marginBottom: '20px' }}
            />
            
            <button 
              onClick={uploadBatch} 
              className="neonBtn full-width"
              disabled={files.length === 0 || status.includes("ANALYZING")}
            >
              COMMIT BATCH TO DATABASE
            </button>
          </div>
        </div>

        <div className="main-scanner">
          {previews.length > 0 ? (
            <div className="resultGrid" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
              {previews.map((url, index) => (
                <div key={index} className="confirmed-entry" style={{ minHeight: 'auto', height: '200px' }}>
                  <div className="match-header">SOURCE_0{index + 1}</div>
                  <img src={url} alt="preview" style={{ height: '120px', objectFit: 'cover' }} />
                  <div className="match-status-tag" style={{ marginTop: '10px', fontSize: '8px' }}>
                    {index + 1 <= progress.current ? "PROCESSED" : "PENDING"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
              <p style={{ opacity: 0.5 }}>AWAITING BATCH SOURCES...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;