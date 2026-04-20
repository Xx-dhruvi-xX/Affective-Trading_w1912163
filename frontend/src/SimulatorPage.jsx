/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  Container page for the main simulator.
*  It combines the TradingSimulator component and the EmotionRecognitionPanel
*  component in a responsive layout.
*/
import {useState} from "react";
import TradingSimulator from "./TradingSimulator";
import EmotionRecognitionPanel from "./EmotionRecognitionPanel";
import {useSession} from "./Sessioncontext";

export default function SimulatorPage() {

  // Controls whether the emotion recognition panel is open or collapsed. Defaults to open on page load.
  const[panelOpen, setPanelOpen] = useState(true);
  
  // Get the active session ID so it can be passed to the EmotionRecognitionPanel to fetch the relevant emotion data for the current trading session.
  const { sessionId } = useSession();

  return(
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#07070e'}}>
      {/*Main simulator area containing trading interface */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <TradingSimulator/>
      </div>
      {/*Collapsible side panel containing emotion recognition controls with a toggle button */}
      <aside style={{
        width: panelOpen ? 360 : 42,
        flexShrink: 0,
        borderLeft: '1px solid #1a1a30',
        background: '#07070e',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/*Toggle button to open/collapse the emotion recognition panel.*/}
      <button onClick = {() => setPanelOpen(v => !v)}
        style={{
          position: 'absolute',
          top: '50%',
          left: panelOpen ? 6:0,
          transform: 'translateY(-50%)',
          width: 28,
          height: 56,
          background: '#111128',
          border: '1px solid #1a1a30',
          borderRadius: 6,
          color: '#7878a0',
          cursor: 'pointer',
          fontSize: 13,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.35s',
        }}
        >
          {panelOpen ? '>':'<'}
        </button>
        {panelOpen && (
          <div style = {{
            padding: '13px 14px 11px 44px',
            borderBottom: '1px solid #1a1a30',
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.5em',
            color: '#42425a',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}> 
          Emotion Recognition
          </div>
        )}
        {panelOpen && (
          <div style={{ flex: 1, overflowY: 'auto'}}>
            <EmotionRecognitionPanel sessionId={sessionId}/>
          </div>
        )}
      </aside>
    </div>
  );
}