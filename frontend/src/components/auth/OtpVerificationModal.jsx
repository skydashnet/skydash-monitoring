import React, { useState, useEffect } from 'react';
import { X, KeyRound, Loader2 } from 'lucide-react';

const OtpVerificationModal = ({ isOpen, onClose, onSuccess, whatsappNumber, onResend }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    useEffect(() => {
        if(isOpen) {
            setOtp('');
            setError('');
            setLoading(false);
            setCooldown(60);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/register/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', credentials: 'include' },
                body: JSON.stringify({ whatsapp: whatsappNumber, otp })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal verifikasi OTP');
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleResendClick = () => {
        if (cooldown === 0) {
            onResend();
            setCooldown(60);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm text-center p-6">
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-1 -mt-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <KeyRound className="mx-auto h-12 w-12 text-blue-500" />
                <h2 className="text-2xl font-bold mt-4">Verifikasi Nomor Anda</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Kami telah mengirimkan kode OTP 6 digit ke nomor <strong>{whatsappNumber}</strong>. Silakan masukkan di bawah.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input 
                        type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                        placeholder="______" maxLength="6"
                        className="w-full p-4 text-center text-3xl tracking-[1rem] font-mono rounded-lg bg-gray-100 dark:bg-gray-700"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                        {loading ? <Loader2 className="mx-auto animate-spin" /> : 'Verifikasi & Daftar'}
                    </button>
                </form>
                <div className="mt-4 text-xs text-gray-400">
                    Tidak menerima kode?{' '}
                    <button 
                        onClick={handleResendClick} 
                        disabled={cooldown > 0}
                        className="font-semibold text-blue-500 hover:underline disabled:text-gray-500 disabled:no-underline"
                    >
                        {cooldown > 0 ? `Kirim ulang dalam (${cooldown}s)` : 'Kirim ulang'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtpVerificationModal;