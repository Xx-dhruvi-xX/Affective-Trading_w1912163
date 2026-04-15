import { useEffect, useState, useCallback } from "react";
import {useNavigate} from "react-router-dom";
import {useSession} from "./Sessioncontext";
import {STOCKS} from "./data/Stocks";
import "./Styles/TradingSimulator.css";

const FLASK_BASE = "http://localhost:5000";
const PRICE_UPDATE_MS = 5000;
const STARTING_CASH = 100000;

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const fmtCcy = (n) => `£${fmt(n)}`;
const pctChange = (a,b) => (b === 0 ? 0: ((a-b)/b) * 100);

export default function TradingSimulator(){
  const navigate = useNavigate();
  const {sessionId} = useSession();

  const initialPrices = Object.fromEntries(STOCKS.map((s) => [s.symbol, 0]));
  const [prices, setPrices] = useState(initialPrices);
  const [prevPrices, setPrevPrices] = useState(initialPrices);
  const [selected, setSelected] = useState(STOCKS[0].symbol);
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [cash, setCash] = useState(STARTING_CASH);
  const [holdings, setHoldings] = useState({});
  const [trades, setTrades] = useState([]);
  const [msg, setMsg] = useState(null);
  const [backendOk, setBackendOk] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    const symbols = STOCKS.map((s) => s.symbol).join(',');
    const fetchQuotes = async() => {
      try{
        const res = await fetch(`${FLASK_BASE}/market/quotes?symbols=${symbols}`);
        if(!res.ok){
          console.error("Quote request failed");
          return;
        }
        const data = await res.json();
        setPrices((prev) => {
          setPrevPrices(prev);
          const next = {...prev};
          for(const symbol of Object.keys(data)){
            const quote = data[symbol];
            if(quote && typeof quote.current === "number" && quote.current > 0) {
              next[symbol] = quote.current;
            }
          }
          return next;
        });
        setPricesLoading(false);
      } catch (err){
        console.error("Failed to fetch live quotes: ", err);
      }
    };
    fetchQuotes();
    const id = setInterval(fetchQuotes, PRICE_UPDATE_MS);
    return() => clearInterval(id);
  }, []);
  const holdingsValue = Object.entries(holdings).reduce((sum, [sym, qty]) => sum + qty * (prices[sym] ?? 0), 0);
  const totalValue = cash + holdingsValue;
  const pnl = totalValue - STARTING_CASH;
  const pnlPct = pctChange(totalValue, STARTING_CASH);
  const tradeValue = (prices[selected] ?? 0) * quantity;
  const isUp = (sym) => (prices[sym] ?? 0) >= (prevPrices[sym] ?? 0);
  const executeTrade = useCallback(async() => {
    setMsg(null);
    const price = prices[selected];
    const qty = parseInt(quantity, 10);

    if(!price || price <= 0){
      setMsg({ok: false, text: "Live price not available yet. Please wait."});
      return;
    }
    if(!qty || qty <= 0){
      setMsg({ok: false, text: "Quantity must be at-least 1."});
      return;
    }
    if(side === "BUY"){
      if(price * qty > cash){
        setMsg({ok: false, text: `Insufficient funds. Need ${fmtCcy(price * qty)}.`});
      return;
      }
      setCash((c) => parseFloat((c - price * qty).toFixed(2)));
      setHoldings((h) => ({...h, [selected]: (h[selected] ?? 0) + qty}));
    } else{
      const owned = holdings[selected] ?? 0;
      if(qty > owned){
        setMsg({ok: false, text: `you only hold ${owned} share(s) of ${selected}.`});
        return;
      }
      setCash((c) => parseFloat((c + price * qty).toFixed(2)));
      setHoldings((h) => {
        const updated = {...h};
        const left = (updated[selected] ?? 0) - qty;
        if(left === 0) delete updated[selected];
        else updated[selected] = left;
        return updated;
      });
    }
    const trade = {
      id: Date.now(),
      symbol: selected, side,
      quantity: qty, price,
      time: new Date().toLocaleTimeString("en-GB")
    };
    setTrades((t) => [trade, ...t]);
    setMsg({ok: true, text: `${side} ${qty} x ${selected} @ ${fmtCcy(price)}`});
    if(sessionId){
      try{
        const r = await fetch(`${FLASK_BASE}/sessions/${sessionId}/trades`,{
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            symbol: selected, side,
            quantity: qty, price,
          }),
        });
        const data = await r.json();
        setBackendOk(r.ok);
        if(r.ok){
          if(typeof data.new_cash_balance === 'number'){
            setCash(data.new_cash_balance);
          }
          if(data.holdings){
            setHoldings(data.holdings);
          }
        } else{
          setMsg({ok: false, text: data.error || "Trade failed in backend."});
        }
      } catch(err){
        console.error(err);
        setBackendOk(false);
      }
    }
  }, [prices, selected, side, quantity, cash, holdings, sessionId]);
  const handleFinish = async() => {
    if(sessionId){
      try{
        await fetch(`${FLASK_BASE}/sessions/${sessionId}/end`, {method: 'POST'});
      } catch {}
    }
    navigate('/dashboard');
  };
  return(
    <div className="sim">
      <div className="sim_topbar">
        <div className="sim_topbar-left">
          <span className="sim_label">Simulator</span>
          {sessionId && <span className="sim_session-tag">Session #{sessionId}</span>}
          {backendOk !== null && (
            <span className={`sim_backend-dot sim_backend-dot--${backendOk ? 'ok':'err'}`}>
              . {backendOk ? 'BACKEND OK':'BACKEND ERR'}
            </span>
          )}
          </div>
          <div className="sim_topbar-right">
            <span className="sim_portfolio-summary">
              Portfolio:{''}
              <span className={`sim_portfolio-value sim_portfolio-value--${pnl >= 0 ? 'gain':'loss'}`}>
                {fmtCcy(totalValue)}
              </span>
              <span className={`sim_pnl sim_pnl--${pnl >= 0 ? 'gain':'loss'}`}>
                {pnl >= 0 ? '+':''}
                {fmtCcy(pnl)} ({pnlPct.toFixed(2)}%)
              </span>
            </span>
            <button className="sim_end-btn" onClick={handleFinish}>
              End Session
            </button>
            </div>
            </div>
            <div className="sim_body">
              <div className="sim_col">
                <p className="sim_col-heading">Markets</p>
                {STOCKS.map(({symbol, name}) => (
                  <button 
                  key={symbol} 
                  className={`sim_price-row${selected === symbol ? 'sim_price-row--active':''}`}
                  onClick={() => setSelected(symbol)}
                  >
                    <div>
                      <div className="sim_price-symbol">{symbol}</div>
                      <div className="sim_price-name">{name}</div>
                    </div>
                    <div>
                      <div className={`sim_price-value sim_price-value--${isUp(symbol) ? 'up':'down'}`}>
                        {prices[symbol] > 0 ? fmtCcy(prices[symbol]): 'Loading...'}
                      </div>
                      <div className={`sim_price-change sim_price-change--${isUp(symbol) ? 'up':'down'}`}>
                        {prices[symbol] > 0 && prevPrices[symbol] > 0 ? `${isUp(symbol) ? '▲':'▼'} ${fmt(Math.abs(prices[symbol] - prevPrices[symbol]))}`
                        : '-'}
                      </div>
                    </div>
                    </button>
                ))}
                <p className="sim_price-note">
                  {pricesLoading ? 'Loading live quotes...' : 'Live quotes refresh every 5s'}
                </p>
                </div>
                <div className="sim_trade-col">
                  <div className="sim_selected-header">
                    <div style={{display: 'flex', alignItems: 'baseline'}}>
                      <span className="sim_selected-symbol">{selected}</span>
                      <span className="sim_selected-name">
                        {STOCKS.find((s) => s.symbol === selected)?.name}
                      </span>
                      </div>
                      <div className={`sim_selected-price sim_selected-price--${isUp(selected) ? 'up':'down'}`}>
                        {prices[selected] > 0 ? fmtCcy(prices[selected]): 'Loading...'}
                      </div>
                      </div>
                      <div className="sim_side-toggle">
                        {['BUY', 'SELL'].map((s) => (
                          <button
                          key={s}
                          className={`sim_side-btn${side === s ? `sim_side-btn--${s.toLowerCase()}-active`: ''}`}
                          onClick={() => setSide(s)}
                          >{s}</button>
                        ))}
                      </div>
                      <label className="sim_field-label">Quantity (shares)</label>
                      <input
                      className="sim_input"
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)||1))}
                      />
                      <div className="sim_cost-row">
                        <span className="sim_cost-label">{side === 'BUY' ? 'Total cost':'Proceeds'}</span>
                        <span className={`sim_cost-label sim_cost-value--${side.toLowerCase()}`}>
                          {prices[selected] > 0 ? fmtCcy(tradeValue):'-'}
                        </span>
                      </div>
                      <button
                      className={`sim_submit sim_submit--${side.toLowerCase()}`}
                      onClick={executeTrade}
                      disabled={prices[selected] <= 0}
                      >
                        {side} {quantity} x {selected}
                      </button>
                      {msg && (
                        <div className={`sim_msg sim_msg--${msg.ok ? 'ok':'err'}`}>
                          {msg.ok ? '✓':'⛌'} {msg.text}
                        </div>
                      )}
                      <div className="sim_history">
                        <p className="sim_col-heading" style={{padding: 0, marginBottom: 12}}>
                          Trade History
                        </p>
                        {trades.length === 0 ? (
                          <p className="sim_history-empty">No trades yet</p>
                        ) : (
                          <div className="sim_history-list">
                            {trades.map((t) => (
                              <div key={t.id} className="sim_history-row">
                                <span className={`sim_history-badge sim_history-badge--${t.side.toLowerCase()}`}>
                                  {t.side}
                                </span>
                                <span className="sim_history-symbol">{t.symbol}</span>
                                <span className="sim_history-detail">{t.quantity}</span>
                                <span className="sim_history-detail">{fmtCcy(t.price)}</span>
                                <span className="sim_history-time">{t.time}</span>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                        </div>
                        <div className="sim_col" style={{padding: 20}}>
                          <p className="sim_col-heading" style={{padding: 0, marginBottom: 16}}>
                            Portfolio
                          </p>
                          <div className="sim_port-stat">
                            <p className="sim_port-stat-label">Cash Balance</p>
                            <p className="sim_port-stat-value sim_port-stat-value--cash">{fmtCcy(cash)}</p>
                          </div>
                          <div className="sim_port-stat">
                            <p className="sim_port-stat-label">Holdings Value</p>
                            <p className="sim_port-stat-value sim_port-stat-value--hold">{fmtCcy(holdingsValue)}</p>
                          </div>
                          <div className="sim_port-total">
                            <p className="sim_port-stat-label">Total Portfolio</p>
                            <p className={`sim_port-total-value sim_port-total-value--${pnl >= 0 ? 'gain':'loss'}`}>{fmtCcy(totalValue)}</p>
                             <p className={`sim_port-total-pnl sim_port-total-pnl--${pnl >= 0 ? 'gain':'loss'}`}>
                              {pnl >= 0 ? '+':''}
                              {fmtCcy(pnl)}
                              ({pnlPct.toFixed(2)}%)
                              </p>
                          </div>
                           <p className="sim_col-heading" style={{ padding: 0, marginBottom: 10}}>Open Positions</p>
                           {Object.keys(holdings).length === 0 ? (
                            <p className="sim_holding-empty">No Positions</p>
                           ) : (
                            Object.entries(holdings).map(([sym,qty]) => (
                              <div key={sym} className="sim_holding-row">
                                <div>
                                  <p className="sim_holding-symbol">{sym}</p>
                                  <p className="sim_holding-qty">{qty} shares</p>
                                </div>
                                <div>
                                  <p className="sim_holding-value">{fmtCcy(qty * (prices[sym] ?? 0))}</p>
                                  <p className="sim_holding-price">{fmtCcy(prices[sym] ?? 0)}/sh</p>
                                </div>
                                </div>
                            ))
                          )}
                          </div>
                          </div>
                          </div>
  );
}
