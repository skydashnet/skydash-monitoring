import React from 'react';
import DeviceInfo from './DeviceInfo';

export default function Sidebar() {
  return (
    <aside className="w-full lg:w-80 lg:flex-shrink-0 bg-white dark:bg-white/10 dark:backdrop-blur-sm border-l border-blue-200 dark:border-white/20 rounded-xl shadow-md transition-colors duration-300">
      <div className="p-6">
        <DeviceInfo />
      </div>
    </aside>
  );
}