import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const GenerateCloneCodeModal = ({ isOpen, onClose }) => {
    const [codeData, setCodeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerateCode = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/clone/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal membuat kode');
            setCodeData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(codeData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 60000);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md text-center p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Bagikan Konfigurasi</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Buat kode unik untuk membagikan seluruh konfigurasi Anda (aset, koneksi, dll) ke pengguna lain. Kode ini hanya berlaku selama 10 menit.
                </p>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                {codeData ? (
                    <div className="mt-4 p-4 border-dashed border-2 border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-sm">Berikan kode ini ke teman Anda:</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <p className="text-3xl font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400">{codeData.code}</p>
                            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={handleGenerateCode} disabled={loading} className="mt-6 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {loading ? 'Membuat...' : 'Buat Kode Baru'}
                    </button>
                )}

                <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:underline">Tutup</button>
            </div>
        </div>
    );
};

export default GenerateCloneCodeModal;