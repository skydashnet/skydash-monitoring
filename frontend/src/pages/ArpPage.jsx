import React, { useState, useEffect } from 'react';
import { Loader2, ShieldX } from 'lucide-react';

const ArpPage = () => {
    const [arpTable, setArpTable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArpTable = async () => {
            try {
                const response = await fetch('/api/network/arp', { credentials: 'include' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Gagal memuat ARP table');
                }
                const data = await response.json();
                setArpTable(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArpTable();
    }, []);

    const getStatusChip = (entry) => {
        if (entry.invalid === 'true') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Invalid</span>;
        }
        if (entry.dynamic === 'true') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300">Dynamic</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">Static</span>;
    };

    if (loading) {
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Memuat ARP table...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center gap-4">
                <ShieldX size={48} />
                <h2 className="text-xl font-bold">Gagal Memuat Data</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">ARP Table</h1>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-900/50 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">MAC Address</th>
                                <th className="p-4">Interface</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arpTable.map((entry) => (
                                <tr key={entry['.id']} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-4 font-mono">{entry.address}</td>
                                    <td className="p-4 font-mono">{entry['mac-address']}</td>
                                    <td className="p-4">{entry.interface}</td>
                                    <td className="p-4">{getStatusChip(entry)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ArpPage;