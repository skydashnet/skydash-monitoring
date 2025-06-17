import React, { useState, useEffect, useCallback } from 'react';
import { useMikrotik } from '../hooks/useMikrotik';
import ConfigPrompt from '../components/common/ConfigPrompt';
import { Users, UserCheck, UserX, Plus } from 'lucide-react';
import SummaryCard from '../components/management/SummaryCard';
import AddPppoeSecretModal from '../components/management/AddPppoeSecretModal';
import PppoeSecretsList from '../components/management/PppoeSecretsList';
import InactiveSecretsModal from '../components/management/InactiveSecretsModal';


const ManagementPage = () => {
    const { isConfigured, configLoading } = useMikrotik();

    const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchSummary = useCallback(async () => {
        if (!isConfigured) return; 
        try {
            const response = await fetch('/api/pppoe/summary');
            if (!response.ok) throw new Error('Gagal memuat data ringkasan');
            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error(error);
        }
    }, [isConfigured]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary, refreshTrigger]);

    const handleSuccessAdd = () => {
        setIsAddModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };
    if (configLoading) {
        return <div className="p-8 text-center">Memeriksa konfigurasi...</div>;
    }
    if (!isConfigured) {
        return <ConfigPrompt />;
    }
    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manajemen PPPoE</h1>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Tambah Secret</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard 
                    title="Total Secrets" 
                    count={summary.total}
                    icon={<Users className="text-white/80" />} 
                    colorClass="bg-gradient-to-br from-blue-500 to-blue-700"
                />
                <SummaryCard 
                    title="Aktif" 
                    count={summary.active} 
                    icon={<UserCheck className="text-white/80" />} 
                    colorClass="bg-gradient-to-br from-green-500 to-green-700"
                />
                <button onClick={() => setIsInactiveModalOpen(true)} className="text-left">
                    <SummaryCard 
                        title="Tidak Aktif" 
                        count={summary.inactive} 
                        icon={<UserX className="text-white/80" />}
                        colorClass="bg-gradient-to-br from-red-500 to-red-700"
                    />
                </button>
            </div>
            
            <PppoeSecretsList refreshTrigger={refreshTrigger} />
            
            <AddPppoeSecretModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSuccessAdd}
            />
            <InactiveSecretsModal 
                isOpen={isInactiveModalOpen}
                onClose={() => setIsInactiveModalOpen(false)}
            />
        </div>
    );
};

export default ManagementPage;