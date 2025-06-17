import React, { useMemo, useRef, useEffect } from 'react';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-auto">
      {etherInterfaces.length > 0 ? (
        etherInterfaces.map((etherId, index) => {
          const isOddCount = etherInterfaces.length % 2 !== 0;
          const isLastItem = index === etherInterfaces.length - 1;

          return (
            <EtherChart
              key={etherId}
              etherId={etherId}
              className={isOddCount && isLastItem ? 'md:col-span-2' : ''}
            />
          );
        })
      ) : (
        <div className="md:col-span-2 text-center text-gray-500 dark:text-gray-400 p-10">
          <p>Menunggu data traffic interface ethernet...</p>
        </div>
      )}
    </div>
  );
}