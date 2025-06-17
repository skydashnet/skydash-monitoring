import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AddHotspotUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', password: '', profile: '', timeLimit: '' });
    const [profiles, setProfiles] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetch('/api/hotspot/profiles', { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setProfiles(data);
                        setFormData(prev => ({ ...prev, profile: data[0] }));
                    }
                })
                .catch(err => console.error("Gagal memuat profil hotspot:", err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/hotspot/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal menambah user');
            
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Tambah User Hotspot Baru</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Nama Pengguna" onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                        <input type="text" name="password" placeholder="Password" onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Profil Hotspot</label>
                        <select name="profile" value={formData.profile} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700">
                            {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Batas Waktu (Opsional)</label>
                        <input type="text" name="timeLimit" placeholder="e.g., 30d, 12h, 1h30m" value={formData.timeLimit} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Batal</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">Simpan User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHotspotUserModal;