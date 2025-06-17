import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';

const ManageConnectionsModal = ({ asset, isOpen, onClose, onSuccess }) => {
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isODC = asset?.type === 'ODC';
    const isODP = asset?.type === 'ODP';

    const fetchData = useCallback(async () => {
        if (!isOpen || !asset) return;

        let url = '';
        if (isODP) {
            url = '/api/pppoe/secrets/unassigned';
        } else if (isODC) {
            url = '/api/assets/unassigned?type=ODP';
        } else {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(url, { credentials: 'include' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal memuat data');
            setAvailableItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isOpen, asset, isODP, isODC]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!selectedItem) {
            setError('Silakan pilih item untuk dihubungkan.');
            return;
        }

        let url = '';
        let body = {};
        let method = 'POST';

        if (isODP) {
            // Temukan nama dari secret yang dipilih, karena backend butuh namanya
            const selectedSecret = availableItems.find(item => item['.id'] === selectedItem);
            
            // Panggil API yang benar
            url = `/api/pppoe/odp/${asset.id}/assign-user`;
            method = 'POST';
            body = { pppoe_secret_name: selectedSecret.name }; // Kirim NAMA, bukan ID

        } else if (isODC) {
            url = `/api/assets/${asset.id}/assign-odp`;
            body = { odpId: selectedItem };
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Kelola Koneksi untuk {asset.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                
                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-4">Fitur untuk menampilkan daftar koneksi yang sudah ada akan ditambahkan selanjutnya.</p>
                    
                    <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
                        <label className="block text-sm font-medium mb-1">
                            {isODP && "Hubungkan Pengguna PPPoE"}
                            {isODC && "Hubungkan ODP"}
                        </label>
                        <div className="flex gap-2">
                            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required>
                                <option value="" disabled>-- Pilih dari daftar --</option>
                                {loading ? (
                                    <option disabled>Memuat...</option>
                                ) : (
                                    availableItems.map(item => (
                                        <option key={item['.id'] || item.id} value={item['.id'] || item.id}>
                                            {item.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                                <Plus size={20}/>
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </form>
                </div>

                <div className="flex justify-end gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Tutup</button>
                </div>
            </div>
        </div>
    );
};

export default ManageConnectionsModal;