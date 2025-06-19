import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { LogIn, User, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ThemeSwitch } from '../components/ThemeSwitch';
import SkydashLogo from '../components/SkydashLogo';
import LoginOtpModal from '../components/auth/LoginOtpModal';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [loginPayload, setLoginPayload] = useState({ userId: null, whatsappNumber: '' });
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal login');
            setLoginPayload({ userId: data.userId, whatsappNumber: data.whatsappNumber });
            setIsOtpModalOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full flex flex-row bg-white dark:bg-gray-900">
                <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-12">
                    <SkydashLogo variant="neon" size="large" />
                </div>
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                    <div className="absolute top-6 right-6">
                        <ThemeSwitch />
                    </div>
                    <div className="w-full max-w-sm">
                        <div className="text-center lg:text-left mb-8">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">Selamat Datang Kembali</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Silakan masuk ke akun Anda.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="w-full p-3 pl-10 pr-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><Eye size={20} /></button>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin"/> : <LogIn size={20} />}
                                <span>{loading ? 'Meminta OTP...' : 'Masuk'}</span>
                            </button>
                        </form>
                        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                            Belum punya akun? <Link to="/register" className="font-semibold text-blue-500 hover:underline">Daftar di sini</Link>
                        </p>
                    </div>
                </div>
            </div>
            <LoginOtpModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} userId={loginPayload.userId} whatsappNumber={loginPayload.whatsappNumber} />
        </>
    );
};

export default LoginPage;