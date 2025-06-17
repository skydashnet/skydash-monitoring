import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import ProtectedRoute from './components/ProtectedRoute';

// Impor semua halaman
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ManagementPage from './pages/ManagementPage';
import LocationPage from './pages/LocationPage';
import HotspotPage from './pages/HotspotPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

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
          { path: 'location', element: <LocationPage /> },
          { path: 'hotspot', element: <HotspotPage /> },
        ]
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);