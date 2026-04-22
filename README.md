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
- A browser-based trading simulator with live market data
- On-device facial emotion recognition (no video ever leaves the  browser.)
- A Valence-Arousal-Dominance (VAD) mapping from the facial expressions
- A derived stress score, logged alongside trading activity
- A post-session analytics dashboard linking stress patterns to trade decisions

--- 

## Key Features
- Webcam-based emotion recognition using facial expressions
- Valence–Arousal–Dominance (VAD) computation from expression probabilities
- Simple stress score derived from VAD values, smoothed and logged per session
- Live stock price data via Finnhub API
- Post-session dashboard linking stress samples to trades
- User control to enable or disable emotion recognition at any time
- Privacy-by-design: all video processing happens locally in the browser

## Privacy and Ethics

Privacy is a core design constraint of this project.

- No webcam frames are stored or transmitted
- No images or video data are sent to the backend
- Only optional, numerical signals (e.g. timestamp + stress score) are intended to be logged
- Emotion inference runs entirely on the client device
- Design aligns with GDPR principles (data minimisation, local processing, user consent) and ICO guidance on biometric data processing

---

## System Architecture
**Frontend (prototype):**
- React + Vite + Tailwind CSS
- User interface and Webcam access

**Emotion & Face Tracking (Browser):**
- face-api.js (facial expression classification and face detection)

**Backend (Prototype):**
- Flask API
- PostgreSQL database via SQLAlchemy

**Machine Learning (Research Component):**
- TensorFlow / Keras CNN trained on FER2013 + FERPlus soft labels
- 80.19% categorical accuracy on the held-out test set
- TensorFlow.js deployment pipeline for browser-based inference
- Used for experimentation and future browser deployment
> Note: The CNN model is included as a research contribution and future extension
> The current prototype uses face-api.js for stable real-time inference

---

## Project Structure

Affective-Trading/
│
├── frontend/           # React + Vite frontend (UI, webcam, inference)
├── backend/            # Flask API,session/trade/stress endpoints
├── machine-learning/   # CNN training, evaluation, preprocessing scripts
├── data/               # Raw and processed datasets (FER2013 / FER+)
└── README.md           # Project overview (this file)

Each major folder contains its own README explaining usage and scope.

---

## How to Run the Prototype:

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL database
- Finnhub API key (free tier available at: https://finnhub.io)

> Note: To obtain an API key, create a free account on Finnhub and generate a key from the dashboard
### Frontend
```bash
cd frontend
npm install
npm run dev

Then open the local development URL shown in the terminal.
```

### Backend
``` bash
cd backend
python -m venv venv
```

### Activate virtual environment
```bash
 cd backend
 .venv\Scripts\Activate.ps1
```

### Installing dependencies and running backend
```bash
pip install -r requirements.txt
python app.py
```

### Backend environment variables
create a .env file inside the backend folder with the following:
DATABASE_URL = your_postgre_connection
FINNHUB_API_KEY = "your_api_key"

> Note: The .env file is not included in this submission for security reasons

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
Emotion Recognition: face-api.js
Machine Learning: TensorFlow, Keras
Backend: Flask
Datasets: FER2013, FER+

Licensing and References:

- This project makes use of open-source libraries and datasets:
- face-api.js – Justadudewhohacks
- TensorFlow & Keras – Google
- FER2013 & FER+ datasets – facial expression datasets
- Finnhub Stock API
- All third-party tools are used in accordance with their respective licenses.
- This project is intended for academic and research purposes only.

Project Status
This submission represents an iterative prototype developed using an agile approach.
Core functionality has been implemented including: 
- Emotion recognition and stress score calculation
- Trading simulation and session tracking
- privacy-focused data handling
- Dashboard-based analysis

Future work may include deeper integration of the custom CNN model and enhance behavioural analytics.
