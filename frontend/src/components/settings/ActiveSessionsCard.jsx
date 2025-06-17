import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Smartphone, Tablet, LogOut } from 'lucide-react';

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `beberapa detik yang lalu`;
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
};

const getDeviceIcon = (osName = '') => {
    const name = osName.toLowerCase();
    if (name.includes('windows') || name.includes('linux') || name.includes('mac')) {
        return <Monitor className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
    }
    if (name.includes('android') || name.includes('ios')) {
        return <Smartphone className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
    }
    return <Tablet className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
};


const ActiveSessionsCard = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/sessions', { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Gagal memuat sesi.');
            }
            setSessions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleDisconnect = async (sessionId) => {
        if (!window.confirm('Anda yakin ingin menghentikan sesi di perangkat ini? Sesi tersebut akan langsung logout.')) {
            return;
        }
        setError('');
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal menghentikan sesi.');
            }
            fetchSessions();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Perangkat yang Login</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Ini adalah daftar perangkat yang telah login dengan akun Anda.
            </p>
            <div className="space-y-4">
                {loading ? (
                    <p className="text-center text-sm p-4">Memuat daftar sesi...</p>
                ) : error ? (
                    <p className="text-center text-sm p-4 text-red-500">{error}</p>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {getDeviceIcon(session.os)}
                            <div className="flex-grow">
                                <p className="font-semibold">{session.browser || 'Browser Tidak Dikenal'} on {session.os || 'OS Tidak Dikenal'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {session.ip_address} &bull; Terakhir aktif: {formatTimeAgo(session.last_seen)}
                                </p>
                            </div>
                            {session.isCurrentSession ? (
                                <span className="text-sm font-bold text-green-600 dark:text-green-400 px-3 whitespace-nowrap">Sesi Ini</span>
                            ) : (
                                <button 
                                    onClick={() => handleDisconnect(session.id)}
                                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500"
                                    title="Hentikan sesi"
                                >
                                    <LogOut size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
                 {sessions.length === 0 && !loading && !error && (
                    <p className="text-center text-sm p-4 text-gray-500">Tidak ada sesi aktif lain yang ditemukan.</p>
                )}
            </div>
        </div>
    );
};

export default ActiveSessionsCard;