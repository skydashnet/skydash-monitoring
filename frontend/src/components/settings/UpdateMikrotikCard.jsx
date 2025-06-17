import React, { useState, useEffect } from 'react';

const UpdateMikrotikCard = () => {
    const [config, setConfig] = useState({ host: '', user: '', password: '', name: '', port: '8728' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/devices/me');
                if (response.ok) {
                    const data = await response.json();
                    setConfig(prev => ({...prev, ...data, password: ''}));
                }
            } catch (error) {
                console.log("Belum ada konfigurasi perangkat untuk user ini.");
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (e) => {
        setConfig({...config, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await fetch('/api/devices/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessageType('success');
            setMessage(data.message);
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
         <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 transition-colors duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Konfigurasi MikroTik</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Informasi ini akan digunakan oleh aplikasi untuk terhubung dan mengambil data dari perangkat MikroTik Anda.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama Perangkat</label>
                        <input type="text" name="name" placeholder="e.g., Router Kantor" value={config.name} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Alamat IP / Host</label>
                        <input type="text" name="host" placeholder="e.g., 192.168.88.1" value={config.host} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">User MikroTik</label>
                        <input type="text" name="user" placeholder="e.g., admin" value={config.user} onChange={handleChange} autoComplete='off' className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Port API</label>
                        <input type="number" name="port" placeholder="Default: 8728" value={config.port} onChange={handleChange} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Password MikroTik</label>
                    <input type="password" name="password" placeholder="Isi hanya jika ingin mengubah password" value={config.password} onChange={handleChange} autoComplete="new-password" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="flex items-center gap-4">
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">Simpan Konfigurasi</button>
                    {message && <p className={`text-sm ${messageColor[messageType]}`}>{message}</p>}
                </div>
            </form>
        </div>
    );
};

export default UpdateMikrotikCard;