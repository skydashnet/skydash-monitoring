import React, { useState, useEffect } from 'react';
import { X, MapPin, Tag, Info, GitBranch, Edit, Trash2, Link as LinkIcon, Users } from 'lucide-react';

const ConnectionItemIcon = ({ type }) => {
    const props = { size: 16, className: "text-gray-500 dark:text-gray-400 flex-shrink-0" };
    if (type === 'ODP') return <GitBranch {...props} />;
    if (type === 'secret') return <Users {...props} />;
    return null;
};

const AssetDetailModal = ({ asset, onClose, onEdit, onDelete, onManageConnections }) => {
    const [connections, setConnections] = useState([]);
    const [loadingConnections, setLoadingConnections] = useState(true);

    useEffect(() => {
        if (!asset) return;

        const canHaveConnections = asset.type === 'ODC' || asset.type === 'ODP';
        if (!canHaveConnections) {
            setConnections([]);
            setLoadingConnections(false);
            return;
        }

        const fetchConnections = async () => {
            setLoadingConnections(true);
            const url = asset.type === 'ODC' 
                ? `/api/assets/odc/${asset.id}/connected-odps` 
                : `/api/pppoe/odp/${asset.id}/connected-users`;
            
            try {
                const response = await fetch(url, { credentials: 'include' });
                const data = await response.json();
                if (response.ok) {
                    setConnections(data);
                } else {
                    throw new Error(data.message || 'Gagal memuat koneksi');
                }
            } catch (error) {
                console.error("Gagal memuat koneksi:", error);
                setConnections([]);
            } finally {
                setLoadingConnections(false);
            }
        };

        fetchConnections();
    }, [asset]);
    if (!asset) return null;

    const canHaveConnections = asset.type === 'ODC' || asset.type === 'ODP';
    const connectionType = asset.type === 'ODC' ? 'ODP' : 'secret';
    const connectionTitle = asset.type === 'ODC' ? 'ODP Terhubung' : 'Pengguna Terhubung';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={asset.name}>{asset.name}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Tag size={16} className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm">Tipe: <span className="font-semibold">{asset.type}</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm">Koordinat: <span className="font-mono text-xs">{`${parseFloat(asset.latitude).toFixed(5)}, ${parseFloat(asset.longitude).toFixed(5)}`}</span></span>
                        </div>
                        {asset.splitter_count && (asset.type === 'ODP' || asset.type === 'ODC') && (
                            <div className="flex items-center gap-3">
                                <GitBranch size={16} className="text-gray-500 flex-shrink-0" />
                                <span className="text-sm">Jumlah Splitter: <span className="font-semibold">1 x {asset.splitter_count}</span></span>
                            </div>
                        )}
                        {asset.description && (
                            <div className="flex items-start gap-3">
                                <Info size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm italic text-gray-600 dark:text-gray-400">{asset.description}</p>
                            </div>
                        )}
                    </div>
                    {canHaveConnections && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-300">
                                {connectionTitle} ({connections.length})
                            </h3>
                            {loadingConnections ? (
                                <p className="text-xs text-gray-500">Memuat koneksi...</p>
                            ) : (
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {connections.length > 0 ? (
                                        connections.map(conn => (
                                            <li key={conn.id || conn['.id']} className="flex items-center gap-2 text-sm p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                                <ConnectionItemIcon type={connectionType} />
                                                <span>{conn.name}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Belum ada koneksi.</p>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => onDelete(asset.id)} className="p-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900" title="Hapus Aset"><Trash2 size={16} /></button>
                        <button onClick={() => onEdit(asset)} className="p-2 text-sm rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-400 dark:hover:bg-yellow-900" title="Edit Aset"><Edit size={16} /></button>
                        {canHaveConnections && (
                            <button onClick={() => onManageConnections(asset)} className="p-2 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900" title="Kelola Koneksi"><LinkIcon size={16} /></button>
                        )}
                    </div>
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailModal;