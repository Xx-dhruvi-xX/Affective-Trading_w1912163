import { useNavigate } from "react-router-dom";
import { useSession } from "./SessionContext";
import './Styles/DisclosureScreen.css';

const FLASK_BASE = 'http://localhost:5000';

const CARDS = [
  {
    icon: '🔐',
    title: "Your Privacy Matters",
    body: "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. QUISQUAM, QUIS.",
    accent: '#2db8a0',
  },
  {
    icon: '📚',
    title: "Academic Use",
    body: "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. QUISQUAM, QUIS.",
    accent: '#7c5cfc',
  },
  {
    icon: '📊',
    title: "Simulated Data",
    body: "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. QUISQUAM, QUIS.",
    accent: '#c4a87a',
  },
  {
    icon: '📸',
    title: "Camera is entirely optional",
    body: "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. QUISQUAM, QUIS.",
    accent: '#7878a0',
  },
  {
    icon: '🌱',
    title: "Your Wellbeing Matters",
    body: "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. QUISQUAM, QUIS.",
    accent: '#7878a0',
  },
];

export default function DisclosureScreen() {
  const navigate = useNavigate();
  const { setSessionId } = useSession();
  const handleAccept = async () => {
    try {
      const response = await fetch(`${FLASK_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        alert("Failed to start session. Please try again.");
        return;
      }
      const data = await response.json();
      if (!data.session_id) {
        alert("Failed to start session. Please try again.");
        return;
      }
      setSessionId(data.session_id);
      navigate('/simulator');
    } catch (error) {
      console.error("Error starting session:", error);
      alert("An error occurred while starting the session. Please try again.");
    }
  };

  return (
    <div className="disclosure">
      <div className="disclosure-inner">
        <header className="disclosure_header">
          <p className="disclosure_eyebrow">Before You Begin</p>
          <h2 className="disclosure_title">Please Read Carefully</h2>
          <div className="disclosure_rule"></div>
        </header>
        <div className="disclosure_cards">
          {CARDS.map((card, idx) => (
            <div key={idx} className="disclosure_card" style = {{borderLeftColor: card.accent, animationDelay: `${0.15 + idx * 0.08}s`}}>
              <span className="disclosure_card-icon">{card.icon.icon}</span>
              <div>
                <p className="disclosure_card-title">{card.title}</p>
                <p className="disclosure_card-body">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
        <footer className="disclosure_footer">
          <p className="disclosure_consent">By clicking "I Understand", you acknowledge that you have read and understood the above information.</p>
          <button className="disclosure_cta" onClick={handleAccept}>I Understand - Enter Simulator</button>
          <p className="disclosure_meta">W1912163 . University of Westminster . 2025/2026</p>
        </footer>
      </div>
    </div>
  );
}

