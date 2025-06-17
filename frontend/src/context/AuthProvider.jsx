import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const checkLoggedIn = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            if (response.ok) {
                const user = await response.json();
                setAuthUser(user);
            } else {
                setAuthUser(null);
            }
        } catch (error) {
            console.error("Gagal memeriksa sesi login:", error);
            setAuthUser(null);
        } finally {
            if (loading) setLoading(false);
        }
    }, [loading]);

    useEffect(() => {
        checkLoggedIn();
    }, [checkLoggedIn]);
    
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error("Gagal saat logout di server:", error);
        } finally {
            setAuthUser(null);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const value = { authUser, setAuthUser, loading, logout, checkLoggedIn };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-xl dark:text-white">Memverifikasi sesi...</p>
            </div>
        );
    }
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};