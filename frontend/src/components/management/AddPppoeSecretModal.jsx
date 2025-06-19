import React, { useState, useEffect, useCallback } from 'react';
import { X, Zap } from 'lucide-react';

const AddPppoeSecretModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', password: '', profile: '', service: 'pppoe', localAddress: '', remoteAddress: '' });
    const [profiles, setProfiles] = useState([]);
    const [isAutoIp, setIsAutoIp] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetch('/api/pppoe/profiles')
                .then(res => {
                    if (!res.ok) throw new Error('Gagal memuat profil dari server');
                    return res.json();
                })
                .then(setProfiles)
                .catch(err => {
                    console.error("Gagal mengambil profil:", err);
                    setError(err.message);
                });
        }
    }, [isOpen]);

    const getNextIpForProfile = useCallback(async (profileName) => {
    if (!profileName) return;
    try {
        const response = await fetch(`/api/pppoe/next-ip?profile=${encodeURIComponent(profileName)}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setFormData(prev => ({ ...prev, localAddress: data.localAddress, remoteAddress: data.remoteAddress }));
    } catch (error) {
        console.error("Gagal mendapatkan IP otomatis:", error);
        alert(`Error saat alokasi IP: ${error.message}`);
    }
    }, []);

    useEffect(() => {
        if (isOpen && isAutoIp && formData.profile) {
            getNextIpForProfile(formData.profile);
        }
    }, [isOpen, isAutoIp, formData.profile, getNextIpForProfile]);


    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/pppoe/secrets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Tambah Secret PPPoE</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Nama Pengguna" onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <input type="password" name="password" placeholder="Password" onChange={handleChange} autoComplete="new-password" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Profil</label>
                        <select name="profile" value={formData.profile} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="" disabled>-- Pilih Profil --</option>
                            {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isAutoIp} onChange={() => setIsAutoIp(!isAutoIp)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium">Alokasikan IP Otomatis</span>
                            <Zap size={14} className="text-yellow-500" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="localAddress" placeholder="Local Address" value={formData.localAddress} onChange={handleChange} disabled={isAutoIp} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                        <input type="text" name="remoteAddress" placeholder="Remote Address" value={formData.remoteAddress} onChange={handleChange} disabled={isAutoIp} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Batal</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Simpan Secret</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPppoeSecretModal;