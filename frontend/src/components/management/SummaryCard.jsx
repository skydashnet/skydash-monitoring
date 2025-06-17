import React from 'react';

const SummaryCard = ({ title, count, icon, colorClass }) => {
  return (
    <div className={`p-6 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-1 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-lg font-medium text-white/80">{title}</p>
          <p className="text-4xl font-bold text-white">{count}</p>
        </div>
        <div className="p-3 bg-black/20 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;