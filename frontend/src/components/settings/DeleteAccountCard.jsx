import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { ShieldAlert } from 'lucide-react';

const DeleteAccountCard = () => {
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const { logout } = useAuth();

    const handleDelete = async () => {
        setMessage('');
        const confirmation = prompt("Ini adalah aksi yang tidak bisa dibatalkan. Semua data Anda (konfigurasi, aset, sesi, dll) akan dihapus permanen. Untuk melanjutkan, ketik password Anda:");

        if (confirmation === null) {
            return;
        }

        try {
            const response = await fetch('/api/user/me', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify({ password: confirmation })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            alert(data.message);
            logout();

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
        <div className="rounded-xl shadow-lg p-6 mt-6 border-2 border-red-500/50 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert />
                Zona Berbahaya
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
                Aksi di bawah ini bersifat permanen dan tidak dapat diurungkan.
            </p>
            <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
                Hapus Akun Saya Secara Permanen
            </button>
            {message && <p className={`text-sm mt-2 font-medium ${messageColor[messageType]}`}>{message}</p>}
        </div>
    );
};

export default DeleteAccountCard;