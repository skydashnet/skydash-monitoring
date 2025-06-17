import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import UpdateProfileCard from '../components/settings/UpdateProfileCard';
import UpdatePasswordCard from '../components/settings/UpdatePasswordCard';
import UpdateAvatarCard from '../components/settings/UpdateAvatarCard';
import ActiveSessionsCard from '../components/settings/ActiveSessionsCard';
import DeleteAccountCard from '../components/settings/DeleteAccountCard';
import UpdateWhatsappCard from '../components/settings/UpdateWhatsappCard';
import DeviceManagementCard from '../components/settings/DeviceManagementCard';

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, checkLoggedIn } = useAuth(); 

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('linked') === 'true') {
      const handleLinkSuccess = async () => {
        await checkLoggedIn();
        navigate('/settings', { replace: true });
      };
      handleLinkSuccess();
    }
  }, [location, navigate, checkLoggedIn]);
  if (!authUser) {
    return (
        <div className="p-8 text-center dark:text-white">
            Memuat data pengguna...
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        Pengaturan
      </h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-4">Profil & Tampilan</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6">
          <div className="lg:col-span-1">
            <UpdateAvatarCard />
          </div>
          <div className="lg:col-span-2">
            <UpdateProfileCard />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-4">Manajemen Perangkat MikroTik</h2>
        <DeviceManagementCard />
      </section>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-4">Keamanan & Akun</h2>
        <div className="space-y-6">
          <UpdateWhatsappCard />
          <UpdatePasswordCard />
          <ActiveSessionsCard />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Zona Berbahaya</h2>
        <DeleteAccountCard />
      </section>

    </div>
  );
};