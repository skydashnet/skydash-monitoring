import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useMikrotik } from '../hooks/useMikrotik';
import { useTheme } from '../context/ThemeProvider';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function EtherChart({ etherId, className = '' }) {
  const { traffic } = useMikrotik();
  const { theme } = useTheme();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: `Upload (Mbps)`,
        data: [],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
        pointStyle: false,
      },
      {
        label: `Download (Mbps)`,
        data: [],
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
        pointStyle: false,
      }
    ],
  });

  const options = useMemo(() => {
    const textColor = theme === 'light' ? '#1f2937' : '#ddd';
    const gridColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
            position: 'top', 
            labels: { 
                color: textColor
            } 
        },
        title: { display: false },
      },
      scales: {
        x: { 
            ticks: { color: textColor },
            grid: { color: gridColor }
        },
        y: { 
            beginAtZero: true, 
            ticks: { color: textColor },
            grid: { color: gridColor },
            title: { display: true, text: 'Mbps', color: textColor }
        },
      },
    };
  }, [theme]);


  useEffect(() => {
    const currentTraffic = traffic[etherId];
    if (currentTraffic) {
      const txBps = parseFloat(currentTraffic['tx-bits-per-second']) || 0;
      const rxBps = parseFloat(currentTraffic['rx-bits-per-second']) || 0;
      
      const txMbps = (txBps / 1000000).toFixed(2);
      const rxMbps = (rxBps / 1000000).toFixed(2);

      setChartData(prevData => {
        const newLabels = [...prevData.labels.slice(-9), new Date().toLocaleTimeString()];
        const newTxData = [...prevData.datasets[0].data.slice(-9), txMbps];
        const newRxData = [...prevData.datasets[1].data.slice(-9), rxMbps];
        return {
          labels: newLabels,
          datasets: [
            { ...prevData.datasets[0], data: newTxData },
            { ...prevData.datasets[1], data: newRxData }
          ]
        };
      });
    }
  }, [traffic, etherId]);
  
  return (
    <div className={`bg-white dark:bg-white/10 dark:backdrop-blur-sm border border-blue-200 dark:border-white/20 p-4 rounded-xl shadow-md hover:shadow-lg focus:shadow-lg transition-all duration-300 h-80 flex flex-col ${className}`}>
      <h3 className="text-sm font-semibold mb-2 flex-shrink-0 text-green-700 dark:text-white">{etherId.toUpperCase()}</h3>
      
      <div className="relative flex-grow">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}