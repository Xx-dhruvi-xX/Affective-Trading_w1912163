/**
 * Affective Trading (Final Year Project)
 * Student Name: Dhruvi Soni
 * Student ID: W1912163/3
 * Module: 6COSC023W Computer Science Final Project
 * Description:
 * - Runs on-device emotion inference using face-api.js (no server upload).
 * - Reads facial expression probabilities (happy/sad/angry/etc).
 * - Derives a simple VAD (Valence–Arousal–Dominance) estimate.
 * - Computes a stress score (0–100) from VAD for the prototype demo.
 *
 * Notes:
 * - This is a prototype mapping (heuristic weights). The final version can
 *   replace this with a more advanced lightweight browser-based affective model.
 */




import React from "react";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js" // Library for emotion recognition

//Face-api model URL links for the emotion recognition
const MODEL_BASE_URL = "/models";
const FACE_DETECTION_DIR = `${MODEL_BASE_URL}/face_detection`;
const EXPRESSION_MODEL_DIR = `${MODEL_BASE_URL}/facial_expression_recognition`;

// how often prediction is run
const DETECTION_INTERVAL_MS = 500;
const BACKEND_LOG_INTERVAL_MS = 3000;
function getDominantExpression(expressions) {
    if (!expressions) return { label: "none", confidence: 0};
    let best = { label: "none", confidence: 0};
    for (const[k,v] of Object.entries(expressions)){
        if (v > best.confidence) best = { label: k, confidence: v};
    }
    return best;
}
// formatting labels for UI
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
// Clamp helper to ensure values stay within defined range
function clamp(x, min, max){
    return Math.max(min, Math.min(max, x));
}
// Simple VAD estimate from expression probabilities 
function calculateVAD(expressions){
    const e = expressions || {};
    const happy = Number(e.happy || 0);
    const sad = Number(e.sad || 0);
    const angry = Number(e.angry || 0);
    const fearful = Number(e.fearful || 0);
    const disgusted = Number(e.disgusted || 0);
    const surprised = Number(e.surprised || 0);
    const neutral = Number(e.neutral || 0);

    // Valence 
    let v =
    1.00 * happy + 
    0.90 * sad - 
    0.80 * angry -
    0.70 * fearful-
    0.60 * disgusted - 
    0.10 * surprised +
    0.00 * neutral;

    // Arousal
    let a =
    0.45 * happy + 
    0.20 * sad - 
    0.85 * angry -
    0.90 * fearful-
    0.35 * disgusted - 
    0.75 * surprised +
    0.40 * neutral;

    //Dominance
    let d =
    0.50 * happy + 
    0.55 * sad - 
    0.75 * angry -
    0.70 * fearful-
    0.35 * disgusted - 
    0.10 * neutral;

    // clamp results: -1 to +1 to keep UI stable
    v = clamp(v, -1, 1);
    a = clamp(a, -1, 1);
    d = clamp(d, -1, 1);
    return {v, a, d};
}
//heuristic stress score calculation (0-100) based on VAD (Higher arousal increases stress and more negative valence also increases stress)
function computeStressScore(vad){
    const negative_Valence = (1 - vad.v)/2;
    const arousal = (vad.a + 1)/2;
    const stress = clamp(0.65 * arousal + 0.35 * negative_Valence, 0, 1);
    return Math.round(stress * 100);
}
export default function EmotionRecognitionPanel({sessionId = null}) {
    // reference to <video> element
    const videoRef = useRef(null);
    //UI state
    const [isEnabled, setIsEnabled] = useState(false);
    const [status, setStatus] = useState ("Idle (camera off)");
    //prediction outputs
    const [topEmotion, setTopEmotion] = useState({ label: "none", confidence: 0});
    const [permissionError , setPermissionError] = useState("");
    const [vad, setVad] = useState({v:0, a:0, d:0});
    const [stressScore, setStressScore] = useState(0);
    
    // load face-api models once when component mounts
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
    // start/stop camera +inference loop depending on toggle button
    useEffect ( () => {
        let stream = null;
        let timeId = null;
        let lastBackendLogAt = 0;

        async function start() {
            setPermissionError("");
            try{
                setStatus("Requesting camera permission...");
               // requesting webcam access
                stream=await
                navigator.mediaDevices.getUserMedia({
                    video: {facingMode: "user"},
                    audio: false,
                });
                if (!videoRef.current) return;
                //attach stream to video element
                videoRef.current.srcObject = stream;
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => resolve();
                });
                await videoRef.current.play();
                setStatus("Camera active. Running live inference...");
                // configure Face api options
                const options = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 128,
                    scoreThreshold: 0.3,
                });
                //start detection loop
                timeId = window.setInterval(async() => {
                    if (!videoRef.current) return;
                    const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceExpressions();
                    
                    //if no face detected reset outputs
                    if(!result || !result.expressions){
                        setTopEmotion({ label:  "none", confidence: 0 });
                        setVad({v:0, a:0, d:0});
                        setStressScore(0);
                        return;
                    }

                    const best = 
                    getDominantExpression(result.expressions);
                    setTopEmotion({ label: formatLabel(best.label), confidence: best.confidence});
                    //VAD + stress score
                    const vadNow = calculateVAD(result.expressions); setVad(vadNow);
                    const stressNow = computeStressScore(vadNow);
                    setStressScore(stressNow);
                    const now = Date.now();
                    console.log("Stress check", {sessionId, now, lastBackendLogAt, stressNow, emotion: best.label})
                    // POST stress score to backend
                    if (sessionId && now - lastBackendLogAt >= BACKEND_LOG_INTERVAL_MS) {
                        lastBackendLogAt = now;
                        console.log("posting stress sample")
                        fetch(`http://localhost:5000/sessions/${sessionId}/stress`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                stress_score: stressNow,
                                emotion_label: best.label,
                            }),
                        }).catch(() => {});
                    }
                }, DETECTION_INTERVAL_MS);
            } catch (e){
                console.error(e);
                setPermissionError("Camera permission denied or camera not available");
                setStatus("Camera failed to start.");
                setIsEnabled(false);
            }
        }
        //cleanup function to stop camera and interval
        function stop() {
            setStatus("Camera off.");
            setTopEmotion({ label: "none", confidence: 0});
            setVad({v:0, a:0, d:0});
            setStressScore(0);
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
    },[isEnabled, sessionId]);
    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16}}> 
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8}}> Emotion Recognition</h2>
        <p style={{marginBottom: 12}}> Status: <strong>{status}</strong></p>
        {permissionError && (<p style={{ marginBottom: 12, color: "red"}}>{permissionError}</p>)}
        <button onClick={()=> setIsEnabled((v)=> !v)} style={{padding: "10px 14px",borderRadius: 8, border: "1px solid #000", cursor: "pointer", marginBottom: 12,}}>{isEnabled ? "Disable Camera": "Enable Camera"}</button>
        <div style={{display: "grid", gridTemplateColumns: "1fr", gap: 12}}> 
            <video ref = {videoRef} muted playsInline style={{width: "100%", borderRadius: 12, border: "1px solid #000", borderRadius: 12}}/>
        <div style={{padding: 12, border: "1px solid #ddd"}}>
            <div style={{fontSize: 16}}>
                Predicted emotion:{""}
                <strong>{topEmotion.label}</strong>
            </div>
            <div style={{fontSize: 14, marginTop: 6}}>
                Confidence: <strong>{(topEmotion.confidence*100).toFixed(1)}%</strong>
            </div>
            <div style={{ fontSize: 16}}>VAD: {" "} <strong> V{vad.v.toFixed(2)}|A{vad.a.toFixed(2)}|D{vad.d.toFixed(2)} </strong></div>
            <div style={{ fontSize: 16, marginTop: 8}}>Stress score: <strong>{stressScore}</strong></div>
            <div style={{fontSize: 12, marginTop: 10, opacity: 0.8}}> Privacy note: Inference runs locally in the browser; no video is uploaded.</div>
            </div>
            </div>
            </div>
    );
}
