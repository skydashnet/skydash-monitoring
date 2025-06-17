import React, { useState, useEffect } from 'react';
import { X, Server, Save } from 'lucide-react';

const DeviceModal = ({ isOpen, onClose, onSuccess, deviceToEdit }) => {
    const isEditMode = !!deviceToEdit;
    const [formData, setFormData] = useState({
        name: '', host: '', user: '', password: '', port: '8728'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setFormData({
                    name: deviceToEdit.name,
                    host: deviceToEdit.host,
                    user: deviceToEdit.user,
                    password: '', // Password tidak ditampilkan untuk keamanan
                    port: deviceToEdit.port,
                });
            } else {
                setFormData({ name: '', host: '', user: '', password: '', port: '8728' });
            }
            setError('');
        }
    }, [isOpen, isEditMode, deviceToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const url = isEditMode ? `/api/devices/${deviceToEdit.id}` : '/api/devices';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{isEditMode ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <input type="text" name="name" placeholder="Nama Perangkat (e.g., Kantor Pusat)" value={formData.name} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" name="host" placeholder="Host / IP Address" value={formData.host} onChange={handleChange} className="md:col-span-2 w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                        <input type="text" name="port" placeholder="Port" value={formData.port} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="user" placeholder="Username API" value={formData.user} onChange={handleChange} autoComplete='off' className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" required />
                        <input type="password" name="password" placeholder={isEditMode ? 'Isi untuk mengubah password' : 'Password API'} onChange={handleChange} autoComplete='new-password' className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose}>Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">{isEditMode ? 'Simpan Perubahan' : 'Tambah Perangkat'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeviceModal;