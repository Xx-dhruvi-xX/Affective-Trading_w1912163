"""
Affective Trading (Final Year Project)
Student Name: Dhruvi Soni
Student ID: W1912163/3
Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
Module: 6COSC023W Computer Science Final Project
Description:
    Flask backend API for sessions, trades, and numeric stress score storage.
    Privacy-focused design : no video/images are stored; only numeric data.
"""

#======================
# Flask App Setup
#======================

from flask import Flask, jsonify
from flask_cors import CORS

# App Initialization

app = Flask(__name__)
CORS(app)

# App Health Check Endpoint

@app.get("/health")
def health():
    """Health check endpoint to verify server is running."""
    return jsonify(status="OK")

# Run the Flask App

if __name__ == "__main__":
    app.run(debug=True, port=5000)
