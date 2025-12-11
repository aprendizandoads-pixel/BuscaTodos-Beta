

import { SystemLog } from "../types";

const LOG_KEY = 'sys_logs_v1';

export const addLog = (
  type: 'error' | 'info' | 'success' | 'warning',
  source: 'mercadopago' | 'efi' | 'system',
  message: string,
  details?: any
) => {
  const newLog: SystemLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type,
    source,
    message,
    details: typeof details === 'object' ? JSON.stringify(details) : details
  };

  try {
    const existingLogsStr = localStorage.getItem(LOG_KEY);
    const logs: SystemLog[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    
    // Keep only last 50 logs
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    
    localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));
    console.log(`[${source.toUpperCase()}] ${message}`, details || '');
  } catch (e) {
    console.error("Failed to save log", e);
  }
};

export const getLogs = (): SystemLog[] => {
  try {
    const logs = localStorage.getItem(LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (e) {
    return [];
  }
};

export const clearLogs = () => {
  localStorage.removeItem(LOG_KEY);
};