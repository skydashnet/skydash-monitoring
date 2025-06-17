import React from 'react';
import { useTheme } from '../context/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitch = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 ${
        theme === 'light' ? 'bg-blue-400' : 'bg-purple-800'
      }`}
    >
      <span className="sr-only">Toggle theme</span>
      <Sun className={`absolute left-1.5 h-5 w-5 text-yellow-300 transition-opacity duration-300 ${
        theme === 'light' ? 'opacity-100' : 'opacity-0'
      }`} />
      <Moon className={`absolute right-1.5 h-5 w-5 text-yellow-300 transition-opacity duration-300 ${
        theme === 'dark' ? 'opacity-100' : 'opacity-0'
      }`} />
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
          theme === 'light' ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
};