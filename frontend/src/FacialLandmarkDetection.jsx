import { useEffect, useRef, useState } from "react";
import {FaceLandmarker, FilesetResolver} from "@mediapipe/tasks-vision";

const MEDIAPIPE_RUNTIME_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_LANDMARKER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

const THRESHOLDS = {
    detection: 0.6,
    presence: 0.6,
    tracking: 0.6,
};
export default function FaceLandmarks(){
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const landmarkerRef = useRef(null);
    const animationRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraOn, setCameraOn] = useState(false);
    const [status, setStatus] = useState("Idle (camera off)");
    const[error, setError] = useState("");
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height );
    };
    const drawPoints = (landmarks) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (!landmarks || landmarks.length === 0) return;
        context.fillStyle = "lime";
        for (const p of landmarks) {
            const x = p.x * canvas.width;
            const y = p.y * canvas.height;
            context.beginPath();
            context.arc(x, y, 1.6, 0, Math.PI * 2);
            context.fill();
        }
    };
    const loadLandmarker = async () => {
        if (landmarkerRef.current) return landmarkerRef.current;
        setStatus("Loading MediaPipe FaceLandmarker...");
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_RUNTIME_URL);
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL},
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: THRESHOLDS.detection,
            minFacePresenceConfidence: THRESHOLDS.presence,
            minTrackingConfidence: THRESHOLDS.tracking,
        });
        landmarkerRef.current = landmarker;
        setStatus("MediaPipe loaded.");
        return landmarker;
    };
    const stopCamera = () =>{
        setStatus("Camera Off");
        setError("");
        clearCanvas();
        if(animationRef.current)
            cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        const video = videoRef.current;
        if(video){
            video.pause();
            video.srcObject = null;
        }
        if(streamRef.current){
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        };
        const startCamera = async() => {
            setError("");
            try{
                await loadLandmarker();
                setStatus("Camera permission required");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {facingMode: "user"},
                    audio: false,
                });
                streamRef.current = stream;
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = stream;
                await new Promise((resolve) => (video.onloadedmetadata = resolve));
                await video.play();
                setStatus("Camera active. Tracking face landmarks..");
                const landmarker = landmarkerRef.current;
                const loop = () => {
                    if (!cameraOn) return;
                    const now = performance.now();
                    const res = landmarker.detectForVideo(video, now);
                    if(res.faceLandmarks[0]){
                        drawPoints(res.faceLandmarks[0]);
                    } else{
                        drawPoints(null);
                    }
                    animationRef.current = requestAnimationFrame(loop);
                };
                animationRef.current = requestAnimationFrame(loop);
            } catch (e) {
                console.error(e);
                setError("Could not start face tracking.");
                setStatus("Failed");
                setCameraOn(false);
                stopCamera();
            }
        };
        useEffect(() => {
            if(cameraOn) startCamera();
            else stopCamera();
        }, [cameraOn]);
        useEffect(() => {
            return() => stopCamera();
        },[]);
         return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Face Landmark Detection (MediaPipe)
      </h2>

      <p style={{ marginBottom: 12 }}>
        Status: <strong>{status}</strong>
      </p>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      <button
        onClick={() => setCameraOn((v) => !v)}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid black",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        {cameraOn ? "Disable Camera" : "Enable Camera"}
      </button>

      <div style={{ position: "relative", width: "100%" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={{ fontSize: 12, marginTop: 10, opacity: 0.8 }}>
        Privacy note: All face tracking runs locally in the browser. No video is uploaded.
      </div>
    </div>
  );
} 