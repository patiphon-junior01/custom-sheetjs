/* =========================================================================
   Custom Sheet System - Keyboard Shortcuts Hook
   Cross-OS support (Windows/Mac/Linux)
   ========================================================================= */

import { useEffect, useCallback, useRef } from 'react';
import type { UseSheetEngineReturn } from './useSheetEngine';
import { isModKey } from './utils';

interface UseKeyboardConfig {
  /** Container element ref */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Sheet engine */
  engine: UseSheetEngineReturn;
  /** เปิด/ปิด keyboard shortcuts */
  enabled?: boolean;
}

export function useKeyboard({ containerRef, engine, enabled = true }: UseKeyboardConfig) {
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // ตรวจสอบว่า focus อยู่ภายใน container หรือเปล่า
      // หรือ target เป็น input/textarea ที่อยู่ข้างนอก ให้ข้ามไป
      const container = containerRef.current;
      if (!container) return;

      const target = e.target as HTMLElement;
      const isInsideContainer = container.contains(target);
      const isBodyOrContainer = target === document.body || target === container;

      // ถ้า focus ไม่ได้อยู่ใน container ให้ข้ามทุก shortcut
      // ยกเว้น Cmd+S ที่ควรป้องกัน browser default เสมอ (ถ้า container เคย focused)
      if (!isInsideContainer && !isBodyOrContainer) return;

      const eng = engineRef.current;
      const mod = isModKey(e);

      // =============================================
      // Ctrl/Cmd + S -> Save
      // =============================================
      if (mod && e.key === 's') {
        e.preventDefault();
        eng.save('keyboard-shortcut');
        return;
      }

      // =============================================
      // Ctrl/Cmd + Z -> Undo
      // =============================================
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        eng.undo();
        return;
      }

      // =============================================
      // Ctrl/Cmd + Y  OR  Cmd + Shift + Z -> Redo
      // =============================================
      if (
        (mod && e.key === 'y') ||
        (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        eng.redo();
        return;
      }

      // =============================================
      // Ignore grid shortcuts if user is currently typing in an input
      // =============================================
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable);
      
      // ยอมให้กด Tab ขณะพิมพ์เพื่อให้ไหลข้ามช่องไปข้างหน้าได้
      if (isInputFocused && e.key !== 'Tab') {
        return;
      }



      // =============================================
      // Escape -> Stop editing / Clear selection
      // =============================================
      if (e.key === 'Escape') {
        if (eng.editingCell) {
          // ปล่อยให้ Cell component จัดการ Escape เอง (revert ค่า + stopEditing)
          return;
        } else {
          eng.clearSelection();
        }
        return;
      }

      // =============================================
      // Ctrl/Cmd + A -> Select All
      // =============================================
      if (mod && e.key === 'a') {
        e.preventDefault();
        eng.selectAll();
        return;
      }

      // =============================================
      // Ctrl/Cmd + C -> Copy selection
      // =============================================
      if (mod && e.key === 'c' && !eng.editingCell) {
        e.preventDefault();
        eng.copySelection();
        return;
      }

      // =============================================
      // Ctrl/Cmd + X -> Cut (Copy + Clear)
      // =============================================
      if (mod && e.key === 'x' && !eng.editingCell) {
        e.preventDefault();
        eng.copySelection();
        eng.clearSelectedCells();
        return;
      }

      // =============================================
      // Ctrl/Cmd + V -> Paste
      // =============================================
      if (mod && e.key === 'v' && !eng.editingCell) {
        e.preventDefault();
        eng.pasteFromClipboard();
        return;
      }

      // =============================================
      // Delete / Backspace -> Clear selected cells
      // (ข้ามถ้ากำลัง editing - ให้ input จัดการเอง)
      // =============================================
      if ((e.key === 'Delete' || e.key === 'Backspace') && !eng.editingCell) {
        // ไม่ preventDefault ถ้า focus อยู่ใน input/textarea ข้างนอก
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        e.preventDefault();
        eng.clearSelectedCells();
        return;
      }

      // =============================================
      // Enter -> Start editing  OR  Stop editing + move down
      // =============================================
      if (e.key === 'Enter' && !eng.editingCell) {
        const sel = eng.selection;
        const focus = sel.focus || (sel.cells.length > 0 ? sel.cells[0] : null);
        if (focus) {
          e.preventDefault();
          eng.startEditing(focus);
        }
        return;
      }

      if (e.key === 'Enter' && eng.editingCell) {
        // ปล่อยให้ Cell component จัดการ Enter เอง
        return;
      }

      // =============================================
      // Tab -> Move selection right, Shift+Tab -> left
      // =============================================
      if (e.key === 'Tab') {
        e.preventDefault();
        const sel = eng.selection;
        const focus = sel.focus || (sel.cells.length > 0 ? sel.cells[0] : null);
        if (!focus) return;

        if (eng.editingCell) {
          eng.stopEditing();
        }

        const currentRows = eng.rows;
        const cols = eng.columns;
        const rowIdx = currentRows.findIndex((r) => r.id === focus.rowId);
        const colIdx = cols.findIndex((c) => c.id === focus.colId);
        
        let newRowIdx = rowIdx;
        let newColIdx = e.shiftKey ? colIdx - 1 : colIdx + 1;

        if (newColIdx >= cols.length) {
          newColIdx = 0;
          newRowIdx = Math.min(currentRows.length - 1, rowIdx + 1);
        } else if (newColIdx < 0) {
          newColIdx = cols.length - 1;
          newRowIdx = Math.max(0, rowIdx - 1);
        }

        const newPos = { rowId: currentRows[newRowIdx].id, colId: cols[newColIdx].id };
        eng.selectCell(newPos);

        // คืนโฟกัสให้ Container เพื่อไม่ให้ติดอยู่ในช่องเก่า
        if (containerRef.current) {
          (containerRef.current as HTMLElement).focus();
        }

        setTimeout(() => {
          const el = document.getElementById(`cs-cell-${newPos.rowId}-${newPos.colId}`);
          if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }, 10);
        return;
      }

      // =============================================
      // Arrow keys -> Move selection (only when not editing)
      // =============================================
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !eng.editingCell) {
        e.preventDefault();
        const sel = eng.selection;
        const focus = sel.focus || (sel.cells.length > 0 ? sel.cells[0] : null);
        if (!focus) return;

        const currentRows = eng.rows;
        const cols = eng.columns;
        const rowIdx = currentRows.findIndex((r) => r.id === focus.rowId);
        const colIdx = cols.findIndex((c) => c.id === focus.colId);

        let newRowIdx = rowIdx;
        let newColIdx = colIdx;

        switch (e.key) {
          case 'ArrowUp': newRowIdx = Math.max(0, rowIdx - 1); break;
          case 'ArrowDown': newRowIdx = Math.min(currentRows.length - 1, rowIdx + 1); break;
          case 'ArrowLeft': newColIdx = Math.max(0, colIdx - 1); break;
          case 'ArrowRight': newColIdx = Math.min(cols.length - 1, colIdx + 1); break;
        }

        if (newRowIdx < 0 || newColIdx < 0) return;

        const newPos = { rowId: currentRows[newRowIdx].id, colId: cols[newColIdx].id };

        if (e.shiftKey) {
          const anchor = sel.anchor || focus;
          eng.selectRange(anchor, newPos);
        } else {
          eng.selectCell(newPos);
        }

        // คืนโฟกัสให้ Container
        if (containerRef.current) {
          (containerRef.current as HTMLElement).focus();
        }

        // Auto-Scroll ให้หน้าจอตามไปที่ช่องที่เลือก (ใช้ delay ทิ้งช่วงให้ DOM update เล็กน้อย)
        setTimeout(() => {
          const el = document.getElementById(`cs-cell-${newPos.rowId}-${newPos.colId}`);
          if (el) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
          }
        }, 10);
        return;
      }

      // =============================================
      // F2 -> Start editing focused cell
      // =============================================
      if (e.key === 'F2' && !eng.editingCell) {
        const sel = eng.selection;
        const focus = sel.focus || (sel.cells.length > 0 ? sel.cells[0] : null);
        if (focus) {
          e.preventDefault();
          eng.startEditing(focus);
        }
        return;
      }

      // =============================================
      // Direct typing to start editing (Excel behavior)
      // =============================================
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !eng.editingCell &&
        !eng.search.isOpen
      ) {
        const sel = eng.selection;
        const focus = sel.focus || (sel.cells.length > 0 ? sel.cells[0] : null);
        if (focus) {
          e.preventDefault();
          eng.startEditing({ ...focus, initialValue: e.key });
        }
        return;
      }


    },
    [enabled, containerRef]
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
