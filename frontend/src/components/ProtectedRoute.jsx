import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { Navigate, Outlet } from 'react-router-dom';
import ProtectedLayout from './ProtectedLayout';

const ProtectedRoute = () => {
    const { authUser, loading } = useAuth();
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-xl">Memverifikasi sesi...</p>
            </div>
        );
    }
    return authUser ? <ProtectedLayout /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;