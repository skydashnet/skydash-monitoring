import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Trash2, Loader2 } from 'lucide-react';

const IpPoolManagerModal = ({ isOpen, onClose }) => {
    const [pools, setPools] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [newPool, setNewPool] = useState({
        profile_name: '', ip_start: '', ip_end: '', gateway: ''
    });

    const fetchPoolsAndProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const [poolsRes, profilesRes] = await Promise.all([
                fetch('/api/ip-pools', { credentials: 'include' }),
                fetch('/api/pppoe/profiles', { credentials: 'include' })
            ]);
            const poolsData = await poolsRes.json();
            const profilesData = await profilesRes.json();
            if (!poolsRes.ok) throw new Error(poolsData.message || 'Gagal memuat IP Pools.');
            setPools(Array.isArray(poolsData) ? poolsData : []);
            if (!profilesRes.ok) throw new Error(profilesData.message || 'Gagal memuat Profil.');
            setProfiles(Array.isArray(profilesData) ? profilesData : []);
        } catch (err) {
            setError('Gagal memuat data.');
            console.error("Fetch Pool Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchPoolsAndProfiles();
            setNewPool({ profile_name: '', ip_start: '', ip_end: '', gateway: '' });
            setError('');
        }
    }, [isOpen, fetchPoolsAndProfiles]);
    const handleChange = (e) => {
        setNewPool({ ...newPool, [e.target.name]: e.target.value });
    };
    const handleAddPool = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/ip-pools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify(newPool)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            fetchPoolsAndProfiles(); 
            setNewPool({ profile_name: '', ip_start: '', ip_end: '', gateway: '' });
        } catch (err) {
            setError(err.message);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Manajer IP Pool</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="flex-grow p-4 space-y-2 overflow-y-auto min-h-0">
                    <h3 className="font-semibold mb-2">Aturan Aktif</h3>
                    {loading ? <p>Memuat...</p> : pools.length > 0 ? (
                        pools.map(pool => (
                            <div key={pool.id} className="text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                               <div>
                                   <p className="font-bold">{pool.profile_name}</p>
                                   <p className="text-xs font-mono">Range: {pool.ip_start} - {pool.ip_end}</p>
                                   <p className="text-xs font-mono">Gateway: {pool.gateway}</p>
                               </div>
                               <button className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 italic text-center py-4">Belum ada aturan IP Pool yang dibuat.</p>
                    )}
                </div>

                <form onSubmit={handleAddPool} className="flex-shrink-0 p-4 border-t dark:border-gray-700 space-y-4">
                    <h3 className="font-semibold">Tambah Aturan Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium">Profil PPPoE</label>
                            <select name="profile_name" value={newPool.profile_name} onChange={handleChange} className="w-full p-2 mt-1 rounded bg-gray-100 dark:bg-gray-700" required>
                                <option value="" disabled>-- Pilih Profil --</option>
                                {profiles.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Gateway (Local Address)</label>
                            <input type="text" name="gateway" placeholder="e.g., 10.10.10.1" value={newPool.gateway} onChange={handleChange} className="w-full p-2 mt-1 rounded bg-gray-100 dark:bg-gray-700" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium">IP Start</label>
                            <input type="text" name="ip_start" placeholder="e.g., 10.10.10.2" value={newPool.ip_start} onChange={handleChange} className="w-full p-2 mt-1 rounded bg-gray-100 dark:bg-gray-700" required />
                        </div>
                        <div>
                           <label className="text-xs font-medium">IP End</label>
                            <input type="text" name="ip_end" placeholder="e.g., 10.10.10.254" value={newPool.ip_end} onChange={handleChange} className="w-full p-2 mt-1 rounded bg-gray-100 dark:bg-gray-700" required />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end">
                        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                           <Save size={16} /> Simpan Aturan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IpPoolManagerModal;