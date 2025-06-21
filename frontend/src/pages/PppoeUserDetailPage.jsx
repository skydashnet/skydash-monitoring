import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wifi, WifiOff, XCircle, CheckCircle, MapPin, Server } from 'lucide-react';

const InfoCard = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
        <div className="space-y-3 text-sm">{children}</div>
    </div>
);

const InfoRow = ({ label, value, valueClass = '' }) => (
    <div className="flex justify-between items-start">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-semibold text-right ${valueClass}`}>{value || '-'}</span>
    </div>
);

const PppoeUserDetailPage = () => {
    const { name } = useParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`/api/pppoe/secrets/${name}/details`, { credentials: 'include' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Gagal memuat data pengguna');
                }
                const data = await response.json();
                setUserData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [name]);

    if (loading) {
        return <div className="p-8 text-center">Memuat detail pengguna...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    const { secret, connection } = userData;
    const isDisabled = secret?.disabled === 'true';

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <Link to="/management" className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline mb-6">
                <ArrowLeft size={16} />
                Kembali ke Manajemen PPPoE
            </Link>

            <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-full ${isDisabled ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                    <User size={32} className={isDisabled ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{secret.name}</h1>
                    <p className={`font-semibold ${isDisabled ? 'text-red-500' : 'text-green-500'}`}>
                        {isDisabled ? 'Akun Dinonaktifkan' : 'Akun Aktif'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard title="Detail Akun">
                    <InfoRow label="Service" value={secret.service} />
                    <InfoRow label="Profil PPPoE" value={secret.profile} />
                    <InfoRow label="Password" value="••••••••" valueClass="italic text-gray-400" />
                    <InfoRow label="Local Address" value={secret['local-address']} valueClass="font-mono" />
                    <InfoRow label="Remote Address" value={secret['remote-address']} valueClass="font-mono" />
                    <InfoRow label="Terakhir Logout" value={secret['last-logged-out']} />
                </InfoCard>

                <InfoCard title="Status Koneksi">
                    {connection ? (
                        <>
                            <InfoRow label="Terhubung ke" value={connection.odp_name} valueClass="text-emerald-500" />
                            <InfoRow label="Tipe Aset" value={connection.odp_type} />
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <WifiOff className="mx-auto text-gray-400" size={32} />
                            <p className="mt-2 text-sm text-gray-500">Pengguna ini belum terhubung ke aset ODP manapun.</p>
                        </div>
                    )}
                </InfoCard>
            </div>
        </div>
    );
};

export default PppoeUserDetailPage;