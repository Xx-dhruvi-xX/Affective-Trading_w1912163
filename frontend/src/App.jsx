/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  Main entry page for the React frontend
*  It wraps the application in the SessionProvider so 
*  session-related data can be accessed across the app, 
*  and sets up routing using React Router.
*/

import {useEffect, useState} from 'react';
import { RouterProvider } from 'react-router-dom';
import {SessionProvider} from './Sessioncontext';
import router from './Router'; // React Router configuration

export default function App() {
  return (
    <SessionProvider>
      {/* Routing for all frontend pages */}
      <RouterProvider router={router} />
    </SessionProvider>
  )
}