import React, { useMemo, useRef } from 'react';
import EtherChart from './EtherChart';
import { useMikrotik } from '../hooks/useMikrotik';

const INACTIVE_THRESHOLD_MS = 5000;

export default function MainContent() {
  const { traffic } = useMikrotik();
  const lastActiveTime = useRef({});

  const etherInterfaces = useMemo(() => {
    const activeInterfaces = new Set();
    const now = Date.now();

    for (const ifaceName in traffic) {
      if (ifaceName.startsWith('<pppoe-')) continue;

      const ifaceTraffic = traffic[ifaceName];
      const hasTraffic = ifaceTraffic && (
        parseFloat(ifaceTraffic['tx-bits-per-second']) > 0 || 
        parseFloat(ifaceTraffic['rx-bits-per-second']) > 0
      );

      if (hasTraffic) {
        lastActiveTime.current[ifaceName] = now;
        activeInterfaces.add(ifaceName);
      } else {
        const lastActive = lastActiveTime.current[ifaceName] || 0;
        if (now - lastActive < INACTIVE_THRESHOLD_MS) {
          activeInterfaces.add(ifaceName);
        }
      }
    }
    
    return Array.from(activeInterfaces).sort();
  }, [traffic]);

  const interfaceCount = etherInterfaces.length;
  if (interfaceCount === 0) {
    return (
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-xl p-10">
            <p className="text-center text-gray-500 dark:text-gray-400">Menunggu data traffic interface ethernet...</p>
        </div>
    );
  }
  if (interfaceCount === 1) {
    return (
        <div className="flex-grow flex justify-center items-start p-4">
            <div className="w-full max-w-2xl">
                <EtherChart key={etherInterfaces[0]} etherId={etherInterfaces[0]} />
            </div>
        </div>
    );
  }
  if (interfaceCount === 2) {
    return (
        <div className="flex-grow flex flex-col gap-4">
            <EtherChart key={etherInterfaces[0]} etherId={etherInterfaces[0]} />
            <EtherChart key={etherInterfaces[1]} etherId={etherInterfaces[1]} />
        </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-auto">
      {etherInterfaces.map((etherId, index) => {
        const isOddCount = interfaceCount % 2 !== 0;
        const isLastItem = index === interfaceCount - 1;
        return (
          <EtherChart
            key={etherId}
            etherId={etherId}
            className={isOddCount && isLastItem ? 'md:col-span-2' : ''}
          />
        );
      })}
    </div>
  );
}