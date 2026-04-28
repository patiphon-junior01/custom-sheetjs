/* =========================================================================
   Custom Sheet System - Action Logger Hook
   ========================================================================= */

import { useState, useCallback, useRef } from 'react';
import type { ActionLog, ActionType } from './types';
import { createActionLog } from './types';

export interface UseActionLoggerReturn {
  /** Log ทั้งหมด */
  logs: ActionLog[];
  /** เพิ่ม log ใหม่ */
  addLog: (type: ActionType, payload: any, before: any, after: any) => ActionLog;
  /** ล้าง log ทั้งหมด */
  clearLogs: () => void;
  /** ดึง logs ตาม type */
  getLogsByType: (type: ActionType) => ActionLog[];
  /** ขนาด log */
  logCount: number;
}

export function useActionLogger(userName?: string): UseActionLoggerReturn {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const userRef = useRef(userName);
  userRef.current = userName;

  const addLog = useCallback(
    (type: ActionType, payload: any, before: any, after: any): ActionLog => {
      const log = createActionLog(type, payload, before, after, userRef.current);
      setLogs((prev) => [...prev, log]);

      // Console log สำหรับ dev
      if (import.meta.env.DEV) {
        const colors: Record<string, string> = {
          'cell-edited': '#3b82f6',
          'bulk-edit': '#8b5cf6',
          'row-moved': '#f59e0b',
          'column-moved': '#f59e0b',
          'row-inserted': '#10b981',
          'column-inserted': '#10b981',
          'row-deleted': '#ef4444',
          'column-deleted': '#ef4444',
          'selection-changed': '#64748b',
          'comment-added': '#06b6d4',
          'comment-updated': '#06b6d4',
          'comment-deleted': '#ef4444',
          'column-resized': '#a855f7',
          'cell-cleared': '#f97316',
          'undo': '#6366f1',
          'redo': '#6366f1',
          'save': '#22c55e',
        };
        console.log(
          `%c[Sheet Action] %c${type}`,
          'color: #94a3b8; font-weight: bold;',
          `color: ${colors[type] || '#64748b'}; font-weight: bold;`,
          { payload, before, after }
        );
      }

      return log;
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getLogsByType = useCallback(
    (type: ActionType): ActionLog[] => {
      return logs.filter((l) => l.type === type);
    },
    [logs]
  );

  return {
    logs,
    addLog,
    clearLogs,
    getLogsByType,
    logCount: logs.length,
  };
}
