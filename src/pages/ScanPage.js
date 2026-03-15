import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

function ScanPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = "/models";

    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    startCamera();
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = stream;
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const canvas = canvasRef.current;
      const displaySize = {
        width: 400,
        height: 300,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const resized = faceapi.resizeResults(
        detections,
        displaySize
      );

      canvas
        .getContext("2d")
        .clearRect(0, 0, 400, 300);

      faceapi.draw.drawDetections(canvas, resized);
    }, 500);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Face Scanner</h2>

      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="400"
          height="300"
          onPlay={handleVideoOnPlay}
        />

        <canvas
          ref={canvasRef}
          width="400"
          height="300"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}

export default ScanPage;