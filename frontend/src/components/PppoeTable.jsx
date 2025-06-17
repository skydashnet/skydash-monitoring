import React, { useState, useMemo } from 'react';
import { useMikrotik } from '../hooks/useMikrotik';
import { ArrowUp, ArrowDown } from 'lucide-react';

const formatSpeed = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bps';
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const formatDataSize = (bytes, decimals = 2) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

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
                    const strA = String(aVal).toLowerCase();
                    const strB = String(bVal).toLowerCase();
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

const PppoeTable = () => {
    const { traffic } = useMikrotik();

    const liveUsers = useMemo(() => {
        return Object.entries(traffic)
            .filter(([interfaceName]) => interfaceName.startsWith('<pppoe-'))
            .map(([interfaceName, trafficData]) => {
                const name = interfaceName.substring(7, interfaceName.length - 1);
                const uploadBytes = parseFloat(trafficData['tx-byte'] || 0);
                const downloadBytes = parseFloat(trafficData['rx-byte'] || 0);
                return {
                    name: name,
                    uploadSpeed: parseFloat(trafficData['tx-bits-per-second'] || 0),
                    downloadSpeed: parseFloat(trafficData['rx-bits-per-second'] || 0),
                    totalUsage: uploadBytes + downloadBytes,
                    remoteAddress: trafficData.address || 'Assigning IP...', 
                };
            });
    }, [traffic]);

    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(liveUsers, { key: 'name', direction: 'ascending' });

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

    if (sortedUsers.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-white">PPPoE Active Users (0)</h2>
                <div className="text-center p-8">Tidak ada pengguna PPPoE yang aktif atau sedang menunggu data...</div>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg p-1 sm:p-2 transition-colors duration-300">
            <h2 className="text-xl font-bold p-4 sm:p-4 text-blue-700 dark:text-white">PPPoE Active Users ({sortedUsers.length})</h2>

            <div className="hidden md:block max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="z-10">
                        <tr>
                            <SortableHeader sortKey="name">Nama</SortableHeader>
                            <SortableHeader sortKey="uploadSpeed">Upload</SortableHeader>
                            <SortableHeader sortKey="downloadSpeed">Download</SortableHeader>
                            <SortableHeader sortKey="totalUsage">Bandwidth Usage</SortableHeader>
                            <SortableHeader sortKey="remoteAddress">Remote Address</SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map(user => (
                            <tr key={user.name} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="p-3 font-medium">{user.name}</td>
                                <td className="p-3 text-red-500">{formatSpeed(user.uploadSpeed)}</td>
                                <td className="p-3 text-green-500">{formatSpeed(user.downloadSpeed)}</td>
                                <td className="p-3 font-semibold">{formatDataSize(user.totalUsage)}</td>
                                <td className="p-3 font-mono">{user.remoteAddress}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden space-y-4 max-h-[70vh] overflow-y-auto p-2">
                {sortedUsers.map(user => (
                     <div key={user.name} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 shadow">
                        <div className="flex justify-between items-start">
                           <div>
                                <p className="font-bold text-lg text-blue-700 dark:text-blue-300">{user.name}</p>
                                <p className="font-mono text-sm">{user.remoteAddress}</p>
                           </div>
                           <div className="text-right">
                                <p className="text-xs">Total Usage</p>
                                <p className="font-semibold text-sm">{formatDataSize(user.totalUsage)}</p>
                           </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 gap-2 text-center">
                            <div>
                                <p className="text-xs text-red-500">Upload</p>
                                <p className="font-semibold">{formatSpeed(user.uploadSpeed)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-green-500">Download</p>
                                <p className="font-semibold">{formatSpeed(user.downloadSpeed)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PppoeTable;