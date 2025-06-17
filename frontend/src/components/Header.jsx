import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThemeSwitch } from './ThemeSwitch';
import { useAuth } from '../context/AuthProvider';
import { UserCircle, Settings, LogOut, Share2, Palette } from 'lucide-react';
import GenerateCloneCodeModal from './settings/GenerateCloneCodeModal';

export default function Header() {
  const { authUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <>
      <header className="w-full py-2 px-4 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 relative z-[1001]">
        <div className="flex-1">
        </div> 
        <div className="flex-1 text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-gray-800 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-purple-400 dark:to-blue-400">
              SkydashNET
            </h1>
          </Link>
          <p className="text-sm text-gray-500 dark:text-white/70 tracking-wide">
            Mikrotik Monitoring Tools
          </p>
        </div>
        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="hidden lg:block">
            <ThemeSwitch />
          </div>
          
          {authUser ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                <img 
                  src={authUser.profile_picture_url} 
                  alt={authUser.display_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-[1000] animate-fade-in-down">
                  <div className="p-3 border-b dark:border-gray-700">
                    <p className="font-semibold text-sm truncate" title={authUser.display_name}>{authUser.display_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{authUser.username}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings size={16} />
                      <span>Pengaturan Akun</span>
                    </Link>
                     <button onClick={() => { setIsCloneModalOpen(true); setIsDropdownOpen(false); }} className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Share2 size={16} />
                        <span>Bagikan Konfigurasi</span>
                    </button>
                    <div className="flex items-center justify-between px-3 py-2 lg:hidden">
                        <span className="flex items-center gap-3 text-sm">
                           <Palette size={16} />
                           <span>Ganti Tema</span>
                        </span>
                       <ThemeSwitch />
                    </div>

                    <div className="my-1 h-px bg-gray-200 dark:bg-gray-700 lg:hidden"></div>

                    <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <UserCircle size={32} className="text-gray-400" />
            </Link>
          )}
        </div>
      </header>
      <GenerateCloneCodeModal isOpen={isCloneModalOpen} onClose={() => setIsCloneModalOpen(false)} />
    </>
  );
}