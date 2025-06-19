import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { X, KeyRound, Loader2 } from 'lucide-react';

const LoginOtpModal = ({ isOpen, onClose, userId, whatsappNumber }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAuthUser } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/verify-login-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify({ userId, otp })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setAuthUser(data.user);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm text-center p-6">
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-1 -mt-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <KeyRound className="mx-auto h-12 w-12 text-blue-500" />
                <h2 className="text-2xl font-bold mt-4">Verifikasi Login</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Kami telah mengirimkan kode OTP ke nomor WhatsApp Anda yang terdaftar.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input 
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="______"
                        maxLength="6"
                        className="w-full p-4 text-center text-3xl tracking-[1rem] font-mono rounded-lg bg-gray-100 dark:bg-gray-700"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verifikasi & Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginOtpModal;