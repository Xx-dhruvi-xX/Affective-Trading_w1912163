/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  Scenario selection screen for the trading simulation.
*  It displays a set of predefined market scenarios with 
*  varying levels of volatility and update frequencies.
*  When a user selects a scenario, it initiates a new session
*  on the Flask backend with the chosen settings, and the user 
*  is navigated to the simulator page. 
*/

import {useNavigate} from 'react-router-dom';
import { useSession } from './Sessioncontext';
import {SCENARIOS} from './data/Scenarios';

// Base URL for the Flask backend API
const FLASK_BASE = 'http://localhost:5000';

export default function ScenarioSelection() {
    const navigate = useNavigate();
    const {setSelectedScenario, setSessionId} = useSession();

    // Start a new backend session using the selected scenario settings,
    // then store the chosen scenario in context and open the simulator.
    const handleSelect = async (scenario) => {
        setSelectedScenario(scenario);
        try {
            const res = await fetch(`${FLASK_BASE}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario: scenario.name,
                    risk_level: scenario.riskLevel,
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSessionId(data.session_id);

            }
            else {
                console.error("Failed to start session")
            }
        } catch(err){
            console.error("Error starting session:", err);
        }
        navigate('/simulator');
    };
    return(
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#07070e',
            color: '#f4f4f8',
            fontFamily: "'Space Mono', monospace",
            padding: '48px 40px 56px',
            boxSizing: 'border-box',
        }}
        >
            <div style={{Width: '100%', maxWidth: '1600px', margin: '0 auto'}}>
                <p style={{
                    fontSize: 9,
                    letterSpacing: '0.45em',
                    color: '#42425a',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                }}>
                    Scenario Setup
                </p>
                <h1 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: 'clamp(42px, 6vw, 84px)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    margin: 0,
                    marginBottom: 18,
                    maxWidth: '900px',
                    lineHeight: 0.95,
                }} >
                    Choose your preferred scenario
                </h1>
                <p style={{ color: '#7878a0', maxWidth: 720, lineHeight: 1.8, marginBottom: 42, fontSize: 14,}}>
                    Select a scenario to control the level of market pressure during the simulation.
                </p>
                {/* Render one selectable card for each predefined scenario */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 22,
                    width: '100%',
                }}>
                    {SCENARIOS.map((scenario) => (
                        <button
                        key = {scenario.id}
                        onClick={() => handleSelect(scenario)}
                        style={{
                            background: '#0d0d1c',
                            border: '1px solid #1a1a30',
                            borderRadius: 14,
                            padding: '24px 22px',
                            textAlign: 'left',
                            color: '#f4f4f8',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = '#7c5cfc';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#1a1a30';
                        }}
                        >
                            <p style={{
                                fontSize: 8,
                                letterSpacing: '0.35em',
                                color: '#42425a',
                                textTransform: 'uppercase',
                                marginBottom: 12,
                            }}>
                                {scenario.riskLevel} Volatility
                            </p>
                            <h2 style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 30,
                                fontWeight: 300,
                                margin: 0,
                                marginBottom: 12,
                                color: '#c4a87a',
                                lineHeight: 1.1,
                            }}
                            >
                                {scenario.name}
                            </h2>
                            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(244, 244, 248, 0.72)', margin: 0 }}>
                                {scenario.description}
                            </p>
                            <p style={{
                                marginTop: 18,
                                fontSize: 9,
                                letterSpacing: '0.2em',
                                color: '#7878a0',
                            }}
                            >
                                Refresh Interval: {scenario.updateIntervalMs / 1000}s
                            </p>
                            </button>
                    ))}
                    </div>
                    </div>
                    </div>
    );
}