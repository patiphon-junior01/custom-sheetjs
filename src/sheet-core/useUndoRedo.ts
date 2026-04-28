/* =========================================================================
   Custom Sheet System - Undo / Redo Hook
   ========================================================================= */

import { useCallback, useRef } from 'react';
import type { UndoableCommand } from './types';

export interface UseUndoRedoReturn {
  /** Execute command พร้อม push เข้า undo stack */
  execute: (command: UndoableCommand) => void;
  /** Undo command ล่าสุด */
  undo: () => UndoableCommand | null;
  /** Redo command ที่เพิ่ง undo */
  redo: () => UndoableCommand | null;
  /** สามารถ undo ได้ */
  canUndo: boolean;
  /** สามารถ redo ได้ */
  canRedo: boolean;
  /** จำนวน undo ที่เหลือ */
  undoCount: number;
  /** จำนวน redo ที่เหลือ */
  redoCount: number;
  /** ล้าง history */
  clearHistory: () => void;
  /** Force re-render (internal) */
  _version: number;
}

/**
 * ใช้ Ref-based stack แทน useState เพื่อแก้ปัญหา:
 * 1. undo/redo ต้อง return command synchronously
 * 2. command.undo() ต้อง execute ก่อน render รอบถัดไป
 * 3. หลีกเลี่ยง stale closure ใน setState callback
 */
export function useUndoRedo(maxHistory = 50): UseUndoRedoReturn {
  const undoStackRef = useRef<UndoableCommand[]>([]);
  const redoStackRef = useRef<UndoableCommand[]>([]);
  const maxRef = useRef(maxHistory);
  maxRef.current = maxHistory;

  // Force re-render counter
  const versionRef = useRef(0);
  const forceUpdate = useForceUpdate();

  const execute = useCallback((command: UndoableCommand) => {
    command.execute();
    undoStackRef.current = [...undoStackRef.current, command];
    // จำกัดจำนวน history
    if (undoStackRef.current.length > maxRef.current) {
      undoStackRef.current = undoStackRef.current.slice(
        undoStackRef.current.length - maxRef.current
      );
    }
    // Clear redo เมื่อมี action ใหม่
    redoStackRef.current = [];
    versionRef.current++;
    forceUpdate();
  }, [forceUpdate]);

  const undo = useCallback((): UndoableCommand | null => {
    if (undoStackRef.current.length === 0) return null;
    const stack = [...undoStackRef.current];
    const command = stack.pop()!;
    command.undo();
    undoStackRef.current = stack;
    redoStackRef.current = [...redoStackRef.current, command];
    versionRef.current++;
    forceUpdate();
    return command;
  }, [forceUpdate]);

  const redo = useCallback((): UndoableCommand | null => {
    if (redoStackRef.current.length === 0) return null;
    const stack = [...redoStackRef.current];
    const command = stack.pop()!;
    command.execute();
    redoStackRef.current = stack;
    undoStackRef.current = [...undoStackRef.current, command];
    versionRef.current++;
    forceUpdate();
    return command;
  }, [forceUpdate]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    versionRef.current++;
    forceUpdate();
  }, [forceUpdate]);

  return {
    execute,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    undoCount: undoStackRef.current.length,
    redoCount: redoStackRef.current.length,
    clearHistory,
    _version: versionRef.current,
  };
}

// Simple hook to force a re-render
import { useState } from 'react';
function useForceUpdate() {
  const [, setState] = useState(0);
  return useCallback(() => setState((v) => v + 1), []);
}
