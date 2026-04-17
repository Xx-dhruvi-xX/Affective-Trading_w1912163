import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "./Sessioncontext";
import {LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid} from "recharts";

const FLASK_BASE = 'http://localhost:5000';
function formatCurrency(value){
  return `£${Number(value || 0).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2,})}`;
}
function formatTimeLabel(isoString){
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', second: '2-digit',});
}
export default function Dashboard(){
  const navigate = useNavigate();
  const {sessionId, setSessionId} = useSession();
  const [summary, setSummary] = useState(null);
  const [stressSamples, setStressSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if(!sessionId){
      setLoading(false);
      return;
    }
    async function loadDashboardData() {
      try{
        const [summaryRes, stressRes] = await Promise.all([
          fetch(`${FLASK_BASE}/sessions/${sessionId}/summary`),
          fetch(`${FLASK_BASE}/sessions/${sessionId}/stress`),
        ]);
        const summaryData = await summaryRes.json();
        const stressData = await stressRes.json();
        setSummary(summaryData);
        setStressSamples(Array.isArray(stressData) ? stressData : []);
      } catch(error){
        console.error('Failed to load dashboard data:',error);
      } finally{
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [sessionId]);
  const handleExit = () => {
    setSessionId(null);
    navigate('/');
  };
  const avgStress = summary?.average_stress_score;
  const tradeCount = summary?.trade_count ?? 0;
  const scenarioName = summary?.scenario ?? 'Not recorded';
  const riskLevel = summary?.risk_level ?? 'Not recorded';
  const stressLevel = avgStress == null ? 'N/A' : avgStress < 30 ? 'Low' : avgStress < 60 ? 'Moderate' : 'High';
  const stressColor = avgStress == null ? '#42425a' : avgStress < 30 ? '#4ade80' : avgStress < 60 ? '#c4a87a' : '#f87171';
  const insight = 
  avgStress == null ? 'No stress data recorded this session. Enable emotion recognition during the next session.' :
  avgStress < 30 ? 'You traded calmly this session. Low stress is associated with more rational decision-making and reduced susceptibility to panic selling and loss aversion.':
  avgStress < 60 ? 'You experienced moderate stress during this session. Consider pausing before placing trades when stress rises-elevated arousal can increase impulsive decision-making.':
  'High stress was detected during this session. Research shows high emotional arousal significantly increases loss aversion and herding behaviour.';
  const stressChartData = useMemo( () => {
    return stressSamples.map((sample,index) => ({
      index: index + 1,
      time: formatTimeLabel(sample.timestamp),
      stress: sample.stress_score,
    }));
  }, [stressSamples]);
  return(
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#07070e',
      boxSizing: 'border-box',
      fontFamily: "'Space Mono', monospace",
      color: '#f4f4f8',
      padding: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px',
        height: 50,
        borderBottom: '1px solid #1a1a30',
        background: '07070e',
      }}>
        <span style={{
          fontSize: 9,
          letterSpacing: '0.45em',
          color: '#42425a',
          textTransform: 'uppercase',
        }}>
          Session Analysis
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16'
        }}>
          {sessionId && (
            <span style={{
              fontSize: 9,
              color: 'rgba(44, 184, 160, 0.6)',
              letterSpacing: '0.2em',
            }}>
              Session #{sessionId}
            </span>
          )}
          <button
          onClick={handleExit}
          style={{
            padding: '7px 18px',
            background: 'transparent',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            borderRadius: 6,
            color: 'rgba(248, 113, 113, 0.7)',
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; e.currentTarget.style.color = '#f87171'}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(248, 113, 113, 0.7)'}}
          >
            Exit
          </button>
         </div>
         </div>
         <div style={{
          padding: '52px 40px 80px',
          width: '100%',
          boxSizing: 'border-box',
         }} 
         >
          <div style = {{marginBottom: 48}}>
            <p style={{
              fontSize: 9,
              letterSpacing: '0.55em',
              color: '#42425a',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Post-session
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 'clamp(32px, 5vw, 56px)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#f4f4f8',
              margin: 0,
            }}>
              Your Analysis
            </h1>
            <div style={{
              width: 40,
              height: 1,
              background: 'linear-gradient(90deg, #4a33fa0, #2db8ao)',
              marginTop: 20,
            }} />
            </div>
            {loading ? (
              <p style={{
                fontSize: 11,
                color: '#42425a',
                letterSpacing: '0.2em',
              }}>
                Loading Session data....
              </p>
            ) : (
              <>
              <p style={{
                fontSize: 8,
                letterSpacing: '0.45em',
                color: '#42425a',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                Session Summary
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                width: '100%',
                marginBottom: 40,
              }}>
                {[
                  {label: 'Trades Placed', value: tradeCount, color: '#f4f4f8'},
                  {label: 'Avg Stress score', value: avgStress != null ? Math.round(avgStress): '-', color: stressColor},
                  {label: 'Stress Level', value: stressLevel, color: stressColor},
                  {label: 'Stress Samples', value: summary?.stress_sample_count ?? '-', color: '#f4f4f8'},
                /** */
                ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0d0d1c',
                    border: '1px solid #1a1a30',
                    borderRadius: 10,
                    padding: '24px 20px',
                  }}
                >
                  <p
                    style={{
                      fontSize: 8,
                      letterSpacing: '0.4em',
                      color: '#42425a',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    {item.label}
                  </p>

                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 300,
                      fontSize: 42,
                      color: item.color,
                      margin: 0,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <p
              style={{
                fontSize: 8,
                letterSpacing: '0.45em',
                color: '#42425a',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Scenario Context
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
                width: '100%',
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  background: '#0d0d1c',
                  border: '1px solid #1a1a30',
                  borderRadius: 10,
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.4em',
                    color: '#42425a',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Scenario
                </p>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: 34,
                    color: '#c4a87a',
                    margin: 0,
                  }}
                >
                  {scenarioName}
                </p>
              </div>

              <div
                style={{
                  background: '#0d0d1c',
                  border: '1px solid #1a1a30',
                  borderRadius: 10,
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.4em',
                    color: '#42425a',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Risk Level
                </p>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: 34,
                    color: '#7c5cfc',
                    margin: 0,
                  }}
                >
                  {riskLevel}
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: 8,
                letterSpacing: '0.45em',
                color: '#42425a',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Stress Trend
            </p>

            <div
              style={{
                background: '#0d0d1c',
                border: '1px solid #1a1a30',
                borderRadius: 10,
                padding: '20px 24px',
                width: '100%',
                height: 320,
                boxSizing: 'border-box',
                marginBottom: 40,
              }}
            >
              {stressChartData.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: '#7878a0',
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  No stress data available for charting. Enable the camera during a session to generate a stress trend.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a30" />
                    <XAxis dataKey="time" stroke="#7878a0" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#7878a0" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111128',
                        border: '1px solid #1a1a30',
                        borderRadius: 8,
                        color: '#f4f4f8',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke="#c4a87a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <p
              style={{
                fontSize: 8,
                letterSpacing: '0.45em',
                color: '#42425a',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Behavioural Insight
            </p>

            <div
              style={{
                background: '#0d0d1c',
                border: '1px solid #1a1a30',
                borderLeft: `3px solid ${stressColor}`,
                borderRadius: 10,
                padding: '24px 28px',
                width: '100%',
                marginBottom: 40,
                boxSizing: 'border-box',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(244,244,248,0.75)',
                  lineHeight: 1.9,
                  letterSpacing: '0.02em',
                  margin: 0,
                }}
              >
                {insight}
              </p>
            </div>

            {summary?.cash_balance != null && (
              <>
                <p
                  style={{
                    fontSize: 8,
                    letterSpacing: '0.45em',
                    color: '#42425a',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Final Portfolio
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      Object.keys(summary.holdings ?? {}).length > 0 ? '1fr 1fr' : '1fr',
                    gap: 16,
                    width: '100%',
                    marginBottom: 40,
                  }}
                >
                  <div
                    style={{
                      background: '#0d0d1c',
                      border: '1px solid #1a1a30',
                      borderRadius: 10,
                      padding: '20px 24px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 8,
                        letterSpacing: '0.4em',
                        color: '#42425a',
                        textTransform: 'uppercase',
                        marginBottom: 12,
                      }}
                    >
                      Cash Balance
                    </p>

                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 300,
                        fontSize: 36,
                        color: '#c4a87a',
                        margin: 0,
                      }}
                    >
                      {formatCurrency(summary.cash_balance)}
                    </p>
                  </div>

                  {Object.keys(summary.holdings ?? {}).length > 0 && (
                    <div
                      style={{
                        background: '#0d0d1c',
                        border: '1px solid #1a1a30',
                        borderRadius: 10,
                        padding: '20px 24px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 8,
                          letterSpacing: '0.4em',
                          color: '#42425a',
                          textTransform: 'uppercase',
                          marginBottom: 12,
                        }}
                      >
                        Open Positions
                      </p>

                      {Object.entries(summary.holdings).map(([sym, qty]) => (
                        <div
                          key={sym}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: '1px solid #1a1a30',
                            fontSize: 11,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{sym}</span>
                          <span style={{ color: '#42425a' }}>{qty} shares</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <p
              style={{
                fontSize: 10,
                color: '#42425a',
                letterSpacing: '0.2em',
                textAlign: 'center',
                lineHeight: 1.8,
                marginTop: 24,
              }}
            >
              W1912163 · University of Westminster · Affective Trading · 2025
            </p>
          </>
        )}
      </div>
    </div>
  );
}