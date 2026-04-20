/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description: 
*  Disclosure and Information screen shown before the simulator begins.
*  It presents key ethical and practical information to users about the simulator,
*  ensuring they are informed about privacy, data usage, and other important 
*  considerations before they start the simulation experience.
*/

import { useNavigate } from "react-router-dom";
import './Styles/DisclosureScreen.css';

// Content displayed as disclosure cards.
// Each object defines the icon, heading, message, and accent color
// used to present important information to users before they enter the simulator.
const CARDS = [
  {
    icon: '🔐',
    title: "Your Privacy Matters",
    body: "No raw video or images are stored. Only numeric stress-related session data may be recorded.",
    accent: '#2db8a0',
  },
  {
    icon: '📚',
    title: "Academic Use",
    body: "This system is an academic research prototype and is not intended as financial, medical, or any other professional advice.",
    accent: '#7c5cfc',
  },
  {
    icon: '📊',
    title: "Simulated Data",
    body: "All trading data is simulated and does not reflect real-world financial scenarios. Market prices are shown only to enhance realism",
    accent: '#c4a87a',
  },
  {
    icon: '📸',
    title: "Camera is entirely optional",
    body: "You can use the simulator without the camera, but no stress data will be collected for that session.",
    accent: '#7878a0',
  },
  {
    icon: '🌱',
    title: "Your Wellbeing Matters",
    body: "Your mental and physical wellbeing is important to us. If you feel uncomfortable at any time, please take a break.",
    accent: '#7878a0',
  },
];

export default function DisclosureScreen() {
  const navigate = useNavigate();

  // Move the user to the scenario selection page once they confirm
  // that they have read and understood the information presented in the disclosure cards.
  const handleAccept = () => {
    navigate('/scenario');
  };

  return (
    <div className="disclosure">
      <div className="disclosure-inner">
        <header className="disclosure_header">
          <p className="disclosure_eyebrow">Before You Begin</p>
          <h2 className="disclosure_title">Please Read Carefully</h2>
          <div className="disclosure_rule"></div>
        </header>

        {/* Render each disclosure card based on the content defined in the CARDS array. */}
        <div className="disclosure_cards">
          {CARDS.map((card, idx) => (
            <div key={idx} className="disclosure_card" style = {{borderLeftColor: card.accent, animationDelay: `${0.15 + idx * 0.08}s`}}>
              <span className="disclosure_card-icon">{card.icon}</span>
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

