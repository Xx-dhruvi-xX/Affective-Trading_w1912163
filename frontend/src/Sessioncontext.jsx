/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  React context used to store and share session-related state across
*  the frontend application. It provides access to the active backend 
*  session ID and the currently selected trading scenario so that
*  multiple components can use the same session data without prop drilling.
*/
import { createContext, useContext, useState } from "react";

// Shared context for session data used across the application
const SessionContext = createContext(null);

// Wrap the app and provide shared session state to all child components.
export function SessionProvider({children}) {
  const[sessionId, setSessionId] = useState(null);
  const[selectedScenario, setSelectedScenario] = useState(null);
  return(
    <SessionContext.Provider
    value = {{
      sessionId,
      setSessionId,
      selectedScenario,
      setSelectedScenario,
    }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook that provides easy access to the session context.
// Prevent usage outside of the SessionProvider by throwing an error if context is not found.
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
