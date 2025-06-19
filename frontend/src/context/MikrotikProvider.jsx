import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';

export const MikrotikContext = createContext(null);

export const useMikrotik = () => useContext(MikrotikContext);

export const MikrotikProvider = ({ children }) => {
  const { authUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [traffic, setTraffic] = useState({});
  const [hotspotActive, setHotspotActive] = useState([]);
  
  const [deviceStatus, setDeviceStatus] = useState({
      isLoading: true,
      isConfigured: false,
      capabilities: { hasPppoe: false, hasHotspot: false }
  });

  const ws = useRef(null);

  const fetchDeviceStatus = useCallback(async () => {
    if (!authUser) {
        setDeviceStatus({ isLoading: false, isConfigured: false, capabilities: null });
        return;
    }
    setDeviceStatus(prev => ({ ...prev, isLoading: true }));
    try {
        const [configRes, capsRes] = await Promise.all([
            fetch('/api/workspaces/me', { credentials: 'include' }),
            fetch('/api/devices/capabilities', { credentials: 'include' })
        ]);

        const configData = configRes.ok ? await configRes.json() : null;
        const capsData = capsRes.ok ? await capsRes.json() : null;
        
        setDeviceStatus({
            isLoading: false,
            isConfigured: !!configData?.active_device_id,
            capabilities: capsData || { hasPppoe: false, hasHotspot: false }
        });
    } catch (error) {
        console.error("Gagal memeriksa status perangkat:", error);
        setDeviceStatus({ isLoading: false, isConfigured: false, capabilities: null });
    }
  }, [authUser]);

  useEffect(() => {
    fetchDeviceStatus();
  }, [fetchDeviceStatus]);

  useEffect(() => {
    if (!authUser || !deviceStatus.isConfigured) {
        if(ws.current && ws.current.readyState === WebSocket.OPEN) ws.current.close();
        return;
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => console.log(`WebSocket terhubung (user: ${authUser.username}).`);
    ws.current.onclose = () => console.log('WebSocket terputus.');
    ws.current.onerror = (error) => console.error('WebSocket Error:', error);
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'batch-update' && message.payload) {
            setResource(message.payload.resource || null);
            setTraffic(message.payload.traffic || {});
            setHotspotActive(message.payload.hotspotActive || []);
        } else if (message.type === 'config_error') {
            setDeviceStatus(prev => ({ ...prev, isConfigured: false }));
        }
      } catch (e) { console.error("Gagal parsing pesan WebSocket:", e); }
    };
    const currentWs = ws.current;
    return () => { if (currentWs) currentWs.close(); };
  }, [authUser, deviceStatus.isConfigured]);

  const restartMonitoring = useCallback(() => {
    fetchDeviceStatus();
  }, [fetchDeviceStatus]);

  const value = { resource, traffic, hotspotActive, deviceStatus, restartMonitoring };

  if (deviceStatus.isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-xl dark:text-white">Memverifikasi sesi & konfigurasi...</p></div>;
  }
  
  return <MikrotikContext.Provider value={value}>{children}</MikrotikContext.Provider>;
};