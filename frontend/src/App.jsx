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
import EmotionRecognitionPanel  from './EmotionRecognitionPanel';
import FacialLandmarkDetection from './FacialLandmarkDetection'
export default function App() {
  return (
    <div style = {{fontFamily: "system-ui", padding:"24"}}>
      <h1>Affective Trading Frontend</h1>
      <FacialLandmarkDetection/>
    </div>
  )
}