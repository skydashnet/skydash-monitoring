import React from 'react';
import { ShieldOff } from 'lucide-react';

const FeatureNotAvailable = ({ featureName }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-100 dark:bg-gray-800/50 rounded-xl mt-8">
            <ShieldOff className="w-16 h-16 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Fitur Tidak Tersedia</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
                Fitur management **{featureName}** tidak terdeteksi pada perangkat MikroTik yang sedang aktif.
            </p>
        </div>
    );
};

export default FeatureNotAvailable;