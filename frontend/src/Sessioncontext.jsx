import { createContext, useContext, useState } from "react";

const SessionContext = createContext(null);
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
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
