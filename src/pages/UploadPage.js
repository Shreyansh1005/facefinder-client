import * as faceapi from "face-api.js";
import { useEffect, useState } from "react";

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState("AWAITING_INPUT");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Inline Style Objects
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#05060f',
      padding: '40px',
      color: '#00f2ff',
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      borderBottom: '1px solid rgba(0, 242, 255, 0.2)',
      paddingBottom: '15px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '900',
      letterSpacing: '2px',
      margin: 0,
      background: 'linear-gradient(to right, #fff, #00f2ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(300px, 1fr) 3fr',
      gap: '30px'
    },
    sidebar: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '25px',
      height: 'fit-content'
    },
    logBox: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      marginBottom: '20px',
      borderLeft: '2px solid #00f2ff'
    },
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '20px',
      padding: '10px'
    },
    card: {
      border: '1px solid rgba(0, 242, 255, 0.3)',
      background: 'rgba(5, 6, 15, 0.9)',
      borderRadius: '12px',
      padding: '12px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    img: {
      width: '100%',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    neonBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#00f2ff',
      border: '1px solid #00f2ff',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textTransform: 'uppercase',
      transition: '0.3s'
    },
    commitBtn: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(90deg, #00f2ff, #7000ff)',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 0 15px rgba(0, 242, 255, 0.4)'
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      setStatus("SYSTEM_READY");
    };
    loadModels();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setPreviews(selectedFiles.map(file => URL.createObjectURL(file)));
    setStatus("BATCH_LOADED");
    setProgress({ current: 0, total: selectedFiles.length });
  };

  const uploadBatch = async () => {
    setStatus("PROCESSING");
    let success = 0;
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const img = await faceapi.bufferToImage(files[i]);
      const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        const formData = new FormData();
        formData.append("image", files[i]);
        formData.append("descriptor", JSON.stringify(Array.from(detections.descriptor)));
        await fetch("https://facefinder-server.onrender.com/api/upload", { method: "POST", body: formData });
        success++;
      }
    }
    setStatus("UPLOAD_COMPLETE");
    alert(`Done: ${success} images added to neural database.`);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>NEURAL UPLOAD v3.1</h1>
        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          STATUS: <span style={{ color: '#00ff88' }}>{status}</span>
        </div>
      </header>

      <div style={styles.grid}>
        <aside style={styles.sidebar}>
          <div style={styles.logBox}>
            <p style={{ margin: '5px 0' }}>{">"} SESSION_START: {new Date().toLocaleTimeString()}</p>
            <p style={{ margin: '5px 0' }}>{">"} BATCH: {files.length} ITEMS</p>
            <p style={{ margin: '5px 0', color: '#00f2ff' }}>{">"} PROGRESS: {progress.current}/{progress.total}</p>
          </div>

          <label style={{ display: 'block', fontSize: '10px', marginBottom: '10px', opacity: 0.7 }}>SOURCE SELECTION</label>
          <input type="file" multiple onChange={handleFileChange} style={{ marginBottom: '20px', width: '100%' }} />
          
          <button 
            style={files.length > 0 ? styles.commitBtn : styles.neonBtn} 
            onClick={uploadBatch}
            disabled={files.length === 0 || status === "PROCESSING"}
          >
            {status === "PROCESSING" ? "ANALYZING..." : "COMMIT BATCH"}
          </button>
        </aside>

        <main>
          {previews.length > 0 ? (
            <div style={styles.resultGrid}>
              {previews.map((url, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={{ fontSize: '9px', textAlign: 'left', marginBottom: '8px', opacity: 0.6 }}>IMG_REF_{idx}</div>
                  <img src={url} alt="preview" style={styles.img} />
                  <div style={{ fontSize: '10px', color: idx < progress.current ? '#00ff88' : '#666' }}>
                    {idx < progress.current ? "● ENCRYPTED" : "○ PENDING"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(0, 242, 255, 0.2)', borderRadius: '20px' }}>
              <p style={{ opacity: 0.3, letterSpacing: '2px' }}>AWAITING SOURCE DATA...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UploadPage;