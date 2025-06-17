import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MapDisplay from '../components/location/MapDisplay';
import AssetList from '../components/location/AssetList';
import AddAssetModal from '../components/location/AddAssetModal';
import AssetDetailModal from '../components/location/AssetDetailModal';
import EditAssetModal from '../components/location/EditAssetModal';
import ManageConnectionsModal from '../components/location/ManageConnectionsModal';
import ImportKmlModal from '../components/location/ImportKmlModal';
import { Plus, Upload } from 'lucide-react';

const naturalSort = (a, b) => {
    const re = /(\d+)/g;
    const aParts = a.name.split(re);
    const bParts = b.name.split(re);
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const partA = aParts[i];
        const partB = bParts[i];
        if (i % 2 === 1) {
            const numA = parseInt(partA, 10);
            const numB = parseInt(partB, 10);
            if (numA !== numB) return numA - numB;
        } else {
            if (partA !== partB) return partA.localeCompare(partB);
        }
    }
    return aParts.length - bParts.length;
};

export default function LocationPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [viewingAsset, setViewingAsset] = useState(null);
    const [editingAsset, setEditingAsset] = useState(null);
    const [managingAsset, setManagingAsset] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [assets, setAssets] = useState([]);
    const [focusedPosition, setFocusedPosition] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState(null);

    const fetchAssets = useCallback(async () => {
        try {
            const response = await fetch('/api/assets', { credentials: 'include' });
            if (!response.ok) throw new Error('Gagal memuat aset');
            const data = await response.json();
            setAssets(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Gagal mengambil aset:", error); }
    }, []);

    useEffect(() => { fetchAssets(); }, [fetchAssets, refreshTrigger]);

    const sortedAssets = useMemo(() => {
        return [...assets].sort(naturalSort);
    }, [assets]);

    const handleSuccess = () => {
        setIsAddModalOpen(false);
        setEditingAsset(null);
        setManagingAsset(null);
        setIsImportModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleAssetSelect = (asset) => {
        setFocusedPosition([parseFloat(asset.latitude), parseFloat(asset.longitude)]);
        setViewingAsset(asset);
        setSelectedAssetId(asset.id);
    };

    const handleEditClick = (asset) => {
        setViewingAsset(null);
        setEditingAsset(asset);
    };
    
    const handleDeleteClick = async (assetId) => {
        if (!window.confirm('Anda yakin ingin menghapus aset ini secara permanen?')) return;
        try {
            const response = await fetch(`/api/assets/${assetId}`, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Gagal menghapus aset');
            }
            setViewingAsset(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleManageConnectionsClick = (asset) => {
        setViewingAsset(null);
        setManagingAsset(asset);
    };

    return (
        <div className="min-h-screen h-screen flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center flex-wrap gap-4 mb-4 p-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Peta Lokasi Aset</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-all text-sm"
                        title="Import KML"
                    >
                        <Upload size={18} /> Import KML
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all text-sm"
                        title="Tambah Aset Baru"
                    >
                        <Plus size={18} /> Tambah Aset
                    </button>
                </div>
            </div>
            <div className="flex-grow flex flex-col lg:grid lg:grid-cols-3 gap-6 min-h-0 p-6">
                <div className="lg:col-span-1 flex-1 min-h-0 flex flex-col">
                    <AssetList
                        assets={sortedAssets}
                        onAssetSelect={handleAssetSelect}
                        selectedAssetId={selectedAssetId}
                    />
                </div>
                <div className="lg:col-span-2 flex-1 min-h-0 rounded-xl overflow-hidden shadow-lg relative z-0 flex flex-col">
                    <MapDisplay
                        assets={sortedAssets}
                        focusedPosition={focusedPosition}
                        onMarkerClick={handleAssetSelect}
                    />
                </div>
            </div>
            <AddAssetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleSuccess}
            />
            <ImportKmlModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={handleSuccess}
            />
            <AssetDetailModal
                asset={viewingAsset}
                onClose={() => setViewingAsset(null)}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onManageConnections={handleManageConnectionsClick}
            />
            <EditAssetModal
                asset={editingAsset}
                isOpen={!!editingAsset}
                onClose={() => setEditingAsset(null)}
                onSuccess={handleSuccess}
            />
            <ManageConnectionsModal
                asset={managingAsset}
                isOpen={!!managingAsset}
                onClose={() => setManagingAsset(null)}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
