import React, { useState, useEffect, useCallback } from 'react';
import { Users, Wifi, Plus } from 'lucide-react';
import SummaryCard from '../components/management/SummaryCard';
import AddHotspotUserModal from '../components/hotspot/AddHotspotUserModal';
import HotspotUserList from '../components/hotspot/HotspotUserList';
import HotspotActiveList from '../components/hotspot/HotspotActiveList';

const HotspotPage = () => {
    const [summary, setSummary] = useState({ totalUsers: 0, activeUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hotspot/summary', { credentials: 'include' });
            if (!response.ok) throw new Error('Gagal memuat data ringkasan hotspot');
            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary, refreshTrigger]);

    const handleSuccess = () => {
        setIsModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manajemen Hotspot</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Tambah User</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Total User Hotspot" 
                    count={loading ? '...' : summary.totalUsers} 
                    icon={<Users className="text-white/80" />} 
                    colorClass="bg-gradient-to-br from-sky-500 to-sky-700"
                />
                <SummaryCard 
                    title="User Aktif" 
                    count={loading ? '...' : summary.activeUsers} 
                    icon={<Wifi className="text-white/80" />} 
                    colorClass="bg-gradient-to-br from-emerald-500 to-emerald-700"
                />
            </div>
            <HotspotActiveList />
            <HotspotUserList refreshTrigger={refreshTrigger} />
            
            <AddHotspotUserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default HotspotPage;