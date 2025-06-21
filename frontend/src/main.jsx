import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ManagementPage from './pages/ManagementPage';
import LocationPage from './pages/LocationPage';
import HotspotPage from './pages/HotspotPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import PppoeUserDetailPage from './pages/PppoeUserDetailPage';
import ArpPage from './pages/ArpPage';

import './index.css';
import { MikrotikProvider } from './context/MikrotikProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthProvider';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'management', element: <ManagementPage /> },
          { path: 'management/pppoe/:name', element: <PppoeUserDetailPage /> },
          { path: 'location', element: <LocationPage /> },
          { path: 'hotspot', element: <HotspotPage /> },
          { path: 'arp', element: <ArpPage /> },
        ]
      },
      { path: '/login', element: <LoginPage />, },
      { path: '/register', element: <RegisterPage />, },
      { path: '*', element: <NotFoundPage />, }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
);