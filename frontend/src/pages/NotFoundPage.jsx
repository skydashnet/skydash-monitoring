import React from 'react';
import { Link } from 'react-router-dom';
import { SignalZero, Home } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
            <div className="relative flex items-center justify-center">
                <SignalZero className="w-24 h-24 text-red-500 animate-pulse" />
                <h1 className="absolute text-8xl font-extrabold text-gray-700 dark:text-gray-200" style={{ textShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    404
                </h1>
            </div>
            
            <h2 className="mt-8 text-3xl md:text-4xl font-bold">Halaman Tidak Ditemukan</h2>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                Sepertinya Anda mengambil jalur sinyal yang salah di jaringan.
            </p>

            <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
            >
                <Home size={18} />
                <span>Kembali ke Dashboard</span>
            </Link>
        </div>
    );
};

export default NotFoundPage;