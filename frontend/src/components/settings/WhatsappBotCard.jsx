import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';

const WanInterfaceSelector = ({ devices, activeDeviceId, onUpdate }) => {
    const activeDevice = devices.find(d => d.id === activeDeviceId);
    const [interfaces, setInterfaces] = useState([]);
    const [selectedWan, setSelectedWan] = useState(activeDevice?.wan_interface || '');
    const [isLoading, setIsLoading] = useState(false);

    const fetchInterfaces = useCallback(async () => {
        if (!activeDevice) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/devices/${activeDevice.id}/interfaces`, { credentials: 'include' });
            const data = await response.json();
            if (response.ok) setInterfaces(data);
        } catch (error) {
            console.error("Gagal memuat interfaces:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeDevice]);
    
    const handleSetWan = async (e) => {
        const newInterface = e.target.value;
        setSelectedWan(newInterface);
        try {
            await fetch(`/api/devices/${activeDevice.id}/wan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify({ interfaceName: newInterface })
            });
            onUpdate();
        } catch (e) {
            console.error("Gagal menyimpan pilihan WAN:", e);
        }
    };

    if (!activeDevice) {
        return <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Pilih perangkat aktif terlebih dahulu di Manajemen Perangkat.</p>
    }

    return (
         <div className="mt-4">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Interface WAN Utama (Untuk Laporan)</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Pilih interface yang terhubung ke internet pada perangkat *{activeDevice.name}*.</p>
            <select
                value={selectedWan}
                onFocus={fetchInterfaces}
                onChange={handleSetWan}
                className="w-full p-1.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-md border-transparent focus:ring-2 focus:ring-blue-500"
            >
                <option value="" disabled>{isLoading ? 'Memuat...' : 'Pilih Interface WAN'}</option>
                {interfaces.map(iface => <option key={iface} value={iface}>{iface}</option>)}
            </select>
        </div>
    )
}


const WhatsappBotCard = () => {
    const [botStatus, setBotStatus] = useState({ isEnabled: false, loading: true });
    const [devices, setDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [testLoading, setTestLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        setBotStatus(prev => ({ ...prev, loading: true }));
        try {
            const [workspaceRes, devicesRes] = await Promise.all([
                fetch('/api/workspaces/me', { credentials: 'include' }),
                fetch('/api/devices', { credentials: 'include' })
            ]);
            
            const workspaceData = await workspaceRes.json();
            if (workspaceRes.ok) {
                setBotStatus(prev => ({ ...prev, isEnabled: !!workspaceData.whatsapp_bot_enabled }));
                setActiveDeviceId(workspaceData.active_device_id);
            }

            const devicesData = await devicesRes.json();
            if (devicesRes.ok) {
                setDevices(devicesData);
            }
        } catch (error) {
            console.error("Gagal memuat status bot:", error);
        } finally {
            setBotStatus(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleToggle = async (e) => {
        const newStatus = e.target.checked;
        setBotStatus(prev => ({ ...prev, isEnabled: newStatus }));
        try {
            await fetch('/api/bot/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify({ isEnabled: newStatus })
            });
        } catch (error) {
            alert("Gagal mengubah status bot.");
            setBotStatus(prev => ({ ...prev, isEnabled: !newStatus }));
        }
    };
    
    const handleTestReport = async () => {
        setTestLoading(true);
        try {
            const response = await fetch('/api/bot/test-report', { method: 'POST', credentials: 'include' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert(data.message);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setTestLoading(false);
        }
    }

    if (botStatus.loading) {
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
                    <input type="checkbox" checked={botStatus.isEnabled} onChange={handleToggle} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
            </div>

            {botStatus.isEnabled && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    <WanInterfaceSelector 
                        devices={devices} 
                        activeDeviceId={activeDeviceId} 
                        onUpdate={() => setRefreshTrigger(p => p + 1)}
                    />
                    <div>
                        <button 
                            onClick={handleTestReport}
                            disabled={testLoading}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-70"
                        >
                            {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {testLoading ? 'Mengirim...' : 'Kirim Laporan Tes Sekarang'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsappBotCard;
