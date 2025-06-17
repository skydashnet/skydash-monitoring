import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { parseCoordinates } from '../../utils/coordinateParser';

const EditAssetModal = ({ asset, isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('ODP');
    const [coords, setCoords] = useState('');
    const [description, setDescription] = useState('');
    const [splitterCount, setSplitterCount] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (asset) {
            setName(asset.name);
            setType(asset.type);
            setCoords(`${asset.latitude}, ${asset.longitude}`);
            setDescription(asset.description || '');
            setSplitterCount(asset.splitter_count || '');
        }
    }, [asset]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const { latitude, longitude } = parseCoordinates(coords);
            const formData = {
                name, type, latitude, longitude, description,
                splitter_count: (type === 'ODP' || type === 'ODC') ? splitterCount || null : null
            };
            const response = await fetch(`/api/assets/${asset.id}`, { // Menggunakan ID aset
                method: 'PUT', // Menggunakan method PUT
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal memperbarui aset');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Edit Aset: {asset.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <input type="text" placeholder="Nama Aset (e.g., ODP-BTN-01)" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipe Aset</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700">
                                <option value="ODP">ODP</option>
                                <option value="ODC">ODC</option>
                                <option value="JoinBox">JoinBox</option>
                                <option value="Server">Server</option>
                            </select>
                        </div>
                        {(type === 'ODP' || type === 'ODC') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Jumlah Splitter</label>
                                <input type="number" placeholder="e.g., 8" value={splitterCount} onChange={e => setSplitterCount(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Koordinat (Latitude, Longitude)</label>
                        <input type="text" placeholder="e.g., -7.821, 112.013 atau 7°49'17 S..." value={coords} onChange={e => setCoords(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi (Opsional)</label>
                        <textarea rows="2" placeholder="Keterangan tambahan..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700"></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Batal</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">Simpan Aset</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAssetModal;