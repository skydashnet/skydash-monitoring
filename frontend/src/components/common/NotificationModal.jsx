import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, type, message }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm text-center p-6">
                {isSuccess ? (
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                ) : (
                    <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
                )}
                <h2 className={`mt-4 text-2xl font-bold ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isSuccess ? 'Berhasil!' : 'Terjadi Kesalahan'}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
                <button 
                    onClick={onClose}
                    className={`mt-6 w-full px-4 py-2 font-semibold text-white rounded-lg ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    Mengerti
                </button>
            </div>
        </div>
    );
};

export default NotificationModal;