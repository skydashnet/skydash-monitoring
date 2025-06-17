import React from 'react';
import { Server, Box, GitBranch, Share2 } from 'lucide-react';

const getAssetIcon = (type) => {
    const props = { size: 20, className: 'text-white' };
    switch (type) {
        case 'ODC': return <Box {...props} />;
        case 'ODP': return <GitBranch {...props} />;
        case 'JoinBox': return <Share2 {...props} />;
        case 'Server': return <Server {...props} />;
        default: return <Box {...props} />;
    }
};

const getAssetBgColor = (type) => {
    const colors = {
        ODC: 'bg-amber-500', ODP: 'bg-emerald-500',
        JoinBox: 'bg-blue-500', Server: 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
};

const AssetList = ({ assets, onAssetSelect, selectedAssetId }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg h-full flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white flex-shrink-0">
            Daftar Aset ({assets.length})
        </h2>
        <div className="flex-grow overflow-y-auto p-2">
            <ul className="space-y-2">
                {assets.map(asset => (
                    <li key={asset.id}>
                        <button 
                            onClick={() => onAssetSelect(asset)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${selectedAssetId === asset.id ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getAssetBgColor(asset.type)}`}>
                                {getAssetIcon(asset.type)}
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold truncate">{asset.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{asset.type}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};

export default AssetList;