import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMikrotik } from '../../hooks/useMikrotik';
import { Power, PowerOff, ArrowUp, ArrowDown, Search } from 'lucide-react';

const useSortableData = (items, config = null) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                } else {
                    const strA = String(aVal || "").toLowerCase();
                    const strB = String(bVal || "").toLowerCase();
                    if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};

const PppoeSecretsList = ({ refreshTrigger }) => {
    const [secrets, setSecrets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const { traffic } = useMikrotik();

    const fetchSecrets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/pppoe/secrets');
            const data = await response.json();
            setSecrets(data);
        } catch (error) {
            console.error("Gagal mengambil daftar secrets:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecrets();
    }, [refreshTrigger, fetchSecrets]);
    const combinedData = useMemo(() => {
        const activeUsersMap = new Map();
        Object.entries(traffic).forEach(([interfaceName, trafficData]) => {
            if (interfaceName.startsWith('<pppoe-')) {
                const name = interfaceName.substring(7, interfaceName.length - 1);
                activeUsersMap.set(name, trafficData);
            }
        });

        return secrets.map(secret => {
            const activeInfo = activeUsersMap.get(secret.name);
            return {
                ...secret,
                isActive: !!activeInfo,
                remoteAddress: activeInfo ? activeInfo.address : '-',
            };
        });
    }, [secrets, traffic]);

    const filteredSecrets = useMemo(() => {
        if (!filter) return combinedData;
        return combinedData.filter(secret => 
            secret.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [combinedData, filter]);

    const { items: sortedSecrets, requestSort, sortConfig } = useSortableData(filteredSecrets, { key: 'name', direction: 'ascending' });

    const SortableHeader = ({ children, sortKey }) => {
        const isSorted = sortConfig?.key === sortKey;
        return (
            <th onClick={() => requestSort(sortKey)} className="p-3 text-left cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors sticky top-0 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    {children}
                    {isSorted ? (sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null}
                </div>
            </th>
        );
    };

    if (loading) return <p className="text-center p-4">Memuat daftar secrets...</p>

    return (
        <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg p-1 sm:p-2 mt-8">
            <div className="flex justify-between items-center p-4">
                 <h2 className="text-xl font-bold text-blue-700 dark:text-white">Daftar Semua Secret ({sortedSecrets.length})</h2>
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Cari nama..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full sm:w-64 p-2 pl-8 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                 </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-3 text-left">Status</th>
                            <SortableHeader sortKey="name">Nama</SortableHeader>
                            <th className="p-3 text-left">Service</th>
                            <th className="p-3 text-left">Profil</th>
                            <SortableHeader sortKey="remoteAddress">Remote Address</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSecrets.map(secret => (
                            <tr key={secret['.id']} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="p-3">
                                    {secret.disabled === 'true' ? (
                                        <span className="flex items-center gap-2 text-gray-400"><PowerOff size={14} /> Disabled</span>
                                    ) : (
                                        secret.isActive ? 
                                        <span className="flex items-center gap-2 text-green-500"><Power size={14} /> Active</span> :
                                        <span className="flex items-center gap-2 text-red-500"><PowerOff size={14} /> Inactive</span>
                                    )}
                                </td>
                                <td className="p-3 font-medium">{secret.name}</td>
                                <td className="p-3">{secret.service}</td>
                                <td className="p-3">{secret.profile}</td>
                                <td className="p-3 font-mono">{secret.remoteAddress}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PppoeSecretsList;