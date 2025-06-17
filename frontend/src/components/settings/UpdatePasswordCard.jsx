import React, { useState } from 'react';

const UpdatePasswordCard = () => {
    const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (formData.newPassword !== formData.confirmNewPassword) {
            setMessageType('error');
            setMessage('Konfirmasi password baru tidak cocok.');
            return;
        }

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword: formData.oldPassword, newPassword: formData.newPassword })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            setMessageType('success');
            setMessage(data.message);
            setFormData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });

        } catch (error) {
            setMessageType('error');
            setMessage(`Error: ${error.message}`);
        }
    };
    
    const messageColor = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        info: 'text-gray-600 dark:text-gray-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 transition-colors duration-300 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Ganti Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
                <div className="flex-grow space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Password Lama</label>
                        <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password Baru</label>
                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
                        <input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                    <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">Ubah Password</button>
                    {message && <p className={`text-sm ${messageColor[messageType]}`}>{message}</p>}
                </div>
            </form>
        </div>
    );
};

export default UpdatePasswordCard;