/** 
*Affective Trading (Final Year Project)
*Student Name: Dhruvi Soni
*Student ID: W1912163/3
*Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
*Module: 6COSC023W Computer Science Final Project
* Description:
*  Defines the application routes for the frontend using React Router.
*  Each route maps a URL path to a specific page component in the prototype,
*  including the splash screen, disclosure screen, scenario selection,
*  trading simulator, and dashboard. A catch-all route is included to redirect
*/

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Splashscreen from './Splashscreen';
import DisclosureScreen from './DisclosureScreen';
import SimulatorPage from './SimulatorPage';
import DashboardPage from './Dashboard';
import ScenarioSelection from './ScenarioSelection';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Splashscreen />,  
  },
 {
    path: '/disclosure',
    element: <DisclosureScreen />,
  },
  {
    path: '/scenario',
    element: <ScenarioSelection/>,
  },
  {
    path: '/simulator',
    element: <SimulatorPage/>,
  },
  {
    path: '/dashboard',
    element: <DashboardPage/>,
  },
  {
    // Catch-all — redirect unknown paths to splash
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;