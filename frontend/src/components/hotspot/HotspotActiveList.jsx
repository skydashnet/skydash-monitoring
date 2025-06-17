import React from 'react';
import { useMikrotik } from '../../hooks/useMikrotik';
import { Wifi, ArrowDown, ArrowUp } from 'lucide-react';

// Helper untuk format kecepatan (bps -> Kbps/Mbps)
const formatSpeed = (bits) => {
    if (!+bits || bits < 0) return '0 Kbps';
    const k = 1000;
    const sizes = ['Bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bits) / Math.log(k));
    // MikroTik rate adalah dalam bits per second
    return `${parseFloat((bits / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Helper untuk format ukuran data (Bytes -> KB/MB)
const formatDataSize = (bytes) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const HotspotActiveList = () => {
    const { hotspotActive } = useMikrotik();

    return (
        <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg p-1 sm:p-2 mt-8">
             <div className="flex justify-between items-center p-4">
                 <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Wifi size={24} /> Pengguna Aktif ({hotspotActive.length})
                </h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-3 text-left">User</th>
                            <th className="p-3 text-left">Address</th>
                            <th className="p-3 text-left">Uptime</th>
                            <th className="p-3 text-left">Pemakaian Sesi</th>
                            <th className="p-3 text-left">Kecepatan Live (Up/Down)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hotspotActive.length > 0 ? hotspotActive.map(user => (
                            <tr key={user['.id']} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="p-3 font-medium">{user.user}</td>
                                <td className="p-3 font-mono">{user.address}</td>
                                <td className="p-3">{user.uptime}</td>
                                <td className="p-3 font-mono">{formatDataSize(user['bytes-in'])} / {formatDataSize(user['bytes-out'])}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 text-red-600 font-mono"><ArrowUp size={12}/> {formatSpeed(user.uploadSpeed)}</span>
                                        <span className="flex items-center gap-1 text-green-600 font-mono"><ArrowDown size={12}/> {formatSpeed(user.downloadSpeed)}</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center p-6 text-gray-500">Tidak ada pengguna yang aktif.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HotspotActiveList;