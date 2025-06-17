import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { useMikrotik } from '../hooks/useMikrotik';

ChartJS.register(ArcElement, Tooltip);

const formatUptime = (uptimeStr) => {
  if (!uptimeStr) return 'N/A';
  const parts = [];
  const weekMatch = uptimeStr.match(/(\d+)w/);
  if (weekMatch) {
    const val = parseInt(weekMatch[1], 10);
    parts.push(`${val} ${val > 1 ? 'weeks' : 'week'}`);
  }
  const dayMatch = uptimeStr.match(/(\d+)d/);
  if (dayMatch) {
    const val = parseInt(dayMatch[1], 10);
    parts.push(`${val} ${val > 1 ? 'days' : 'day'}`);
  }
  const hourMatch = uptimeStr.match(/(\d+)h/);
  if (hourMatch) {
    const val = parseInt(hourMatch[1], 10);
    parts.push(`${val} ${val > 1 ? 'hours' : 'hour'}`);
  }
  const minuteMatch = uptimeStr.match(/(\d+)m/);
  if (minuteMatch) {
    const val = parseInt(minuteMatch[1], 10);
    parts.push(`${val} ${val > 1 ? 'minutes' : 'minute'}`);
  }
  return parts.join(' ');
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  animation: { duration: 500 }
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-baseline gap-4 text-sm">
    <span className="text-blue-600 dark:text-white/60 flex-shrink-0">{label}</span>
    <span className="font-medium text-green-600 dark:text-white/90 text-right">{value}</span>
  </div>
);

const DoughnutChart = ({ data, percentage, label }) => (
  <div>
    <h4 className="text-md font-bold text-center mb-2 text-blue-700 dark:text-white/90">{label}</h4>
    <div className="relative h-40">
      <Doughnut data={data} options={chartOptions} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-blue-600 dark:text-white">{percentage}%</span>
        <span className="text-xs text-green-400 dark:text-white/70 mt-1">Used</span>
      </div>
    </div>
  </div>
);

export default function DeviceInfo() {
  const { resource } = useMikrotik();

  if (!resource) {
    return (
      <div className="text-center p-4">
        <p className="animate-pulse">Memuat informasi perangkat...</p>
      </div>
    );
  }

  const cpuLoad = parseInt(resource['cpu-load'], 10) || 0;
  const cpuData = {
    datasets: [{ data: [cpuLoad, 100 - cpuLoad], backgroundColor: ['#8b5cf6', '#a78bfa33'], borderColor: '#a78bfa00' }],
  };

  const totalMemory = parseInt(resource['total-memory'], 10) || 1;
  const freeMemory = parseInt(resource['free-memory'], 10) || 0;
  const usedMemory = totalMemory - freeMemory;
  const ramUsage = Math.round((usedMemory / totalMemory) * 100);
  const ramData = {
    datasets: [{ data: [ramUsage, 100 - ramUsage], backgroundColor: ['#3b82f6', '#3b82f633'], borderColor: '#3b82f600' }],
  };

  const formattedUptime = formatUptime(resource.uptime);

  return (
    <div className="space-y-8">
      <DoughnutChart data={cpuData} percentage={cpuLoad} label="CPU Load" />
      <DoughnutChart data={ramData} percentage={ramUsage} label="RAM Usage" />
      
      <div className="space-y-3 pt-4 border-t border-blue-200 dark:border-white/20">
        <InfoRow label="Board Name" value={resource['board-name']} />
        <InfoRow label="OS Version" value={resource.version} />
        <InfoRow label="Uptime" value={formattedUptime} />
      </div>
    </div>
  );
}