import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, ArrowRight, Key } from 'lucide-react';

const ConfigPrompt = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCloneSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/clone/use-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify({ code })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal menggunakan kode');
            alert('Konfigurasi berhasil dijiplak! Aplikasi akan dimuat ulang.');
            window.location.reload();

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center p-8 h-full">
            <div className="max-w-md text-center space-y-10">
                <div>
                    <Settings className="mx-auto h-16 w-16 text-blue-500" strokeWidth={1} />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
                        Konfigurasi Diperlukan
                    </h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Anda belum menyimpan konfigurasi perangkat MikroTik. Silakan menuju halaman Pengaturan untuk menambahkan detail koneksi Anda.
                    </p>
                    <Link to="/settings" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white ...">
                        <span>Ke Halaman Pengaturan</span>
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="text-center text-gray-400">atau</div>
                <div>
                    <Key className="mx-auto h-12 w-12 text-green-500" strokeWidth={1} />
                     <h2 className="mt-4 text-xl font-bold text-gray-800 dark:text-white">
                        Punya Kode?
                    </h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Jika Anda memiliki kode dari teman, masukkan di bawah ini untuk menjiplak seluruh konfigurasinya.
                    </p>
                    <form onSubmit={handleCloneSubmit} className="mt-4 flex gap-2 justify-center">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Masukkan Kode"
                            className="p-2 w-40 text-center font-mono tracking-widest rounded-md bg-gray-100 dark:bg-gray-700"
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                            Gunakan
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default ConfigPrompt;