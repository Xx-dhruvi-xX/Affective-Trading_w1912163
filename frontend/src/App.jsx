/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  Main entry page for the React frontend
*   Renders the key prototype components 
*/

import {useEffect, useState} from 'react';
import EmotionRecognitionPanel  from './EmotionRecognitionPanel';

export default function App() {
  return (
    <div style = {{fontFamily: "system-ui", padding:"24"}}>
      <h1>Affective Trading Frontend</h1>
      <EmotionRecognitionPanel/>
    </div>
  )
}