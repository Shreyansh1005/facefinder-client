import * as faceapi from "face-api.js/dist/face-api.min.js";
import { useEffect, useState, useRef } from "react";

function SearchFace() {

  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("SYSTEM_READY");

  const videoRef = useRef();
  const canvasRef = useRef();


  // ---------------- STYLES ----------------

  const styles = {

    container: {
      minHeight: "100vh",
      background: "#05060f",
      padding: "30px",
      color: "#00f2ff",
      fontFamily: "monospace"
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      borderBottom: "1px solid #00f2ff44",
      paddingBottom: "10px",
      marginBottom: "20px"
    },

    layout: {
      display: "flex",
      gap: "20px",
      flexWrap: "wrap"
    },

    sidebar: {
      width: "260px",
      border: "1px solid #00f2ff44",
      padding: "15px",
      borderRadius: "10px",
      background: "#0a0b1a"
    },

    btn: {
      width: "100%",
      padding: "12px",
      marginBottom: "10px",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      cursor: "pointer",
      fontWeight: "bold"
    },

    scannerBox: {
      border: "2px solid #00f2ff",
      borderRadius: "10px",
      padding: "10px",
      boxShadow: "0 0 20px #00f2ff55"
    },

    resultGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
      gap: "15px",
      marginTop: "20px"
    },

    card: {
      border: "1px solid #00f2ff44",
      borderRadius: "10px",
      padding: "10px",
      background: "#0a0b1a"
    },

    downloadBtn: {
      marginTop: "10px",
      width: "100%",
      border: "1px solid #00f2ff",
      background: "transparent",
      color: "#00f2ff",
      cursor: "pointer",
      padding: "6px"
    }

  };


  // ---------------- LOAD MODELS ----------------

  useEffect(() => {

    const loadModels = async () => {

      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

    };

    loadModels();

  }, []);


  // ---------------- CAMERA ----------------

  const startCamera = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true
        });

      videoRef.current.srcObject = stream;

      setStatus("LENS_ACTIVE");

    } catch {

      alert("Camera denied");

    }

  };


  // ---------------- CAPTURE ----------------

  const capture = async () => {

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas
      .getContext("2d")
      .drawImage(video, 0, 0);

    const img =
      canvas.toDataURL("image/png");

    setImage(img);

    await autoFindFace(img);

  };


  // ---------------- UPLOAD ----------------

  const handleImage = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const url =
      URL.createObjectURL(file);

    setImage(url);

    await autoFindFace(url);

  };


  // ---------------- FACE MATCH ----------------

  const autoFindFace = async (imgSrc) => {

    setStatus("ANALYZING");

    const img = new Image();

    img.src = imgSrc;

    img.onload = async () => {

      const detect =
        await faceapi
          .detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detect) {

        setStatus("NO_FACE");

        setMatches([]);

        return;
      }


      const res =
        await fetch(
          "https://facefinder-server.onrender.com/api/photos"
        );

      const photos =
        await res.json();


      const found =
        photos
          .filter(p => {

            if (!p.descriptor)
              return false;

            const dist =
              faceapi.euclideanDistance(
                detect.descriptor,
                new Float32Array(
                  p.descriptor
                )
              );

            return dist < 0.5;

          })
          .map(p =>
            "https://facefinder-server.onrender.com/" +
            p.imagePath
          );


      setMatches(found);

      setStatus(
        found.length > 0
          ? "MATCH_FOUND"
          : "NO_MATCH"
      );

    };

  };


  // ---------------- DOWNLOAD ----------------

  const downloadImage = async (url, i) => {

    try {

      const res =
        await fetch(url);

      const blob =
        await res.blob();

      const link =
        document.createElement("a");

      link.href =
        URL.createObjectURL(blob);

      link.download =
        `match_${i + 1}.jpg`;

      link.click();

    } catch {

      window.open(url);

    }

  };


  // ---------------- UI ----------------

  return (

    <div style={styles.container}>


      <div style={styles.header}>

        <h2>AI_TERMINAL v3</h2>

        <div>Status: {status}</div>

      </div>


      <div style={styles.layout}>


        {/* SIDEBAR */}

        <div style={styles.sidebar}>

          <button
            onClick={startCamera}
            style={styles.btn}
          >
            ACTIVATE LENS
          </button>

          <button
            onClick={capture}
            style={styles.btn}
          >
            FREEZE FRAME
          </button>

          <input
            type="file"
            onChange={handleImage}
          />

        </div>


        {/* CAMERA */}

        <div style={styles.scannerBox}>

          <video
            ref={videoRef}
            autoPlay
            width="420"
          />

          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
          />

          {image && (

            <div>

              <p>LAST CAPTURE</p>

              <img
                src={image}
                width="150"
                alt=""
              />

            </div>

          )}

        </div>

      </div>


      {/* RESULTS */}

      {matches.length > 0 && (

        <div>

          <h3>IDENTIFIED MATCHES</h3>

          <div style={styles.resultGrid}>

            {matches.map((m, i) => (

              <div
                key={i}
                style={styles.card}
              >

                <img
                  src={m}
                  width="100%"
                  alt=""
                />

                <button
                  style={styles.downloadBtn}
                  onClick={() =>
                    downloadImage(m, i)
                  }
                >
                  DOWNLOAD
                </button>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>

  );

}

export default SearchFace;