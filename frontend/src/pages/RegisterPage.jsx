import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, KeyRound, BadgeInfo, Eye, EyeOff, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { ThemeSwitch } from '../components/ThemeSwitch';
import SkydashLogo from '../components/SkydashLogo';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        password: '',
        whatsapp: '',
        email: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/register/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal meminta OTP');
            
            setIsOtpModalOpen(true);
            setSuccess(data.message);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationSuccess = () => {
        setIsOtpModalOpen(false);
        setSuccess('Registrasi final berhasil! Mengarahkan ke halaman login...');
        setTimeout(() => { navigate('/login'); }, 2000);
    };

    return (
        <>
            <div className="min-h-screen w-full bg-white dark:bg-gray-900 lg:grid lg:grid-cols-2">
                <div className="hidden lg:flex items-center justify-center p-8 bg-gradient-to-br from-green-500 to-teal-500">
                    <SkydashLogo variant="matrix" size="large" />
                </div>
                
                <div className="relative flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute top-6 right-6">
                        <ThemeSwitch />
                    </div>

                    <div className="w-full max-w-sm">
                        <div className="text-left mb-8">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">Buat Akun Baru</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Selamat datang! Silakan isi data Anda.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" name="username" placeholder="Username (untuk login)" value={formData.username} onChange={handleChange} autoComplete="off" className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                            </div>
                            <div className="relative">
                                <BadgeInfo className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" name="displayName" placeholder="Nama Display" value={formData.displayName} onChange={handleChange} autoComplete="off" className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                            </div>
                             <div className="relative">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" name="whatsapp" placeholder="Nomor WhatsApp (08... / 628...)" value={formData.whatsapp} onChange={handleChange} autoComplete="off" className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent dark:text-white" required />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="email" name="email" placeholder="Alamat Email" value={formData.email} onChange={handleChange} autoComplete="off" className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent dark:text-white" required />
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleChange} autoComplete="new-password" className="w-full p-3 pl-10 pr-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent dark:text-white" required />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {success && <p className="text-green-500 text-sm text-center">{success}</p>}

                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50">
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                                <span>{loading ? 'Mengirim OTP...' : 'Daftar & Dapatkan Kode'}</span>
                            </button>
                        </form>
                        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                            Sudah punya akun? <Link to="/login" className="font-semibold text-blue-500 hover:underline">Login di sini</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;