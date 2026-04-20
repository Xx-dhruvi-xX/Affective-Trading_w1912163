"""
Affective Trading (Final Year Project)
Student Name: Dhruvi Soni
Student ID: W1912163/3
Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
Module: 6COSC023W Computer Science Final Project
Description:
    Flask backend API for sessions, trades, portfolios, and numeric stress score storage.
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
import requests
import re
from concurrent.futures import ThreadPoolExecutor

# Load environment variables from .env file so sensitive values such 
# as database connection strings and API keys are not hardcoded

load_dotenv()

#Create database object (to be initialized later)

db = SQLAlchemy()

# App Initialization

app = Flask(__name__)
CORS(app)

# Configure Database

# Read the database connection URI from environment variable.
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

# Stop application if no database URI is provided to prevent accidental data loss or misconfiguration. 
# This ensures that the app won't run without a proper database connection string.
if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("DATABASE_URL environment variable not set.")

# Disable change tracking to reduce overhead since it is not needed for this application.
#  This can improve performance and reduce memory usage.
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database with the Flask app context
db.init_app(app)

# Define starting cash balance constant for new portfolios.
STARTING_CASH_BALANCE = 100000.0
MAX_TRADE_QUANTITY = 10000  # Maximum quantity allowed per trade to prevent unrealistic orders
MAX_SYMBOL_LENGTH = 10  # Maximum length for stock symbols to prevent excessively long inputs
SYMBOL_PATTERN = re.compile(r'^[A-Z.\-]{1,10}$')  # Pattern to validate stock symbols (alphanumeric and dots, up to 10 chars)

def validate_symbol(symbol: str) -> bool:
    """ Validates that a stock symbol is well-formed to prevent invalid data entry.
        A valid symbol is 1-10 characters long, consists of uppercase letters, dots, or hyphens, and matches the defined pattern.
        This helps maintain data integrity and prevents issues with excessively long or malformed symbols in the database.
    """
    return bool(SYMBOL_PATTERN.match(symbol))
def parse_positive_int(value, field_name: str):
    try:
        parsed = int(value)
    except (ValueError, TypeError):
        raise ValueError(f"{field_name} must be an integer.")
    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")
    return parsed
def parse_positive_float(value, field_name: str):
    try:
        parsed = float(value)
    except (ValueError, TypeError):
        raise ValueError(f"{field_name} must be a number.")
    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")
    return parsed
#Database models

class Session(db.Model):
    """ Represents a trading session.
        Each session stores:
        - Start time
        - End time
        - User settings (optional JSON for scenario, risk level, etc.)
    """
    __tablename__ = "sessions"
    id = db.Column(db.Integer, primary_key=True)
    started_at = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)
    ended_at = db.Column(db.DateTime, nullable=True)
    #optional settings stored as JSON
    user_settings = db.Column(db.JSON, nullable=True)

class Trade(db.Model):
    """ Represents a trade executed during a session.
        Each trade is linked to a session and stores:
        - Session ID (foreign key)
        - Stock symbol
        - Buy/Sell side
        - Quantity
        - Price
        - Timestamp
    """
    __tablename__ = "trades"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    
    # Relationship allows trades to be accessed from a session object
    session = db.relationship("Session", backref=db.backref("trades", lazy=True))
    symbol = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(4), nullable=False)  # Buy/Sell
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)

class StressSample(db.Model):
    """ Stores a numeric stress sample linked to a session
        This table supports the privacy-focused design by only storing 
        numeric stress data rather than raw media input.
    """
    __tablename__ = "stress_samples"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)

    # Relationship allows stress samples to be accessed from a session object
    session = db.relationship("Session", backref=db.backref("stress_samples", lazy=True))

    # Numeric stress score generated by the affective computing model. This is the only required field to support the core functionality 
    # of tracking stress levels during trading sessions.
    stress_score = db.Column(db.Float, nullable=False) 
    emotion_label = db.Column(db.String(30), nullable=True) #optional emotion label
    timestamp = db.Column(db.DateTime, server_default = db.func.now(), nullable=False)

class Portfolio(db.Model):
    """ Represents the portfolio state for a trading session.
        Each session has exactly one portfolio that tracks:
        - Cash balance
        - Holdings (JSON mapping of stock symbol to quantity)"""
    __tablename__ = "portfolios"
    id = db.Column(db.Integer, primary_key=True)

    # unique=True ensures one-to-one relationship between session and portfolio, enforcing that each session has exactly one portfolio.
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False, unique=True)
    cash_balance = db.Column(db.Float, nullable=False, default=STARTING_CASH_BALANCE) #default starting cash

    # Holdings are stored as JSON mapping of stock symbol to quantity, e.g. {"AAPL": 10, "GOOG": 5}
    holdings = db.Column(db.JSON, nullable=False, default=dict) 

    # uselist=False in backref indicates that the relationship from Session to Portfolio is one-to-one, 
    # meaning each session has exactly one portfolio. This allows us to access the portfolio directly from 
    # the session object using session.portfolio without needing to deal with a list.
    session = db.relationship("Session", backref=db.backref("portfolio", uselist=False),lazy=True)

# Helper function to get or create portfolio for a session

def get_or_create_portfolio(session_id: int) -> Portfolio:
    """ Retrieve the portfolio for a session.
        If no portfolio exists, create a new one with the starting cash balance and empty holdings.
        This ensures later trade logic always has a valid portfolio to work with.
    """
    portfolio = Portfolio.query.filter_by(session_id=session_id).first()
    if portfolio is None:
        portfolio = Portfolio(session_id=session_id, cash_balance=STARTING_CASH_BALANCE, holdings={})
        db.session.add(portfolio)
        db.session.commit()
    return portfolio

def calculate_holdings_value(holdings: dict[str,int], latest_prices: dict[str,float] | None = None) -> float:
    """Calculate total market value of holdings. 
       Parameters:
         - holdings: dict mapping stock symbol to quantity, e.g. {"AAPL": 10, "GOOG": 5}
         - latest_prices: optional dict mapping stock symbol to latest price, e.g. {"AAPL": 150.0, "GOOG": 2800.0}

         Returns:
         - Total value of all holdings 
         - If no latest prices provided, returns 0.0 since we cannot calculate value without price data.
           This allows the function to be used in contexts where price data may not be available without
           causing errors.
    """
    if not latest_prices:
        return 0.0
    total = 0.0
    for symbol, qty in holdings.items():
        total += float(qty)*float(latest_prices.get(symbol, 0.0))
    return total

# App Health Check Endpoint

@app.get("/health")
def health():
    """Health check endpoint to verify server is running.
       This can be used for monitoring and debugging to ensure the backend is operational.
    """
    return jsonify(status="OK"), 200

@app.get("/db-test")
def db_test():
    """ Confirms that the application can successfully connect to the database
        by executing a simple SQL query.
    """
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify(db_status="connected"), 200
    except Exception as e:
        return jsonify(db_status="error", message=str(e)), 500

@app.get("/test-key")
def test_key():
    """ Checks whether the Finnhub API key is loaded correctly from environment variables.
        This is useful for debugging API connectivity issues.
    """
    key = os.getenv("FINNHUB_API_KEY")
    if key:
        return{"status":"API key loaded successfully"}
    else:
        return{"status":"API key not found"}

# Session Endpoints

@app.post("/sessions")
def start_session():
    """ Starts a new trading session.
        Optional frontend settings can be included in the request body as JSON.
        A portfolio is also created immediately for the session with the starting cash 
        balance and empty holdings to ensure that trade operations can be performed without errors.
    """
    payload = request.get_json(silent=True) or {}

    # Store user settings only if values are provided to avoid 
    # unnecessary storage of empty JSON objects. This keeps the database 
    # cleaner and more efficient.
    session = Session(user_settings= payload if payload else None)
    db.session.add(session)
    db.session.commit()

    # Create initial portfolio for the session
    portfolio = Portfolio(session_id=session.id, cash_balance=STARTING_CASH_BALANCE, holdings={})
    db.session.add(portfolio)
    db.session.commit()

    return jsonify({"session_id": session.id, "started_at": session.started_at.isoformat(), "starting_cash": STARTING_CASH_BALANCE}), 201

@app.post("/sessions/<int:session_id>/end")
def end_session(session_id):
    """ Marks a session as ended by setting the ended_at timestamp.
        This allows the frontend to know when a session has concluded.
    """
    session = Session.query.get_or_404(session_id)
    session.ended_at = db.func.now()
    db.session.commit()
    return jsonify({"session_id": session.id, "ended_at": str(session.ended_at)}), 200

@app.get("/sessions/<int:session_id>/summary")
def session_summary(session_id):
    """ Returns a summary of a completed or active session.
        The summary includes:
        - Trade count
        - Stress sample count
        - Average and peak stress scores
        - Cash balance
        - Holdings
        - Final portfolio value
        - Scenario and risk level settings
        This endpoint provides a comprehensive overview of the session's trading activity and stress levels,
        which can be used for analysis and feedback in the frontend.
    """
    session = Session.query.get_or_404(session_id)
    portfolio = get_or_create_portfolio(session_id)
    trade_count = Trade.query.filter_by(session_id=session_id).count()
    stress_count = StressSample.query.filter_by(session_id=session_id).count()
    avg_stress = db.session.query(db.func.avg(StressSample.stress_score)).filter_by(session_id=session_id).scalar()
    peak_stress = db.session.query(db.func.max(StressSample.stress_score)).filter_by(session_id=session_id).scalar()
    avg_stress = float(avg_stress) if avg_stress is not None else None
    peak_stress = float(peak_stress) if peak_stress is not None else None
    cash_balance = float(portfolio.cash_balance)
    holdings = portfolio.holdings or {}
    final_portfolio_value = cash_balance
    scenario = session.user_settings.get("scenario") if session.user_settings else None
    risk_level = session.user_settings.get("risk_level") if session.user_settings else None

    return jsonify({
        "session_id": session_id,
        "trade_count": trade_count,
        "stress_sample_count": stress_count,
        "average_stress_score": avg_stress,
        "peak_stress_score": peak_stress,
        "cash_balance": cash_balance,
        "holdings": holdings,
        "final_portfolio_value": final_portfolio_value,
        "scenario": scenario,
        "risk_level": risk_level
    }), 200

# Trade Endpoints

@app.post("/sessions/<int:session_id>/trades")
def add_trade(session_id):
    """ Record a new trade for a session and update the portfolio accordingly.
        Rules enforced:
        - For BUY trades, the total cost must not exceed the current cash balance.
        - For SELL trades, the quantity must not exceed current holdings of the stock.
        - Quantity and price must be greater than zero.
        - Side must be either 'BUY' or 'SELL'.
        - session must exist, otherwise a 404 error is returned.
        - required trade fields must be provided in the request body as JSON.
        The portfolio is updated atomically with the trade to ensure data consistency.
    """
    Session.query.get_or_404(session_id)
    portfolio = get_or_create_portfolio(session_id)
    data = request.get_json() or {}
    required = ["symbol", "side", "quantity", "price"]
    missing = [field for field in required if field not in data]
    if missing:
        return jsonify(error=f"Missing fields: {', '.join(missing)}"), 400
    
    # Standardise input values before processing
    symbol = str(data["symbol"]).upper().strip()
    side = str(data["side"]).upper().strip()
    if not validate_symbol(symbol):
        return jsonify(error = "Invalid symbol format"), 400
    if len(symbol) > MAX_SYMBOL_LENGTH:
        return jsonify(error = "Symbol too long"), 400
    if side not in {"BUY", "SELL"}:
        return jsonify(error="Invalid side: must be 'BUY' or 'SELL'"), 400
    try:
        quantity = parse_positive_int(data["quantity"], "quantity")
        price = parse_positive_float(data["price"], "price")
    except ValueError as e:
        return jsonify(error=str(e)), 400
    if quantity > MAX_TRADE_QUANTITY:
        return jsonify(error=f"Quantity exceeds maximum allowed ({MAX_TRADE_QUANTITY})"), 400 
    # Read current portfolio state to validate the trade and calculate new state
    holdings = dict(portfolio.holdings or {})
    current_cash = float(portfolio.cash_balance)
    current_qty = int(holdings.get(symbol, 0))
    total_cost = quantity * price

    if side == "BUY":
        # Prevent user from spending more cash than is available
        if total_cost > current_cash:
            return jsonify(error="Insufficient cash balance for this trade"), 400
        portfolio.cash_balance = round(current_cash - total_cost, 2)
        holdings[symbol] = current_qty + quantity
    elif side == "SELL":
        # Prevent the user from selling more shares than what they own
        if quantity > current_qty:
            return jsonify(error = f"Cannot sell {quantity} shares of {symbol} - only {current_qty} available"), 400
        portfolio.cash_balance = round(current_cash + total_cost, 2)
        remaining = current_qty - quantity
        # Remove the symbol entirely if no shares remain after selling
        if remaining > 0:
            holdings[symbol] = remaining
        else:
            holdings.pop(symbol, None)
    # Save the updated holdings and create the trade record
    portfolio.holdings = holdings
    trade = Trade(session_id=session_id, symbol=symbol, side=side, quantity=quantity, price=price)
    db.session.add(trade)
    db.session.commit()
    return jsonify({"trade_id": trade.id, "new_cash_balance": portfolio.cash_balance, "holdings": portfolio.holdings}), 201

@app.get("/sessions/<int:session_id>/trades")
def get_trades(session_id):
    """ Return all trades for a session, ordered by timestamp.
        This allows the frontend to display the trade history for the session."""
    Session.query.get_or_404(session_id)
    trades = Trade.query.filter_by(session_id=session_id).order_by(Trade.timestamp).all()
    return jsonify([{
        "trade_id": t.id,
        "symbol": t.symbol,
        "side": t.side,
        "quantity": t.quantity,
        "price": t.price,
        "timestamp": t.timestamp.isoformat()
    } for t in trades]), 200

# Stress Sample Endpoints

@app.post("/sessions/<int:session_id>/stress")
def add_stress(session_id):
    """ Store a stress sample for a session.
        Privacy-focused design: only numeric stress scores and optional emotion labels are accepted and stored.
        Any unexpected fields in the request body will result in a 400 error to prevent storage of 
        unnecessary or privacy-sensitive data.
    """
    Session.query.get_or_404(session_id)
    data = request.get_json() or {}

    # privacy : only numeric stress score is accepted
    # Only allow expected fields to prevent accidental storage of sensitive data. 
    # This ensures that the API remains focused on its core functionality of tracking stress levels
    #  without risking privacy breaches through unexpected data.
    allowed={"stress_score", "emotion_label"}
    extra = set(data.keys()) - allowed
    if extra:
        return jsonify(error=f"Unexpected fields not allowed: {', '.join(sorted(extra))}"), 400
    if "stress_score" not in data:
        return jsonify(error="Missing field: stress_score"), 400
    try:
        score = float(data["stress_score"])
    except (ValueError, TypeError):
        return jsonify(error="Invalid stress_score: must be a number"), 400
    if score < 0 or score > 100:
        return jsonify(error="Invalid stress_score: must be between 0 and 100"), 400
    emotion_label = data.get("emotion_label")
    if emotion_label is not None:
        emotion_label = str(emotion_label).strip()[:30] # limit length to 30 chars to prevent excessively long labels
    sample = StressSample(
        session_id=session_id,
        stress_score=score,
        emotion_label=emotion_label,
    )
    db.session.add(sample)
    db.session.commit()
    return jsonify({"stress_sample_id": sample.id}), 201

@app.get("/sessions/<int:session_id>/stress")
def get_stress(session_id):
    """ Return all recorded stress samples for a session, ordered by timestamp.
        This can be used for analysis, visualization, or session review.
    """
    Session.query.get_or_404(session_id)
    samples = StressSample.query.filter_by(session_id=session_id).order_by(StressSample.timestamp).all()

    return jsonify([{
        "stress_sample_id": s.id,
        "stress_score": s.stress_score,
        "emotion_label": s.emotion_label,
        "timestamp": s.timestamp.isoformat()
    } for s in samples]), 200

# Stock API Route Endpoint

# Temporary testing endpoint for API validation
@app.get("/test/quote/<symbol>")
def get_stock(symbol):
    """ Temporary test endpoint used to fetch quote data for one stock symbol from the Finnhub API. 
        This is useful for validating that the API key is working and that we can successfully retrieve stock data.
    """
    clean_symbol = str(symbol).upper().strip()
    if not validate_symbol(clean_symbol):
        return jsonify({"error": "Invalid symbol format"}), 400
    api_key = os.getenv("FINNHUB_API_KEY")
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={api_key}"
    try:
        request = requests.get(url)
        data = request.json()

        return{
            "symbol":symbol,
            "price":data.get("c"),
            "high":data.get("h"), 
            "low":data.get("l"),
            "open":data.get("o"),
            "previous_close":data.get("pc")
        }
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/market/quotes")
def get_market_quotes():
    """ Fetch quote data for multiple stock symbols from the Finnhub API.
        The frontend passes symbols as a comma-separated query string, e.g. /market/quotes?symbols=AAPL,GOOG,MSFT
        The response returns quote data for each symbol, or None if the external request fails for that symbol.
        This is useful for providing the frontend with up-to-date market data for the stocks being traded in the 
        sessions, which can be used for trade validation and portfolio valuation.
    """
    api_key = os.getenv("FINNHUB_API_KEY")
    symbols = request.args.get("symbols","")
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    if not symbol_list:
        return jsonify({"error": "No symbols provided"}), 400
    invalid_symbols = [s for s in symbol_list if not validate_symbol(s)]
    if invalid_symbols:
        return jsonify({"error": f"Invalid symbols: {', '.join(invalid_symbols)}"}), 400
    def fetch_one(symbol):
        try:
            url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={api_key}"
            res = requests.get(url, timeout = 3)
            data = res.json()

            return symbol, {
                "current":data.get("c"),
                "high":data.get("h"), 
                "low":data.get("l"),
                "open":data.get("o"),
                "previous_close":data.get("pc")
            }
        except Exception:
            return symbol, None
    results = {}
    with ThreadPoolExecutor(max_workers= min(10, len(symbol_list))) as executor:
        for symbol, data in executor.map(fetch_one, symbol_list):
            results[symbol] = data
    return jsonify(results), 200

# Create Database Tables

with app.app_context():
    db.create_all()

# Run the Flask App

if __name__ == "__main__":
    # Start development server on port 5000 with debug mode enabled 
    # for easier debugging and live reload during development.
    app.run(debug=True, port=5000)
