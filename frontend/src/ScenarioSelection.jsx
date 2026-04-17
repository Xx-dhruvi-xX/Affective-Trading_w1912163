import {useNavigate} from 'react-router-dom';
import { useSession } from './Sessioncontext';
import {SCENARIOS} from './data/Scenarios';

const FLASK_BASE = 'http://localhost:5000';

export default function ScenarioSelection() {
    const navigate = useNavigate();
    const {setSelectedScenario, setSessionId} = useSession();
    const handleSelect = async(scenario) => {
        try{
            const response = await fetch(`${FLASK_BASE}/sessions`,{
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    scenario: scenario.name,
                    risk_level: scenario.riskLevel,
                    update_interval_ms: scenario.updateIntervalMs,
                    description: scenario.description,
                }),
            });
            if (!response.ok){
                alert('Failed to start session. Please try again.');
                return;
            }
            const data = await response.json();

            setSelectedScenario(scenario);
            setSessionId(data.session_id);
            navigate('/simulator')
        } catch(error){
            console.error('Error starting scenario session:', error);
            alert('An error occurred while starting the scenario.');
        }
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