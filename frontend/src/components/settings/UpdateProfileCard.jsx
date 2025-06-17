import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';

const UpdateProfileCard = () => {
    const { authUser, setAuthUser } = useAuth();
    const [displayName, setDisplayName] = useState(authUser.display_name);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await fetch('/api/user/details', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage(data.message);
            setAuthUser(data.user);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">Profil Pengguna</h2>
            <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
                <div className="flex-grow">
                    <label className="block text-sm font-medium mb-1">Nama Display</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="off" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">Simpan Perubahan</button>
                    {message && <p className="text-sm mt-2 inline-block ml-4">{message}</p>}
                </div>
            </form>
        </div>
    );
};

export default UpdateProfileCard;