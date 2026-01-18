/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
*Description:
*   simple connectivity check page (TO BE CHANGED ONCE ROUTING IS DONE )
*   
*/

import {useEffect, useState} from 'react';

export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  const [error, setError] = useState("");
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("http://127.0.0.1:5000/health");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setApiStatus(`API OK: ${data.status}`);
      } catch (err) {
        setApiStatus("API Not Reachable");
        setError(String(err));
      }
    }
    checkHealth();
  }, []);
  return (
    <div style = {{fontFamily: "system-ui", padding:"24"}}>
      <h1>Affective Trading Frontend</h1>
      <p>{apiStatus}</p>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      <p> Backend Health: http://127.0.0.1:5000/health </p>
    </div>
  ); 
}