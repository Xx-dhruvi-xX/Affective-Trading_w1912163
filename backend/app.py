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

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# Load environment variables from .env file

load_dotenv()

#Create database object (to be initialized later)

db = SQLAlchemy()

# App Initialization

app = Flask(__name__)
CORS(app)

# Configure Database

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL") 
if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("DATABASE_URL environment variable not set.")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

#Database models

class Session(db.Model):
    __tablename__ = "sessions"
    id = db.Column(db.Integer, primary_key=True)
    started_at = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)
    ended_at = db.Column(db.DateTime, nullable=True)
    #optional settings stored as JSON
    user_settings = db.Column(db.JSON, nullable=True)

class Trade(db.Model):
    __tablename__ = "trades"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    session = db.relationship("Session", backref=db.backref("trades", lazy=True))
    symbol = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(4), nullable=False)  # Buy/Sell
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)

class StressSample(db.Model):
    __tablename__ = "stress_samples"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    session = db.relationship("Session", backref=db.backref("stress_samples", lazy=True))
    stress_score = db.Column(db.Float, nullable=False) #numeric only stress score
    emotion_label = db.Column(db.String(30), nullable=True) #optional emotion label
    timestamp = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)

class Portfolio(db.Model):
    __tablename__ = "portfolios"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False, unique=True)
    cash_balance = db.Column(db.Float, nullable=False, default=100000.0) #default starting cash
    holdings = db.Column(db.JSON, nullable=False, default= lambda: {}) #JSON mapping of symbol
    session = db.relationship("Session", backref=db.backref("portfolio", uselist=False),lazy=True)
# App Health Check Endpoint

@app.get("/health")
def health():
    """Health check endpoint to verify server is running."""
    return jsonify(status="OK"), 200

@app.get("/db-test")
def db_test():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify(db_status="connected"), 200
    except Exception as e:
        return jsonify(db_status="error", message=str(e)), 500

@app.post("/sessions")
def start_session():
    payload = request.get_json(silent=True) or {}
    s = Session(user_settings= payload if payload else None)
    db.session.add(s)
    db.session.commit()
    return jsonify({"session_id": s.id, "started_at": s.started_at.isoformat()}), 201

@app.post("/sessions/<int:session_id>/end")
def end_session(session_id):
    s = Session.query.get_or_404(session_id)
    s.ended_at = db.func.now()
    db.session.commit()
    return jsonify({"session_id": s.id, "ended_at": str(s.ended_at)}), 200

@app.post("/sessions/<int:session_id>/trades")
def add_trade(session_id):
    Session.query.get_or_404(session_id)
    data = request.get_json() or {}
    # Basic validation
    required = ["symbol", "side", "quantity", "price"]
    missing = [field for field in required if field not in data]
    if missing:
        return jsonify(error = f"Missing fields: {', '.join(missing)}"), 400
    side = str(data["side"]).upper()
    if side not in ["BUY", "SELL"]:
        return jsonify(error="Invalid side. Must be 'BUY' or 'SELL'."), 400
    quantity = int(data["quantity"])
    price = float(data["price"])
    if quantity <= 0 or price <= 0:
        return jsonify(error="Quantity and price must be > 0"), 400
    
    t = Trade(
        session_id=session_id,
        symbol= str(data["symbol"]).upper(),
        side=side,
        quantity=quantity,
        price=price
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({"trade_id": t.id}), 201

@app.post("/sessions/<int:session_id>/stress")
def add_stress(session_id):
    Session.query.get_or_404(session_id)
    data = request.get_json() or {}

    # privacy : only numeric stress score is accepted
    allowed={"stress_score", "emotion_label"}
    extra = set(data.keys()) - allowed
    if extra:
        return jsonify(error=f"Unexpected fields not allowed: {', '.join(sorted(extra))}"), 400
    if "stress_score" not in data:
        return jsonify(error="Missing field: stress_score"), 400
    score = float(data["stress_score"])
    ss = StressSample(
        session_id=session_id,
        stress_score=score,
        emotion_label=data.get("emotion_label")
    )
    db.session.add(ss)
    db.session.commit()
    return jsonify({"stress_sample_id": ss.id}), 201

@app.get("/sessions/<int:session_id>/summary")
def session_summary(session_id):
    Session.query.get_or_404(session_id)
    trade_count = Trade.query.filter_by(session_id=session_id).count()
    stress_count = StressSample.query.filter_by(session_id=session_id).count()
    avg_stress = db.session.query(db.func.avg(StressSample.stress_score)).filter_by(session_id=session_id).scalar()
    avg_stress = float(avg_stress) if avg_stress is not None else None
    return jsonify({
        "session_id": session_id,
        "trade_count": trade_count,
        "stress_sample_count": stress_count,
        "average_stress_score": avg_stress
    }), 200

# Create Database Tables

with app.app_context():
    db.create_all()

# Run the Flask App

if __name__ == "__main__":
    app.run(debug=True, port=5000)
