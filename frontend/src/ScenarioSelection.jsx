import {useNavigate} from 'react-router-dom';
import { useSession } from './Sessioncontext';
import {SCENARIOS} from './data/Scenarios';

export default function ScenarioSelection() {
    const navigate = useNavigate();
    const {setSelectedScenario} = useSession();
    const handleSelect = (scenario) => {
        setSelectedScenario(scenario);
        navigate('/simulator');
    };
    return(
        <div style={{
            minHeight: '100vh',
            background: '#07070e',
            color: '#f4f4f8',
            fontFamily: "'Space Mono', monospace",
            padding: '48px 32px',
        }}
        >
            <div style={{maxWidth: 1100, margin: '0 auto'}}>
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
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: 0,
                    marginBottom: 16,
                }} >
                    Choose your preferred scenario
                </h1>
                <p style={{ color: '#7878a0', maxWidth: 720, lineHeight: 1.8, marginBottom: 36}}>
                    Select a scenario to control the level of market pressure during the simulation.
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 18,
                }}>
                    {SCENARIOS.map((scenario) => (
                        <button
                        key = {scenario.id}
                        onClick={() => handleSelect(scenario)}
                        style={{
                            background: '#0d0d1c',
                            border: '1px solid #1a1a30',
                            borderRadius: 14,
                            padding: '22px 20px',
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
                                marginBottom: 10,
                                color: '#c4a87a',
                            }}
                            >
                                {scenario.name}
                            </h2>
                            <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(244, 244, 248, 0.72)', margin: 0 }}>
                                {scenario.description}
                            </p>
                            <p style={{
                                marginTop: 16,
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