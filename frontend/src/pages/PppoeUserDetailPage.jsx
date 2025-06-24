import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, WifiOff, MapPin, Server, Activity, AlertTriangle, Clock, TrendingUp, TrendingDown, Loader2, ShieldX } from 'lucide-react';

const InfoCard = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            {icon}
            {title}
        </h3>
        <div className="space-y-3 text-sm">{children}</div>
    </div>
);

const InfoRow = ({ label, value, valueClass = '' }) => (
    <div className="flex justify-between items-start">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-semibold text-right ${valueClass}`}>{value || '-'}</span>
    </div>
);

const SlaReport = ({ username }) => {
    const [slaData, setSlaData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSla = async () => {
            try {
                const response = await fetch(`/api/pppoe/secrets/${username}/sla`, { credentials: 'include' });
                if (!response.ok) throw new Error('Gagal memuat data SLA');
                const data = await response.json();
                setSlaData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSla();
    }, [username]);

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds} detik`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours} jam ${minutes} menit`;
    };
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    if (loading) return <p className="text-xs text-center">Menghitung SLA...</p>;
    if (!slaData) return <p className="text-xs text-center text-red-500">Data SLA tidak tersedia.</p>;

    const slaPercentage = parseFloat(slaData.sla_percentage);
    const progressBarColor = slaPercentage >= 99 ? 'bg-green-500' : slaPercentage >= 97 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-4">
            <div>
                <InfoRow label="Uptime 30 Hari" value={`${slaPercentage.toFixed(2)}%`} valueClass={progressBarColor.replace('bg-', 'text-')} />
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${slaPercentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 text-right mt-1">Total downtime: {formatDuration(slaData.total_downtime_seconds)}</p>
            </div>
            <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">5 Kejadian Downtime Terakhir</h4>
                <ul className="space-y-2">
                    {slaData.recent_events.length > 0 ? slaData.recent_events.map(event => (
                        <li key={event.start_time} className="text-xs p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                            <p>🔴 <span className="font-semibold">{formatDate(event.start_time)}</span></p>
                            <p className="ml-5">Durasi: {formatDuration(event.duration_seconds)}</p>
                        </li>
                    )) : (
                        <p className="text-xs text-gray-500 italic">Tidak ada catatan downtime dalam 30 hari terakhir. Mantap!</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

const PppoeUserDetailPage = () => {
    const { name } = useParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
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
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 flex flex-col items-center gap-4">
                <ShieldX size={48} />
                <h2 className="text-xl font-bold">Gagal Memuat Data</h2>
                <p>{error}</p>
            </div>
        );
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
                <InfoCard title="Detail Akun" icon={<User size={20} />}>
                    <InfoRow label="Service" value={secret.service} />
                    <InfoRow label="Profil PPPoE" value={secret.profile} />
                    <InfoRow label="Password" value="••••••••" valueClass="italic text-gray-400" />
                    <InfoRow label="Local Address" value={secret['local-address']} valueClass="font-mono" />
                    <InfoRow label="Remote Address" value={secret['remote-address']} valueClass="font-mono" />
                    <InfoRow label="Terakhir Logout" value={secret['last-logged-out']} />
                </InfoCard>

                <InfoCard title="Koneksi Fisik" icon={<MapPin size={20} />}>
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
                <div className="lg:col-span-2">
                    <InfoCard title="Laporan Service Level Agreement (SLA)" icon={<Activity size={20} />}>
                       <SlaReport username={name} />
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default PppoeUserDetailPage;