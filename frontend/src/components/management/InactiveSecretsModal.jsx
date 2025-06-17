import React, { useState, useEffect } from 'react';
import { X, UserX } from 'lucide-react';

const InactiveSecretsModal = ({ isOpen, onClose }) => {
    const [inactiveUsers, setInactiveUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/pppoe/inactive-secrets')
                .then(res => res.json())
                .then(data => {
                    setInactiveUsers(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Gagal memuat user tidak aktif:", err);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold flex items-center gap-2"><UserX /> Pengguna Tidak Aktif</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <ul className="space-y-2">
                            {inactiveUsers.length > 0 ? (
                                inactiveUsers.map(user => (
                                    <li key={user['.id']} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        {user.name}
                                    </li>
                                ))
                            ) : (
                                <p>Semua pengguna sedang aktif.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InactiveSecretsModal;