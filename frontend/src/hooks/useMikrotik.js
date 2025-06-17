import { useContext } from 'react';
import { MikrotikContext } from '../context/MikrotikProvider';

export const useMikrotik = () => {
  const context = useContext(MikrotikContext);
  if (context === undefined) {
    throw new Error('useMikrotik must be used within a MikrotikProvider');
  }
  return context;
};