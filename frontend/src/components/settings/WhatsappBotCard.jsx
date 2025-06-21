import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { Bot, Send, Loader2 } from 'lucide-react';

const WhatsappBotCard = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testLoading, setTestLoading] = useState(false);

    const fetchBotStatus = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/workspaces/me', { credentials: 'include' });
            const data = await response.json();
            if (response.ok) {
                setIsEnabled(!!data.whatsapp_bot_enabled);
            }
        } catch (error) {
            console.error("Gagal memuat status bot:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBotStatus();
    }, [fetchBotStatus]);

    const handleToggle = async (e) => {
        const newStatus = e.target.checked;
        setIsEnabled(newStatus);
        try {
            await fetch('/api/bot/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify({ isEnabled: newStatus })
            });
        } catch (error) {
            alert("Gagal mengubah status bot.");
            setIsEnabled(!newStatus);
        }
    };
    
    const handleTestReport = async () => {
        setTestLoading(true);
        try {
            const response = await fetch('/api/bot/test-report', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert(data.message);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setTestLoading(false);
        }
    }

    if (loading) {
        return <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 text-center">Memuat...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Bot /> Bot WhatsApp Interaktif</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dapatkan info & notifikasi langsung dari WhatsApp.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isEnabled} onChange={handleToggle} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
            </div>
            {isEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={handleTestReport}
                        disabled={testLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-70"
                    >
                        {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {testLoading ? 'Mengirim...' : 'Kirim Laporan Tes Sekarang'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WhatsappBotCard;
