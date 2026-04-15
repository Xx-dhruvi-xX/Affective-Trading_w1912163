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
import { RouterProvider } from 'react-router-dom';
import {SessionProvider} from './Sessioncontext';
import router from './Router'; // React Router configuration

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  )
}