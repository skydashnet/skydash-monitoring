import React from 'react';
import { useAuth } from '../context/AuthProvider';
import MainContent from '../components/MainContent';
import Sidebar from '../components/Sidebar';
import PppoeTable from '../components/PppoeTable';
import ConfigPrompt from '../components/common/ConfigPrompt';
import { useMikrotik } from '../context/MikrotikProvider';

const HomePage = () => {
  const { authUser } = useAuth();
  const { isConfigured, configLoading } = useMikrotik();

  if (configLoading) {
    return <div className="p-8 text-center">Memeriksa konfigurasi...</div>;
  }

  if (!isConfigured) {
    return <ConfigPrompt />;
  }

  return (
    <div className="p-4 space-y-4">
      
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
          Selamat Datang, {authUser?.display_name || 'Pengguna'}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Ini adalah ringkasan aktivitas jaringan Anda saat ini.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <MainContent />
        <Sidebar />
      </div>

      <PppoeTable />
    </div>
  );
};

export default HomePage;