import React from "react";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js"

const MODEL_BASE_URL = "/models";
const FACE_DETECTION_DIR = `${MODEL_BASE_URL}/face_detection`;
const EXPRESSION_MODEL_DIR = `${MODEL_BASE_URL}/facial_expression_recognition`;

const DETECTION_INTERVAL_MS = 200;
function getDominantExpression(expressions) {
    if (!expressions) return { label: "none", confidence: 0};
    let best = { label: "none", confidence: 0};
    for (const[k,v] of Object.entries(expressions)){
        if (v > best.confidence) best = { label: k, confidence: v};
    }
    return best;
}
function formatLabel(label){
    const map = {
        happy: "happiness",
        sad: "sadness",
        angry: "anger",
        fearful: "fear",
        disgusted: "disgust",
        surprised: "surprise",
        neutral: "neutral",
    };
    return map[label] || label;
}
export default function EmotionRecognitionPanel() {
    const videoRef = useRef(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [status, setStatus] = useState ("Idle (camera off)");
    const [topEmotion, setTopEmotion] = useState({ label: "none", confidence: 0});
    const [permissionError , setPermissionError] = useState("");
    useEffect(() => {
        let cancelled = false;
        async function loadModels() {
            try{
                setStatus("Loading models...");
                await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_DETECTION_DIR);
                await faceapi.nets.faceExpressionNet.loadFromUri(EXPRESSION_MODEL_DIR);
                if (!cancelled) setStatus("Models loaded. Turn camera on.");
            } catch (e) {
                console.error(e);
                if (!cancelled) setStatus ("Model load failed. Check /public/models paths.");
            }
        }
        loadModels();
        return () => {
            cancelled = true;
        };
    },[]);
    useEffect ( () => {
        let stream = null;
        let timeId = null;

        async function start() {
            setPermissionError("");
            try{
                setStatus("Requesting camera permission...");
                stream=await
                navigator.mediaDevices.getUserMedia({
                    video: {facingMode: "user"},
                    audio: false,
                });
                if (!videoRef.current) return;
                videoRef.current.srcObject = stream;
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => resolve();
                });
                await videoRef.current.play();
                setStatus("Camera active. Running live inference...");
                const options = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224,
                    scoreThreshold: 0.5,
                });
                timeId = window.setInterval(async() => {
                    if (!videoRef.current) return;
                    const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceExpressions();
                    if (!result || !result.expressions){
                        setTopEmotion({ label: "none", confidence: 0 });
                        return;
                    }
                    const best = 
                    getDominantExpression(result.expressions);
                    setTopEmotion({ label: formatLabel(best.label), confidence: best.confidence});
                }, DETECTION_INTERVAL_MS);
            } catch (e){
                console.error(e);
                setPermissionError("Camera permission denied or camera not available");
                setStatus("Camera failed to start.");
                setIsEnabled(false);
            }
        }
        function stop() {
            setStatus("Camera off.");
            setTopEmotion({ label: "none", confidence: 0});
            if (timeId)
                window.clearInterval(timeId);
            timeId = null;
            if(videoRef.current){
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
            if(stream){
                stream.getTracks().forEach((t) => t.stop());
                stream = null;
            }
        }
        if (isEnabled) start();
        else stop();
        return() => stop();
    },[isEnabled]);
    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16}}> 
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8}}> Emotion Recognition</h2>
        <p style={{marginBottom: 12}}> Status: <strong>{status}</strong></p>
        {permissionError && (<p style={{ marginBottom: 12, color: "red"}}>{permissionError}</p>)}
        <button onClick={()=> setIsEnabled((v)=> !v)} style={{padding: "10px 14px",borderRadius: 8, border: "1px solid black", cursor: "pointer", marginBottom: 12,}}>{isEnabled ? "Disable Camera": "Enable Camera"}</button>
        <div style={{display: "grid", gridTemplateColumns: "1fr", gap: 12}}> 
            <video ref = {videoRef} muted playsInline style={{width: "100%", borderRadius: 12, border: "1px pink", borderRadius: 12}}/>
        <div style={{padding: 12, border: "1px solid #ddd"}}>
            <div style={{fontSize: 16}}>
                Predicted emotion:{""}
                <strong>{topEmotion.label}</strong>
            </div>
            <div style={{fontSize: 14, marginTop: 6}}>
                Confidence: <strong>{(topEmotion.confidence*100).toFixed(1)}%</strong>
            </div>
            <div style={{fontSize: 12, marginTop: 10, opacity: 0.8}}> Privacy note: Inference runs locally in the browser; no video is uploaded.</div>
            </div>
            </div>
            </div>
    );
}
