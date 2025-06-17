import React, { useState, useEffect, useCallback } from 'react';
import { useMikrotik } from '../../context/MikrotikProvider';
import { Server, Plus, Edit, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import DeviceModal from './DeviceModal';

const DeviceManagementCard = () => {
    const [devices, setDevices] = useState([]);
    const [activeDeviceId, setActiveDeviceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { restartMonitoring } = useMikrotik();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [devicesRes, workspaceRes] = await Promise.all([
                fetch('/api/devices', { credentials: 'include' }),
                fetch('/api/workspaces/me', { credentials: 'include' })
            ]);
            
            const devicesData = await devicesRes.json();
            if (devicesRes.ok) {
                setDevices(Array.isArray(devicesData) ? devicesData : []);
            } else {
                throw new Error(devicesData.message || 'Gagal memuat perangkat.');
            }

            const workspaceData = await workspaceRes.json();
            if (workspaceRes.ok) {
                setActiveDeviceId(workspaceData.active_device_id);
            } else {
                setActiveDeviceId(null);
            }
        } catch (error) {
            console.error("Gagal memuat data perangkat:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingDevice(null);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleAdd = () => {
        setEditingDevice(null);
        setIsModalOpen(true);
    };

    const handleEdit = (device) => {
        setEditingDevice(device);
        setIsModalOpen(true);
    };

    const handleDelete = async (deviceId) => {
        if (!window.confirm('Anda yakin ingin menghapus perangkat ini?')) return;
        try {
            const response = await fetch(`/api/devices/${deviceId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal menghapus perangkat');
            }
            alert('Perangkat berhasil dihapus.');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleSetActive = async (deviceId) => {
        try {
            const response = await fetch('/api/workspaces/set-active-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ deviceId })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal mengubah perangkat aktif');
            }
            alert('Perangkat aktif berhasil diubah. Monitoring akan dimulai ulang.');
            // Panggil fungsi restart dari context
            restartMonitoring();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manajemen Perangkat</h2>
                    <button onClick={handleAdd} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <Plus size={16} />
                        <span>Tambah</span>
                    </button>
                </div>
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center p-4">
                            <Loader2 className="animate-spin text-gray-500" />
                        </div>
                    ) : devices.length > 0 ? (
                        devices.map(device => (
                            <div key={device.id} className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <Server className="text-gray-500" />
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800 dark:text-white">{device.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{device.user}@{device.host}:{device.port}</p>
                                </div>
                                {device.id === activeDeviceId ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <CheckCircle size={14} /> Aktif
                                    </span>
                                ) : (
                                    <button onClick={() => handleSetActive(device.id)} className="text-xs px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                        Jadikan Aktif
                                    </button>
                                )}
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(device)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Edit Perangkat"><Edit size={16} className="text-gray-500 hover:text-blue-500" /></button>
                                    <button onClick={() => handleDelete(device.id)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Hapus Perangkat"><Trash2 size={16} className="text-gray-500 hover:text-red-500" /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-gray-500 p-4">Belum ada perangkat. Silakan tambahkan satu.</p>
                    )}
                </div>
            </div>
            <DeviceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                deviceToEdit={editingDevice}
            />
        </>
    );
};

export default DeviceManagementCard;