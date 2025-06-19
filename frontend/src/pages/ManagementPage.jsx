import React, { useState, useEffect, useCallback } from 'react';
import { useMikrotik } from '../context/MikrotikProvider';
import ConfigPrompt from '../components/common/ConfigPrompt';
import FeatureNotAvailable from '../components/common/FeatureNotAvailable';
import { Users, UserCheck, UserX, Plus } from 'lucide-react';
import SummaryCard from '../components/management/SummaryCard';
import AddPppoeSecretModal from '../components/management/AddPppoeSecretModal';
import PppoeSecretsList from '../components/management/PppoeSecretsList';
import InactiveSecretsModal from '../components/management/InactiveSecretsModal';

const ManagementPage = () => {
    const { deviceStatus } = useMikrotik();
    const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
    const [secrets, setSecrets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // --- FUNGSI FETCH DIPERBARUI TOTAL ---
    const fetchManagementData = useCallback(async () => {
        if (!deviceStatus.isConfigured || !deviceStatus.capabilities?.hasPppoe) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/pppoe/management-data', { credentials: 'include' });
            if (!response.ok) throw new Error('Gagal memuat data manajemen');
            const data = await response.json();
            
            // Set kedua state dari satu panggilan API
            setSummary(data.summary || { total: 0, active: 0, inactive: 0 });
            setSecrets(data.secrets || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [deviceStatus]);
    // ------------------------------------

    useEffect(() => {
        fetchManagementData();
    }, [fetchManagementData, refreshTrigger]);

    const handleSuccessAdd = () => {
        setIsAddModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    if (deviceStatus.isLoading) return <div className="p-8 text-center">Memeriksa konfigurasi...</div>;
    if (!deviceStatus.isConfigured) return <ConfigPrompt />;
    if (deviceStatus.capabilities && !deviceStatus.capabilities.hasPppoe) {
        return <div className="p-8"><FeatureNotAvailable featureName="PPPoE" /></div>;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen PPPoE</h1>
                <button onClick={() => setIsIpPoolModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition-colors">
                    <Settings size={18} />
                    <span className="hidden sm:inline">Atur IP Pool</span>
                    </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Tambah Secret</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard title="Total Secrets" count={summary.total} icon={<Users />} colorClass="bg-gradient-to-br from-blue-500 to-blue-700" />
                <SummaryCard title="Aktif" count={summary.active} icon={<UserCheck />} colorClass="bg-gradient-to-br from-green-500 to-green-700" />
                <button onClick={() => setIsInactiveModalOpen(true)} className="text-left"><SummaryCard title="Tidak Aktif" count={summary.inactive} icon={<UserX />} colorClass="bg-gradient-to-br from-red-500 to-red-700" /></button>
            </div>
            <PppoeSecretsList secretsData={secrets} loading={loading} />
            <AddPppoeSecretModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccessAdd} />
            <InactiveSecretsModal isOpen={isInactiveModalOpen} onClose={() => setIsInactiveModalOpen(false)} />
            <IpPoolManagerModal isOpen={isIpPoolModalOpen} onClose={() => setIsIpPoolModalOpen(false)} />
        </div>
    );
};

export default ManagementPage;