/**
 * Affective Trading — router.jsx
 * Defines all application routes using React Router v6.
 *
 * Install dependency (if not already installed):
 *   npm install react-router-dom
 *
 * Route map:
 *   /             → SplashScreen      (cinematic intro)
 *   /disclosure   → DisclosureScreen  (FYI / consent)
 *   /simulator    → SimulatorPage     (trading + emotion panel)
 *   /dashboard    → DashboardPage     (post-session analytics)
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Splashscreen from './Splashscreen';
import DisclosureScreen from './DisclosureScreen';
import SimulatorPage from './SimulatorPage';
import DashboardPage from './Dashboard';

const router = createBrowserRouter([
  {
    path:    '/',
    element: <Splashscreen />,  
  },
 {
    path:    '/disclosure',
    element: <DisclosureScreen />,
  },
  {
    path:    '/simulator',
    element: <SimulatorPage />,
  },
  {
    path:    '/dashboard',
    element: <DashboardPage />,
  },
  {
    // Catch-all — redirect unknown paths to splash
    path:    '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;