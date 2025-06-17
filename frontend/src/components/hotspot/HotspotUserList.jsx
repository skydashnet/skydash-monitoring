import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMikrotik } from '../../hooks/useMikrotik'; // Impor hook untuk data live
import { Search, Edit, Trash2, ArrowDown, ArrowUp } from 'lucide-react';

// Helper untuk format ukuran data (B, KB, MB, GB)
const formatDataSize = (bytes) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const HotspotUserList = ({ refreshTrigger }) => {
    const [allUsers, setAllUsers] = useState([]); // Daftar semua user dari API
    const { hotspotActive } = useMikrotik(); // Data user aktif dari WebSocket
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // Fungsi untuk mengambil daftar semua user terdaftar
    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hotspot/users', { credentials: 'include' });
            const data = await response.json();
            setAllUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Gagal mengambil daftar user hotspot:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [refreshTrigger, fetchAllUsers]);

    // Gabungkan data statis dengan data live menggunakan useMemo
    const enrichedUsers = useMemo(() => {
        // Buat "peta" dari user aktif untuk pencarian cepat
        const activeUsersMap = new Map(hotspotActive.map(user => [user.user, user]));
        
        // "Perkaya" setiap user di daftar utama dengan data live jika mereka aktif
        return allUsers.map(user => {
            const activeInfo = activeUsersMap.get(user.name);
            return {
                ...user,
                is_active: !!activeInfo,
                session_bytes_in: activeInfo ? activeInfo['bytes-in'] : 0,
                session_bytes_out: activeInfo ? activeInfo['bytes-out'] : 0,
            };
        });
    }, [allUsers, hotspotActive]); // Dijalankan ulang setiap kali daftar user atau data aktif berubah

    const filteredUsers = useMemo(() => {
        if (!filter) return enrichedUsers;
        return enrichedUsers.filter(user => 
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [enrichedUsers, filter]);

    if (loading) return <p className="text-center p-4">Memuat daftar user...</p>;

    return (
        <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg p-1 sm:p-2 mt-8">
             <div className="flex justify-between items-center p-4">
                 <h2 className="text-xl font-bold text-blue-700 dark:text-white">Daftar User Hotspot ({filteredUsers.length})</h2>
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Cari user..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full sm:w-64 p-2 pl-8 rounded-lg bg-gray-100 dark:bg-gray-700"
                    />
                    <Search size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                 </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-3 text-left">Nama</th>
                            <th className="p-3 text-left">Profil</th>
                            {/* Kolom Total Penggunaan Data */}
                            <th className="p-3 text-left">Total Usage</th>
                            {/* Kolom Baru: Traffic Sesi Ini */}
                            <th className="p-3 text-left">Traffic Sesi Ini (Down/Up)</th>
                            <th className="p-3 text-left">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user['.id']} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="p-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                        {user.name}
                                    </div>
                                </td>
                                <td className="p-3">{user.profile}</td>
                                <td className="p-3 font-mono">{formatDataSize(parseFloat(user['bytes-in']) + parseFloat(user['bytes-out']))}</td>
                                <td className="p-3">
                                    {/* Tampilkan traffic live hanya jika user aktif */}
                                    {user.is_active ? (
                                        <div className="flex items-center gap-3 font-mono text-xs">
                                            <span className="flex items-center gap-1 text-green-600"><ArrowDown size={12}/> {formatDataSize(user.session_bytes_in)}</span>
                                            <span className="flex items-center gap-1 text-red-600"><ArrowUp size={12}/> {formatDataSize(user.session_bytes_out)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-md text-yellow-600"><Edit size={14} /></button>
                                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HotspotUserList;