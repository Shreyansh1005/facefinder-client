// import * as faceapi from "face-api.js";
import { useEffect, useState } from "react";

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Responsive Check for Inline Logic
  const isMobile = window.innerWidth < 768;

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#05060f',
      padding: 'clamp(10px, 4vw, 40px)',
      color: '#00f2ff',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(0, 242, 255, 0.2)',
      paddingBottom: '20px',
      marginBottom: '30px',
      flexWrap: 'wrap',
      gap: '10px'
    },
    title: {
      fontSize: 'clamp(1.2rem, 5vw, 2rem)',
      fontWeight: '900',
      letterSpacing: '2px',
      margin: 0,
      background: 'linear-gradient(to right, #fff, #00f2ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    layout: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '30px'
    },
    sidebar: {
      flex: isMobile ? '1' : '0 0 320px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '20px',
      height: 'fit-content'
    },
    logBox: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      marginBottom: '20px',
      borderLeft: '3px solid #7000ff',
      lineHeight: '1.6'
    },
    mainContent: {
      flex: 1
    },
    resultGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '20px'
    },
    previewCard: {
      background: 'rgba(5, 6, 15, 0.8)',
      border: '1px solid rgba(0, 242, 255, 0.2)',
      borderRadius: '12px',
      padding: '10px',
      textAlign: 'center',
      transition: '0.3s'
    },
    image: {
      width: '100%',
      height: '140px',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    commitBtn: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(90deg, #00f2ff, #7000ff)',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '900',
      cursor: 'pointer',
      boxShadow: '0 0 20px rgba(0, 242, 255, 0.3)',
      textTransform: 'uppercase',
      marginTop: '10px'
    }
  };

  // useEffect(() => {
  //   const loadModels = async () => {
  //     await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  //     await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  //     await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
  //     setStatus("SYSTEM_READY");
  //   };
  //   loadModels();
  // }, []);
  useEffect(() => {
  setStatus("SYSTEM_READY");
}, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setPreviews(selectedFiles.map(file => URL.createObjectURL(file)));
    setStatus("BATCH_LOADED");
    setProgress({ current: 0, total: selectedFiles.length });
  };

  const uploadBatch = async () => {
  setStatus("UPLOADING...");
  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    setProgress({ current: i + 1, total: files.length });

    const formData = new FormData();
    formData.append("image", files[i]);

    try {
      await fetch(
        "https://facefinder-server-1.onrender.com/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      successCount++;

    } catch (e) {
      console.error("Upload error", e);
    }
  }

  setStatus("UPLOAD_COMPLETE");

  alert(
    `Protocol finished. ${successCount} entries committed to database.`
  );
};

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>BATCH_UPLOAD_V3</h1>
        <div style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
          <span style={{ color: '#00ff88' }}>●</span> {status}
        </div>
      </header>

      <div style={styles.layout}>
        {/* CONTROL SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.logBox}>
            <div>{">"} NETWORK: SECURE_UPLINK</div>
            <div>{">"} BATCH_SIZE: {files.length}</div>
            <div style={{ color: '#00ff88' }}>{">"} PROGRESS: {progress.current}/{progress.total}</div>
          </div>

          <label style={{ fontSize: '10px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>LOAD BIOMETRIC SOURCE</label>
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange} 
            style={{ width: '100%', fontSize: '12px', marginBottom: '20px' }} 
          />

          <button 
            style={styles.commitBtn} 
            onClick={uploadBatch}
            disabled={files.length === 0 || status === "UPLOADING..."}
          >
            {status === "UPLOADING..." ? "ANALYZING..." : "COMMIT TO DATABASE"}
          </button>
        </aside>

        {/* PREVIEW AREA */}
        <main style={styles.mainContent}>
          {previews.length > 0 ? (
            <div style={styles.resultGrid}>
              {previews.map((url, idx) => (
                <div key={idx} style={styles.previewCard}>
                  <div style={{ fontSize: '9px', opacity: 0.4, textAlign: 'left', marginBottom: '5px' }}>REF_{idx}</div>
                  <img src={url} alt="preview" style={styles.image} />
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '10px', 
                    color: idx < progress.current ? '#00ff88' : '#666' 
                  }}>
                    {idx < progress.current ? "✓ PROCESSED" : "○ PENDING"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              height: '300px', 
              border: '1px dashed rgba(0, 242, 255, 0.2)', 
              borderRadius: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              opacity: 0.4
            }}>
              AWAITING BATCH DATA...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default UploadPage;