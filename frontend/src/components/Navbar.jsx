import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Settings, Users, MapPin, SlidersHorizontal, Shield } from 'lucide-react';

const navItems = [
  { icon: <Home size={24} />, label: 'Home', to: '/' },
  { icon: <SlidersHorizontal size={24} />, label: 'Management', to: '/management' },
  { icon: <MapPin size={24} />, label: 'Location', to: '/location' },
  { icon: <Users size={24} />, label: 'Hotspot', to: '/hotspot' },
  { icon: <Shield size={24} />, label: 'ARP', to: '/arp' },
  { icon: <Settings size={24} />, label: 'Settings', to: '/settings' },
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-6 inset-x-0 flex justify-center z-50">
      <div className="flex items-center gap-x-6 sm:gap-x-8 px-6 sm:px-8 py-3 bg-white border border-blue-200 dark:border-transparent dark:bg-gradient-to-r dark:from-purple-600 dark:to-blue-500 rounded-full shadow-lg backdrop-blur-md dark:backdrop-blur-md transition-colors duration-300">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'text-green-600 dark:text-yellow-300'
                  : 'text-blue-700 dark:text-white/80 hover:text-green-600 dark:hover:text-white'
              }`
            }
          >
            <div className="transition-transform duration-300 group-hover:-translate-y-1">
              {item.icon}
            </div>
            <span className="absolute -bottom-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}