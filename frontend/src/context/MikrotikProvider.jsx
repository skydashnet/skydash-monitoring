import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';

export const MikrotikContext = createContext(null);

export const useMikrotik = () => {
    const context = useContext(MikrotikContext);
    if (context === undefined) {
      throw new Error('useMikrotik must be used within a MikrotikProvider');
    }
    return context;
};

export const MikrotikProvider = ({ children }) => {
  const { authUser } = useAuth();
  const [resource, setResource] = useState(null);
  const [traffic, setTraffic] = useState({});
  const [hotspotActive, setHotspotActive] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  
  const ws = useRef(null);

  const checkDeviceConfiguration = useCallback(async () => {
    if (!authUser) {
        setConfigLoading(false);
        setIsConfigured(false);
        return;
    };
    setConfigLoading(true);
    try {
        const response = await fetch('/api/workspaces/me', { credentials: 'include' });
        if (response.ok) {
            const workspaceData = await response.json();
            setIsConfigured(!!workspaceData.active_device_id);
        } else {
            setIsConfigured(false);
        }
    } catch (error) {
        setIsConfigured(false);
    } finally {
        setConfigLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    checkDeviceConfiguration();
  }, [checkDeviceConfiguration]);

  useEffect(() => {
    if (!authUser || !isConfigured) {
        setTraffic({});
        setHotspotActive([]);
        return;
    }

    const hostname = window.location.hostname;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`; 
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log(`WebSocket terhubung (konfigurasi ditemukan untuk user ${authUser.username}).`);
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
            setIsConfigured(false);
            console.error('WebSocket Config Error:', message.message);
        }
      } catch (e) {
        console.error("Gagal mem-parsing pesan WebSocket:", e);
      }
    };

    const currentWs = ws.current;
    return () => {
      if (currentWs && currentWs.readyState === 1) {
          currentWs.close();
      }
    };
  }, [authUser, isConfigured]);

  const restartMonitoring = useCallback(() => {
    console.log("Memicu restart koneksi WebSocket...");
    if (ws.current) {
        ws.current.close();
    }
    checkDeviceConfiguration();
  }, [checkDeviceConfiguration]);

  const value = { resource, traffic, hotspotActive, isConfigured, configLoading, restartMonitoring };

  if (configLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <p className="text-xl dark:text-white">Memverifikasi sesi & konfigurasi...</p>
        </div>
    );
  }
  
  return (
    <MikrotikContext.Provider value={value}>
      {children}
    </MikrotikContext.Provider>
  );
};

export default MikrotikProvider;