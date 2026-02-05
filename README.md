# Affective Trading – Final Year Project
**Student:** Dhruvi Soni
**Student ID:** W1912163/3
**Module:** 6COSC023W – Computer Science Final Project
**Supervisor:** Dr. Alan Immanuel Benjamin Vallavaraj

---

## Project Overview

Affective Trading is a prototype system that explores the relationship between emotional state (stress) and trading decision-making within a simulated environment.
Traditional trading tools focus on prices and performance metrics but provide little insight into the human emotional factors that influence decisions under pressure. This project investigates whether real-time affective signals, derived from facial expressions, can be used to highlight moments of heightened stress during trading activity.

The system combines:
- A browser-based trading interface
- Real-time, on-device facial emotion recognition
- A simplified Valence–Arousal–Dominance (VAD) model
- A derived stress score that can later be analysed alongside trading behaviour

--- 

## Key Features
- Webcam-based emotion recognition using facial expressions
- Valence–Arousal–Dominance (VAD) computation from expression probabilities
- Simple stress score derived from VAD values
- User control to enable or disable emotion recognition at any time
- Privacy-by-design: all video processing happens locally in the browser
- Research CNN model trained on FER2013 / FER+ for future deployment

## Privacy and Ethics

Privacy is a core design constraint of this project.

- No webcam frames are stored or transmitted
- No images or video data are sent to the backend
- Only optional, numerical signals (e.g. timestamp + stress score) are intended to be logged
- Emotion inference runs entirely on the client device
- Design aligns with GDPR principles (data minimisation, local processing, user consent)

---

## System Architecture
**Frontend (prototype):**
- React + Vite + Tailwind CSS
- User interface and Webcam access

**Emotion & Face Tracking (Browser):**
- MediaPipe Tasks Vision (face landmarks)
- face-api.js (facial expression classification)

**Backend (Prototype):**
- Flask API
- Designed for session and trade logging (numerical data only)

**Machine Learning (Research Component):**
- TensorFlow / Keras CNN trained on FER2013 + FER+
- Used for experimentation and future browser deployment

---

## Project Structure

Affective-Trading/
│
├── frontend/           # React + Vite frontend (UI, webcam, inference)
├── backend/            # Flask API prototype
├── machine-learning/   # CNN training, evaluation, preprocessing scripts
├── data/               # Raw and processed datasets (FER2013 / FER+)
└── README.md           # Project overview (this file)

Each major folder contains its own README explaining usage and scope.

---

## How to Run the Prototype:

### Frontend

cd frontend
npm install
npm run dev

Then open the local development URL shown in the terminal.
Webcam access is required for emotion and face landmark detection.

Backend (Prototype - work in progress)

cd backend
python app.py

Machine Learning Component (Research)
The machine-learning/ folder contains:
- Dataset preprocessing scripts
- CNN model training using TensorFlow/Keras
- Model evaluation and inference validation
- Experimental export to TensorFlow.js

The trained CNN is not yet fully integrated into the browser due to compatibility constraints.
Instead, the prototype uses face-api.js for stable, real-time inference while the CNN remains part of the project’s research and future development roadmap.

Technologies Used

Frontend: React, Vite, Tailwind CSS
Face Tracking: MediaPipe Tasks Vision (Google)
Emotion Recognition: face-api.js
Machine Learning: TensorFlow, Keras
Backend: Flask
Datasets: FER2013, FER+

Licensing and References:

- This project makes use of open-source libraries and datasets:
- MediaPipe Tasks Vision – Google
- face-api.js – Justadudewhohacks
- TensorFlow & Keras – Google
- FER2013 & FER+ datasets – facial expression datasets
- All third-party tools are used in accordance with their respective licenses.
- This project is intended for academic and research purposes only.

Project Status
This submission represents an iterative prototype aligned with the PPRS and refined requirements.
Core functionality (emotion recognition, VAD, stress estimation, privacy constraints) is implemented, with further integration and analytics planned for later stages of the final project.

