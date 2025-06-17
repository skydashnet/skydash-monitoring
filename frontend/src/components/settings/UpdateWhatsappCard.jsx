import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { MessageSquare, KeyRound } from 'lucide-react';

const UpdateWhatsappCard = () => {
    const { authUser, setAuthUser } = useAuth();
    const [view, setView] = useState('input'); 
    const [whatsappNumber, setWhatsappNumber] = useState(authUser?.whatsapp_number || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch('/api/user/request-whatsapp-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify({ whatsappNumber })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage(data.message);
            setView('verify');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await fetch('/api/user/verify-whatsapp-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify({ otp })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage(data.message);
            setAuthUser(prev => ({ ...prev, whatsapp_number: whatsappNumber }));
            setTimeout(() => { setView('input'); setMessage(''); }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Nomor WhatsApp</h2>
            {view === 'input' && (
                <form onSubmit={handleRequestOtp}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Nomor ini digunakan untuk otentikasi 2 faktor (2FA) saat login.</p>
                    <div className="flex gap-2">
                        <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="e.g., 62812..." className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" />
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Mengirim...' : 'Update'}</button>
                    </div>
                </form>
            )}
            {view === 'verify' && (
                <form onSubmit={handleVerifyOtp}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{message}</p>
                    <div className="flex gap-2">
                        <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Masukkan OTP" className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700" />
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? 'Memeriksa...' : 'Verifikasi'}</button>
                    </div>
                </form>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {view === 'verify' && <button onClick={() => setView('input')} className="text-xs text-gray-400 hover:underline mt-4">Batal & Ganti Nomor</button>}
        </div>
    );
};

export default UpdateWhatsappCard;