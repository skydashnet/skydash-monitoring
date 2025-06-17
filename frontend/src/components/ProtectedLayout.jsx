import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';

const ProtectedLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:bg-gradient-to-br dark:from-gray-900 dark:to-purple-950 text-gray-800 dark:text-white transition-colors duration-300">
      <Header />
      <main className="flex-1 overflow-y-auto pb-32">
        <Outlet />
      </main>
      <Navbar />
    </div>
  );
};

export default ProtectedLayout;