/* =========================================================================
   Custom Sheet System - Main Engine Hook
   useSheetEngine: state management + actions ทั้งหมด
   ========================================================================= */

import { useState, useCallback, useRef, useMemo } from 'react';
import type {
  SheetConfig, SheetRow, SheetColumn, SheetCell, Selection,
  CellPosition, CellComment, ActionLog, SavePayload,
  ChangedCell, UndoableCommand, SearchState,
} from './types';
import {
  EMPTY_SELECTION, EMPTY_SEARCH, createCell, createRow,
  createColumn, createActionLog,
} from './types';
import { useActionLogger } from './useActionLogger';
import { useUndoRedo } from './useUndoRedo';
import {
  deepClone, moveArrayItem, insertArrayItem,
  getAllSelectedCells, isCellInSelection, generateId, expandRangesToCells,
} from './utils';

/* =========================================================================
   Main Hook Return Type
   ========================================================================= */

export interface UseSheetEngineReturn {
  // Data
  rows: SheetRow[];
  columns: SheetColumn[];
  selection: Selection;
  search: SearchState;
  editingCell: CellPosition | null;

  // Cell Actions
  setCellValue: (rowId: string, colId: string, value: any) => void;
  clearSelectedCells: () => void;
  bulkSetValue: (value: any) => void;

  // Selection
  selectCell: (pos: CellPosition, append?: boolean) => void;
  selectRange: (start: CellPosition, end: CellPosition) => void;
  selectRow: (rowId: string, append?: boolean) => void;
  selectColumn: (colId: string, append?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (pos: CellPosition) => boolean;

  // Editing
  startEditing: (pos: CellPosition) => void;
  stopEditing: () => void;

  // Row Operations
  insertRow: (position: 'before' | 'after' | 'end', referenceId?: string) => void;
  deleteRows: (ids: string[]) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;

  // Column Operations
  insertColumn: (position: 'before' | 'after' | 'end', referenceId?: string, col?: Partial<SheetColumn>) => void;
  deleteColumns: (ids: string[]) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  resizeColumn: (colId: string, width: number) => void;
  renameColumn: (colId: string, newTitle: string) => void;
  updateColumnProps: (colId: string, props: Partial<Pick<SheetColumn, 'locked' | 'dataType' | 'options'>>) => void;

  // Clipboard
  copySelection: () => void;
  pasteFromClipboard: () => void;

  // Comments
  addComment: (rowId: string, colId: string, text: string) => void;
  updateComment: (rowId: string, colId: string, text: string) => void;
  deleteComment: (rowId: string, colId: string) => void;

  // Search
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Save
  save: (source: SavePayload['source']) => void;

  // Logs
  actionLogs: ActionLog[];
  clearLogs: () => void;

  // State
  changedCells: ChangedCell[];
  isDirty: boolean;
}

/* =========================================================================
   useSheetEngine
   ========================================================================= */

export function useSheetEngine(config: SheetConfig): UseSheetEngineReturn {
  const {
    initialRows,
    initialColumns,
    callbacks,
    userName,
    maxUndoHistory = 50,
    allowInsertRow = true,
    allowInsertColumn = true,
    allowDeleteRow = true,
    allowDeleteColumn = true,
  } = config;

  // Core state
  const [rows, setRows] = useState<SheetRow[]>(() => deepClone(initialRows));
  const [columns, setColumns] = useState<SheetColumn[]>(() => deepClone(initialColumns));
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [search, setSearch] = useState<SearchState>(EMPTY_SEARCH);
  const [changedCells, setChangedCells] = useState<ChangedCell[]>([]);

  // Refs สำหรับ closures
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const editingRangeRef = useRef<CellPosition[]>([]);

  // Sub-hooks
  const logger = useActionLogger(userName);
  const undoRedo = useUndoRedo(maxUndoHistory);
  const loggerRef = useRef(logger.addLog);
  loggerRef.current = logger.addLog;

  // =============================================
  // Helper: emit callback + log
  // =============================================
  const emitAction = useCallback(
    (type: Parameters<typeof logger.addLog>[0], payload: any, before: any, after: any) => {
      const log = loggerRef.current(type, payload, before, after);
      callbacksRef.current?.onAction?.(log);
      return log;
    },
    []
  );

  // =============================================
  // CELL ACTIONS
  // =============================================

  const setCellValue = useCallback(
    (rowId: string, colId: string, value: any) => {
      const currentRows = rowsRef.current;
      const currentCols = columnsRef.current;

      // ตรวจสอบว่า Cell ที่ปรับแก้อยู่ใน Range ที่ถูกคลุมไว้หรือไม่ 
      // (ถ้าเคยจดจำไว้ตอนเริ่ม Edit ให้ใช้ค่านั้น ไม่งั้นค่อยคำนวณใหม่)
      const selCells = editingRangeRef.current.length > 0 
        ? editingRangeRef.current 
        : getAllSelectedCells(selectionRef.current, currentRows, currentCols);

      const isMultiSelect = selCells.length > 1;
      const partOfSelection = selCells.some((c) => c.rowId === rowId && c.colId === colId);

      if (isMultiSelect && partOfSelection) {
        // ======= BULK UPDATE MODE =======
        const oldValues: { rowId: string; colId: string; value: any; newValue?: any }[] = [];
        selCells.forEach((pos) => {
          const row = currentRows.find((r) => r.id === pos.rowId);
          if (!row) return;
          const cell = row.cells[pos.colId];
          const col = currentCols.find((c) => c.id === pos.colId);
          if (!cell || cell.disabled || !cell.editable || col?.locked) return;
          
          let parsedValue = value;
          const effectiveMode = col?.dataType || cell.mode || 'text';
          if (effectiveMode === 'number' && typeof parsedValue !== 'number') {
             const num = Number(parsedValue);
             if (!isNaN(num)) parsedValue = num;
          }
          if (effectiveMode === 'select' && parsedValue !== '') {
             const selectOptions = col?.options || cell.options || [];
             if (selectOptions.length > 0 && !selectOptions.some(opt => String(opt.value) === String(parsedValue))) {
                return; // ถ้าลากมาวางแล้วไม่ตรงกับที่มีในช้อยส์ ให้ตีตก
             }
          }
          if (cell.value === parsedValue) return; // ข้ามช่องที่ค่าเดิมเหมือนค่าใหม่
          oldValues.push({ rowId: pos.rowId, colId: pos.colId, value: cell.value, newValue: parsedValue });
        });

        if (oldValues.length > 0) {
          const command: UndoableCommand = {
            id: generateId('cmd'),
            type: 'bulk-edit',
            description: `Bulk set ${oldValues.length} cells to "${value}"`,
            execute: () => {
              setRows((prev) => {
                const next = [...prev];
                oldValues.forEach(({ rowId, colId, newValue }) => {
                  const idx = next.findIndex((r) => r.id === rowId);
                  if (idx === -1) return;
                  next[idx] = {
                    ...next[idx],
                    cells: {
                      ...next[idx].cells,
                      [colId]: { ...next[idx].cells[colId], value: newValue },
                    },
                  };
                });
                return next;
              });
            },
            undo: () => {
              setRows((prev) => {
                const next = [...prev];
                oldValues.forEach(({ rowId, colId, value: oldVal }) => {
                  const idx = next.findIndex((r) => r.id === rowId);
                  if (idx === -1) return;
                  next[idx] = {
                    ...next[idx],
                    cells: {
                      ...next[idx].cells,
                      [colId]: { ...next[idx].cells[colId], value: oldVal },
                    },
                  };
                });
                return next;
              });
            },
          };

          undoRedo.execute(command);
          const changes = oldValues.map((obj) => ({
            rowId: obj.rowId,
            colId: obj.colId,
            before: obj.value,
            after: value,
          }));
          setChangedCells((prev) => [...prev, ...changes]);
          emitAction('bulk-edit', { count: oldValues.length }, oldValues.map((o) => o.value), oldValues.map((o) => o.newValue));
        }
        return; // สิ้นสุดหากเป็นการแก้แบบ Bulk
      }

      // ======= SINGLE SET MODE =======
      const rowIdx = currentRows.findIndex((r) => r.id === rowId);
      if (rowIdx === -1) return;

      const cell = currentRows[rowIdx].cells[colId];
      const col = currentCols.find((c) => c.id === colId);
      if (!cell || cell.disabled || !cell.editable || col?.locked) return;

      let parsedValue = value;
      const effectiveMode = col?.dataType || cell.mode || 'text';
      if (effectiveMode === 'number' && typeof parsedValue !== 'number') {
         const num = Number(parsedValue);
         if (!isNaN(num)) parsedValue = num;
      }
      if (effectiveMode === 'select' && parsedValue !== '') {
         const selectOptions = col?.options || cell.options || [];
         if (selectOptions.length > 0 && !selectOptions.some(opt => String(opt.value) === String(parsedValue))) {
            return; // กรอกมาไม่ตรงกับช้อยส์ ให้ตีตกเช่นกัน
         }
      }

      const oldValue = cell.value;
      if (oldValue === parsedValue) return;

      // Command สำหรับ undo
      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'cell-edited',
        description: `Edit cell [${rowId}:${colId}]`,
        execute: () => {
          setRows((prev) => {
            const next = [...prev];
            next[rowIdx] = {
              ...next[rowIdx],
              cells: {
                ...next[rowIdx].cells,
                [colId]: { ...next[rowIdx].cells[colId], value: parsedValue },
              },
            };
            return next;
          });
        },
        undo: () => {
          setRows((prev) => {
            const next = [...prev];
            next[rowIdx] = {
              ...next[rowIdx],
              cells: {
                ...next[rowIdx].cells,
                [colId]: { ...next[rowIdx].cells[colId], value: oldValue },
              },
            };
            return next;
          });
        },
      };

      undoRedo.execute(command);
      setChangedCells((prev) => [...prev, { rowId, colId, before: oldValue, after: parsedValue }]);
      emitAction('cell-edited', { rowId, colId }, oldValue, parsedValue);
      callbacksRef.current?.onCellEdit?.(cell, oldValue, parsedValue);
    },
    [undoRedo, emitAction]
  );

  const clearSelectedCells = useCallback(() => {
    const currentRows = rowsRef.current;
    const currentCols = columnsRef.current;
    const selectedPositions = getAllSelectedCells(selectionRef.current, currentRows, currentCols);

    if (selectedPositions.length === 0) return;

    // จำค่าเดิมไว้
    const oldValues: { rowId: string; colId: string; value: any }[] = [];
    selectedPositions.forEach((pos) => {
      const row = currentRows.find((r) => r.id === pos.rowId);
      if (!row) return;
      const cell = row.cells[pos.colId];
      const col = currentCols.find((c) => c.id === pos.colId);
      if (!cell || cell.disabled || !cell.deletable || col?.locked) return;
      oldValues.push({ rowId: pos.rowId, colId: pos.colId, value: cell.value });
    });

    if (oldValues.length === 0) return;

    const command: UndoableCommand = {
      id: generateId('cmd'),
      type: 'cell-cleared',
      description: `Clear ${oldValues.length} cells`,
      execute: () => {
        setRows((prev) => {
          const next = [...prev];
          oldValues.forEach(({ rowId, colId }) => {
            const idx = next.findIndex((r) => r.id === rowId);
            if (idx === -1) return;
            next[idx] = {
              ...next[idx],
              cells: {
                ...next[idx].cells,
                [colId]: { ...next[idx].cells[colId], value: '' },
              },
            };
          });
          return next;
        });
      },
      undo: () => {
        setRows((prev) => {
          const next = [...prev];
          oldValues.forEach(({ rowId, colId, value }) => {
            const idx = next.findIndex((r) => r.id === rowId);
            if (idx === -1) return;
            next[idx] = {
              ...next[idx],
              cells: {
                ...next[idx].cells,
                [colId]: { ...next[idx].cells[colId], value },
              },
            };
          });
          return next;
        });
      },
    };

    undoRedo.execute(command);
    emitAction('cell-cleared', { count: oldValues.length }, oldValues, null);
  }, [undoRedo, emitAction]);

  const bulkSetValue = useCallback(
    (value: any) => {
      const currentRows = rowsRef.current;
      const currentCols = columnsRef.current;
      const selectedPositions = getAllSelectedCells(selectionRef.current, currentRows, currentCols);

      if (selectedPositions.length === 0) return;

      const oldValues: { rowId: string; colId: string; value: any }[] = [];
      selectedPositions.forEach((pos) => {
        const row = currentRows.find((r) => r.id === pos.rowId);
        if (!row) return;
        const cell = row.cells[pos.colId];
        if (!cell || cell.disabled || !cell.editable || !cell.overwritable) return;
        oldValues.push({ rowId: pos.rowId, colId: pos.colId, value: cell.value });
      });

      if (oldValues.length === 0) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'bulk-edit',
        description: `Bulk set ${oldValues.length} cells to "${value}"`,
        execute: () => {
          setRows((prev) => {
            const next = [...prev];
            oldValues.forEach(({ rowId, colId }) => {
              const idx = next.findIndex((r) => r.id === rowId);
              if (idx === -1) return;
              next[idx] = {
                ...next[idx],
                cells: {
                  ...next[idx].cells,
                  [colId]: { ...next[idx].cells[colId], value },
                },
              };
            });
            return next;
          });
        },
        undo: () => {
          setRows((prev) => {
            const next = [...prev];
            oldValues.forEach(({ rowId, colId, value: oldVal }) => {
              const idx = next.findIndex((r) => r.id === rowId);
              if (idx === -1) return;
              next[idx] = {
                ...next[idx],
                cells: {
                  ...next[idx].cells,
                  [colId]: { ...next[idx].cells[colId], value: oldVal },
                },
              };
            });
            return next;
          });
        },
      };

      undoRedo.execute(command);
      const changes = oldValues.map((ov) => ({ rowId: ov.rowId, colId: ov.colId, before: ov.value, after: value }));
      setChangedCells((prev) => [...prev, ...changes]);
      emitAction('bulk-edit', { value, count: oldValues.length }, oldValues, value);
    },
    [undoRedo, emitAction]
  );

  // =============================================
  // SELECTION
  // =============================================

  const selectCell = useCallback(
    (pos: CellPosition, append = false) => {
      setSelection((prev) => {
        const next: Selection = append
          ? { ...prev, cells: [...prev.cells, pos], anchor: pos, focus: pos }
          : { cells: [pos], ranges: [], rows: [], columns: [], anchor: pos, focus: pos };
        callbacksRef.current?.onSelectionChange?.(next);
        return next;
      });
    },
    []
  );

  const selectRange = useCallback(
    (start: CellPosition, end: CellPosition) => {
      setSelection((prev) => {
        const next: Selection = {
          ...prev,
          cells: expandRangesToCells([{ start, end }], rowsRef.current, columnsRef.current),
          ranges: [{ start, end }],
          anchor: start,
          focus: end,
        };
        callbacksRef.current?.onSelectionChange?.(next);
        return next;
      });
    },
    []
  );

  const selectRow = useCallback(
    (rowId: string, append = false) => {
      setSelection((prev) => {
        const next: Selection = append
          ? { ...prev, rows: [...prev.rows, rowId] }
          : { cells: [], ranges: [], rows: [rowId], columns: [] };
        callbacksRef.current?.onSelectionChange?.(next);
        return next;
      });
    },
    []
  );

  const selectColumn = useCallback(
    (colId: string, append = false) => {
      setSelection((prev) => {
        const next: Selection = append
          ? { ...prev, columns: [...prev.columns, colId] }
          : { cells: [], ranges: [], rows: [], columns: [colId] };
        callbacksRef.current?.onSelectionChange?.(next);
        return next;
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    const allRows = rowsRef.current.map((r) => r.id);
    setSelection({
      cells: [],
      ranges: [],
      rows: allRows,
      columns: [],
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(EMPTY_SELECTION);
  }, []);

  const isSelected = useCallback(
    (pos: CellPosition): boolean => {
      return isCellInSelection(pos, selectionRef.current);
    },
    []
  );

  // =============================================
  // EDITING
  // =============================================

  const startEditing = useCallback((pos: CellPosition) => {
    const row = rowsRef.current.find((r) => r.id === pos.rowId);
    if (!row) return;
    const col = columnsRef.current.find((c) => c.id === pos.colId);
    const cell = row.cells[pos.colId];
    if (!cell || cell.disabled || !cell.editable || cell.mode === 'readonly' || cell.mode === 'text' || col?.locked) return;
    setEditingCell(pos);

    // เก็บ Range ณ ขณะนั้น เพื่อใช้ล็อกเป้าสำหรับ Bulk Edit
    const allSel = getAllSelectedCells(selectionRef.current, rowsRef.current, columnsRef.current);
    if (allSel.length > 1 && allSel.some((c) => c.rowId === pos.rowId && c.colId === pos.colId)) {
      editingRangeRef.current = allSel;
    } else {
      editingRangeRef.current = [];
    }
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
    editingRangeRef.current = []; // ล้างค่าทิ้งเมื่อจบการแก้ไข
  }, []);

  // =============================================
  // ROW OPERATIONS
  // =============================================

  const insertRow = useCallback(
    (position: 'before' | 'after' | 'end', referenceId?: string) => {
      if (!allowInsertRow) return;

      const currentCols = columnsRef.current;
      const cells: Record<string, SheetCell> = {};
      currentCols.forEach((col) => {
        const mode = col.dataType || col.defaultMode || 'editable-text';
        const editable = col.locked ? false : (col.defaultEditable ?? true);
        cells[col.id] = createCell(col.id, '', {
          mode,
          editable,
          disabled: col.locked ?? false,
          options: col.options,
        });
      });

      const newRow = createRow(cells);
      const currentRows = rowsRef.current;

      let insertIdx = currentRows.length;
      if (position !== 'end' && referenceId) {
        const refIdx = currentRows.findIndex((r) => r.id === referenceId);
        if (refIdx !== -1) {
          insertIdx = position === 'before' ? refIdx : refIdx + 1;
        }
      }

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'row-inserted',
        description: `Insert row ${position} ${referenceId || 'end'}`,
        execute: () => {
          setRows((prev) => insertArrayItem(prev, insertIdx, newRow));
        },
        undo: () => {
          setRows((prev) => prev.filter((r) => r.id !== newRow.id));
        },
      };

      undoRedo.execute(command);
      emitAction('row-inserted', { position, referenceId, newId: newRow.id }, null, newRow);
      callbacksRef.current?.onRowInsert?.({ position, referenceId, newId: newRow.id });
    },
    [allowInsertRow, undoRedo, emitAction]
  );

  const deleteRows = useCallback(
    (ids: string[]) => {
      if (!allowDeleteRow) return;

      const currentRows = rowsRef.current;
      const deletedRows = ids
        .map((id) => {
          const idx = currentRows.findIndex((r) => r.id === id);
          return idx !== -1 && currentRows[idx].deletable ? { row: currentRows[idx], index: idx } : null;
        })
        .filter(Boolean) as { row: SheetRow; index: number }[];

      if (deletedRows.length === 0) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'row-deleted',
        description: `Delete ${deletedRows.length} rows`,
        execute: () => {
          const deleteIds = new Set(deletedRows.map((d) => d.row.id));
          setRows((prev) => prev.filter((r) => !deleteIds.has(r.id)));
        },
        undo: () => {
          setRows((prev) => {
            const next = [...prev];
            // Insert กลับที่เดิม (จากท้ายมาหน้า)
            const sorted = [...deletedRows].sort((a, b) => a.index - b.index);
            sorted.forEach(({ row, index }) => {
              next.splice(Math.min(index, next.length), 0, row);
            });
            return next;
          });
        },
      };

      undoRedo.execute(command);
      emitAction('row-deleted', { ids: deletedRows.map((d) => d.row.id) }, deletedRows, null);
      callbacksRef.current?.onRowDelete?.({ ids: deletedRows.map((d) => d.row.id) });
    },
    [allowDeleteRow, undoRedo, emitAction]
  );

  const moveRow = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const currentRows = rowsRef.current;
      if (fromIndex < 0 || fromIndex >= currentRows.length) return;
      if (toIndex < 0 || toIndex >= currentRows.length) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'row-moved',
        description: `Move row from ${fromIndex} to ${toIndex}`,
        execute: () => setRows((prev) => moveArrayItem(prev, fromIndex, toIndex)),
        undo: () => setRows((prev) => moveArrayItem(prev, toIndex, fromIndex)),
      };

      undoRedo.execute(command);
      emitAction('row-moved', { id: currentRows[fromIndex].id, fromIndex, toIndex }, fromIndex, toIndex);
      callbacksRef.current?.onRowMove?.({ id: currentRows[fromIndex].id, fromIndex, toIndex });
    },
    [undoRedo, emitAction]
  );

  // =============================================
  // COLUMN OPERATIONS
  // =============================================

  const insertColumn = useCallback(
    (position: 'before' | 'after' | 'end', referenceId?: string, colOverrides?: Partial<SheetColumn>) => {
      if (!allowInsertColumn) return;

      const colId = generateId('col');
      const newCol = createColumn(colId, colOverrides?.title || `Column ${columnsRef.current.length + 1}`, colOverrides);

      const currentCols = columnsRef.current;
      let insertIdx = currentCols.length;
      if (position !== 'end' && referenceId) {
        const refIdx = currentCols.findIndex((c) => c.id === referenceId);
        if (refIdx !== -1) {
          insertIdx = position === 'before' ? refIdx : refIdx + 1;
        }
      }

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-inserted',
        description: `Insert column ${position} ${referenceId || 'end'}`,
        execute: () => {
          setColumns((prev) => insertArrayItem(prev, insertIdx, newCol));
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              cells: {
                ...row.cells,
                [colId]: createCell(colId, ''),
              },
            }))
          );
        },
        undo: () => {
          setColumns((prev) => prev.filter((c) => c.id !== colId));
          setRows((prev) =>
            prev.map((row) => {
              const { [colId]: _, ...rest } = row.cells;
              return { ...row, cells: rest };
            })
          );
        },
      };

      undoRedo.execute(command);
      emitAction('column-inserted', { position, referenceId, newId: colId }, null, newCol);
      callbacksRef.current?.onColumnInsert?.({ position, referenceId, newId: colId });
    },
    [allowInsertColumn, undoRedo, emitAction]
  );

  const deleteColumns = useCallback(
    (ids: string[]) => {
      if (!allowDeleteColumn) return;

      const currentCols = columnsRef.current;
      const currentRows = rowsRef.current;

      const deletedCols = ids
        .map((id) => {
          const idx = currentCols.findIndex((c) => c.id === id);
          return idx !== -1 ? { col: currentCols[idx], index: idx } : null;
        })
        .filter(Boolean) as { col: SheetColumn; index: number }[];

      if (deletedCols.length === 0) return;

      // เก็บ cell data ไว้สำหรับ undo
      const savedCellData = currentRows.map((row) => ({
        rowId: row.id,
        cells: Object.fromEntries(ids.filter((id) => row.cells[id]).map((id) => [id, row.cells[id]])),
      }));

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-deleted',
        description: `Delete ${deletedCols.length} columns`,
        execute: () => {
          const deleteIds = new Set(ids);
          setColumns((prev) => prev.filter((c) => !deleteIds.has(c.id)));
          setRows((prev) =>
            prev.map((row) => {
              const newCells = { ...row.cells };
              ids.forEach((id) => delete newCells[id]);
              return { ...row, cells: newCells };
            })
          );
        },
        undo: () => {
          setColumns((prev) => {
            const next = [...prev];
            const sorted = [...deletedCols].sort((a, b) => a.index - b.index);
            sorted.forEach(({ col, index }) => {
              next.splice(Math.min(index, next.length), 0, col);
            });
            return next;
          });
          setRows((prev) =>
            prev.map((row) => {
              const saved = savedCellData.find((s) => s.rowId === row.id);
              return {
                ...row,
                cells: { ...row.cells, ...(saved?.cells || {}) },
              };
            })
          );
        },
      };

      undoRedo.execute(command);
      emitAction('column-deleted', { ids }, deletedCols, null);
      callbacksRef.current?.onColumnDelete?.({ ids });
    },
    [allowDeleteColumn, undoRedo, emitAction]
  );

  const moveColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-moved',
        description: `Move column from ${fromIndex} to ${toIndex}`,
        execute: () => setColumns((prev) => moveArrayItem(prev, fromIndex, toIndex)),
        undo: () => setColumns((prev) => moveArrayItem(prev, toIndex, fromIndex)),
      };

      undoRedo.execute(command);
      const col = columnsRef.current[fromIndex];
      emitAction('column-moved', { id: col?.id, fromIndex, toIndex }, fromIndex, toIndex);
      callbacksRef.current?.onColumnMove?.({ id: col?.id || '', fromIndex, toIndex });
    },
    [undoRedo, emitAction]
  );

  const resizeColumn = useCallback(
    (colId: string, width: number) => {
      const currentCols = columnsRef.current;
      const colIdx = currentCols.findIndex((c) => c.id === colId);
      if (colIdx === -1) return;

      const oldWidth = currentCols[colIdx].width;
      const clampedWidth = Math.max(
        currentCols[colIdx].minWidth || 50,
        Math.min(currentCols[colIdx].maxWidth || 800, width)
      );

      if (oldWidth === clampedWidth) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-resized',
        description: `Resize column ${colId} to ${clampedWidth}px`,
        execute: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, width: clampedWidth } : c))
          );
        },
        undo: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, width: oldWidth } : c))
          );
        },
      };

      undoRedo.execute(command);
      emitAction('column-resized', { colId, width: clampedWidth }, oldWidth, clampedWidth);
      callbacksRef.current?.onColumnResize?.(colId, clampedWidth);
    },
    [undoRedo, emitAction]
  );

  const renameColumn = useCallback(
    (colId: string, newTitle: string) => {
      const currentCols = columnsRef.current;
      const col = currentCols.find((c) => c.id === colId);
      if (!col) return;

      const oldTitle = col.title;
      if (oldTitle === newTitle) return;

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-renamed',
        description: `Rename column "${oldTitle}" to "${newTitle}"`,
        execute: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, title: newTitle } : c))
          );
        },
        undo: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, title: oldTitle } : c))
          );
        },
      };

      undoRedo.execute(command);
      emitAction('column-renamed', { colId }, oldTitle, newTitle);
    },
    [undoRedo, emitAction]
  );

  const updateColumnProps = useCallback(
    (colId: string, props: Partial<Pick<SheetColumn, 'locked' | 'dataType' | 'options'>>) => {
      const currentCols = columnsRef.current;
      const col = currentCols.find((c) => c.id === colId);
      if (!col) return;

      const oldProps = {
        locked: col.locked,
        dataType: col.dataType,
        options: col.options,
      };

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'column-props-updated',
        description: `Update column "${col.title}" props`,
        execute: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, ...props } : c))
          );
        },
        undo: () => {
          setColumns((prev) =>
            prev.map((c) => (c.id === colId ? { ...c, ...oldProps } : c))
          );
        },
      };

      undoRedo.execute(command);
      emitAction('column-props-updated', { colId, props }, oldProps, props);
    },
    [undoRedo, emitAction]
  );

  // =============================================
  // COMMENTS
  // =============================================

  const addComment = useCallback(
    (rowId: string, colId: string, text: string) => {
      const comment: CellComment = {
        id: generateId('comment'),
        text,
        author: userName || 'User',
        createdAt: new Date().toISOString(),
      };

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'comment-added',
        description: `Add comment on [${rowId}:${colId}]`,
        execute: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment } } }
                : r
            )
          );
        },
        undo: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment: undefined } } }
                : r
            )
          );
        },
      };

      undoRedo.execute(command);
      emitAction('comment-added', { rowId, colId }, null, comment);
      callbacksRef.current?.onCommentChange?.(comment, 'add');
    },
    [userName, undoRedo, emitAction]
  );

  const updateComment = useCallback(
    (rowId: string, colId: string, text: string) => {
      const row = rowsRef.current.find((r) => r.id === rowId);
      if (!row || !row.cells[colId]?.comment) return;

      const oldComment = deepClone(row.cells[colId].comment!);
      const newComment: CellComment = { ...oldComment, text, updatedAt: new Date().toISOString() };

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'comment-updated',
        description: `Update comment on [${rowId}:${colId}]`,
        execute: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment: newComment } } }
                : r
            )
          );
        },
        undo: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment: oldComment } } }
                : r
            )
          );
        },
      };

      undoRedo.execute(command);
      emitAction('comment-updated', { rowId, colId }, oldComment, newComment);
      callbacksRef.current?.onCommentChange?.(newComment, 'update');
    },
    [undoRedo, emitAction]
  );

  const deleteComment = useCallback(
    (rowId: string, colId: string) => {
      const row = rowsRef.current.find((r) => r.id === rowId);
      if (!row || !row.cells[colId]?.comment) return;

      const oldComment = deepClone(row.cells[colId].comment!);

      const command: UndoableCommand = {
        id: generateId('cmd'),
        type: 'comment-deleted',
        description: `Delete comment on [${rowId}:${colId}]`,
        execute: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment: undefined } } }
                : r
            )
          );
        },
        undo: () => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: { ...r.cells[colId], comment: oldComment } } }
                : r
            )
          );
        },
      };

      undoRedo.execute(command);
      emitAction('comment-deleted', { rowId, colId }, oldComment, null);
      callbacksRef.current?.onCommentChange?.(oldComment, 'delete');
    },
    [undoRedo, emitAction]
  );

  // =============================================
  // CLIPBOARD (Copy / Paste)
  // =============================================

  const copySelection = useCallback(async () => {
    const currentRows = rowsRef.current;
    const currentCols = columnsRef.current;
    const selectedPositions = getAllSelectedCells(selectionRef.current, currentRows, currentCols);

    if (selectedPositions.length === 0) return;

    const rowIdSet = new Set(selectedPositions.map((p) => p.rowId));
    const colIdSet = new Set(selectedPositions.map((p) => p.colId));
    const orderedRowIds = currentRows.filter((r) => rowIdSet.has(r.id)).map((r) => r.id);
    const orderedColIds = currentCols.filter((c) => colIdSet.has(c.id)).map((c) => c.id);

    // Tab-separated text (compatible Excel)
    const lines: string[] = [];
    for (const rowId of orderedRowIds) {
      const row = currentRows.find((r) => r.id === rowId);
      if (!row) continue;
      const values: string[] = [];
      for (const colId of orderedColIds) {
        const cell = row.cells[colId];
        values.push(cell ? String(cell.value ?? '') : '');
      }
      lines.push(values.join('\t'));
    }

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      return;
    }
    if (!text) return;

    const focus = selectionRef.current.focus;
    if (!focus) return;

    const currentRows = rowsRef.current;
    const currentCols = columnsRef.current;

    const startRowIdx = currentRows.findIndex((r) => r.id === focus.rowId);
    const startColIdx = currentCols.findIndex((c) => c.id === focus.colId);
    if (startRowIdx === -1 || startColIdx === -1) return;

    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
    const grid = lines.map((line) => line.split('\t'));

    const changes: { rowId: string; colId: string; oldValue: any; newValue: string }[] = [];

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const rowIdx = startRowIdx + r;
        const colIdx = startColIdx + c;
        if (rowIdx >= currentRows.length || colIdx >= currentCols.length) continue;

        const row = currentRows[rowIdx];
        const col = currentCols[colIdx];
        const cell = row.cells[col.id];
        if (!cell || cell.disabled || !cell.editable || !cell.overwritable) continue;

        const pasteValue = grid[r][c];

        // Validation พื้นฐาน: หากช่องเป็น dropdown ต้องมีค่าตรงกับที่ตั้งไว้ ไม่งั้นข้าม
        if (cell.mode === 'select' && cell.options) {
          const isValid = cell.options.some((opt) => String(opt.value) === String(pasteValue));
          if (!isValid) continue;
        }

        changes.push({
          rowId: row.id,
          colId: col.id,
          oldValue: cell.value,
          newValue: grid[r][c],
        });
      }
    }

    if (changes.length === 0) return;

    const command: UndoableCommand = {
      id: generateId('cmd'),
      type: 'bulk-edit',
      description: `Paste ${changes.length} cells`,
      execute: () => {
        setRows((prev) => {
          const next = [...prev];
          changes.forEach(({ rowId, colId, newValue }) => {
            const idx = next.findIndex((rr) => rr.id === rowId);
            if (idx === -1) return;
            next[idx] = {
              ...next[idx],
              cells: {
                ...next[idx].cells,
                [colId]: { ...next[idx].cells[colId], value: newValue },
              },
            };
          });
          return next;
        });
      },
      undo: () => {
        setRows((prev) => {
          const next = [...prev];
          changes.forEach(({ rowId, colId, oldValue }) => {
            const idx = next.findIndex((rr) => rr.id === rowId);
            if (idx === -1) return;
            next[idx] = {
              ...next[idx],
              cells: {
                ...next[idx].cells,
                [colId]: { ...next[idx].cells[colId], value: oldValue },
              },
            };
          });
          return next;
        });
      },
    };

    undoRedo.execute(command);
    const changesCells = changes.map((ch) => ({
      rowId: ch.rowId, colId: ch.colId, before: ch.oldValue, after: ch.newValue,
    }));
    setChangedCells((prev) => [...prev, ...changesCells]);
    emitAction('bulk-edit', { source: 'paste', count: changes.length }, changes.map((ch) => ch.oldValue), changes.map((ch) => ch.newValue));
  }, [undoRedo, emitAction]);

  // =============================================
  // SEARCH
  // =============================================

  const openSearch = useCallback(() => {
    setSearch((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeSearch = useCallback(() => {
    setSearch(EMPTY_SEARCH);
  }, []);

  const setSearchQuery = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearch((prev) => ({ ...prev, query, results: [], currentIndex: -1 }));
        return;
      }

      const currentRows = rowsRef.current;
      const currentCols = columnsRef.current;
      const results: CellPosition[] = [];
      const lowerQuery = query.toLowerCase();

      currentRows.forEach((row) => {
        currentCols.forEach((col) => {
          const cell = row.cells[col.id];
          if (cell && String(cell.value).toLowerCase().includes(lowerQuery)) {
            results.push({ rowId: row.id, colId: col.id });
          }
        });
      });

      setSearch({ query, results, currentIndex: results.length > 0 ? 0 : -1, isOpen: true });
    },
    []
  );

  const nextSearchResult = useCallback(() => {
    setSearch((prev) => {
      if (prev.results.length === 0) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.results.length;
      return { ...prev, currentIndex: nextIdx };
    });
  }, []);

  const prevSearchResult = useCallback(() => {
    setSearch((prev) => {
      if (prev.results.length === 0) return prev;
      const prevIdx = (prev.currentIndex - 1 + prev.results.length) % prev.results.length;
      return { ...prev, currentIndex: prevIdx };
    });
  }, []);

  // =============================================
  // UNDO / REDO
  // =============================================

  const undo = useCallback(() => {
    const cmd = undoRedo.undo();
    if (cmd) {
      emitAction('undo', { commandId: cmd.id, description: cmd.description }, null, null);
    }
  }, [undoRedo, emitAction]);

  const redo = useCallback(() => {
    const cmd = undoRedo.redo();
    if (cmd) {
      emitAction('redo', { commandId: cmd.id, description: cmd.description }, null, null);
    }
  }, [undoRedo, emitAction]);

  // =============================================
  // SAVE
  // =============================================

  const save = useCallback(
    (source: SavePayload['source']) => {
      const payload: SavePayload = {
        data: deepClone(rowsRef.current),
        columns: deepClone(columnsRef.current),
        changedCells: [...changedCells],
        actionLogs: [...logger.logs],
        selection: deepClone(selectionRef.current),
        timestamp: new Date().toISOString(),
        source,
      };

      emitAction('save', { source }, null, payload);
      callbacksRef.current?.onSave?.(payload);
    },
    [changedCells, logger.logs, emitAction]
  );

  // =============================================
  // Derived state
  // =============================================

  const isDirty = useMemo(() => changedCells.length > 0, [changedCells]);

  return {
    rows,
    columns,
    selection,
    search,
    editingCell,

    setCellValue,
    clearSelectedCells,
    bulkSetValue,

    selectCell,
    selectRange,
    selectRow,
    selectColumn,
    selectAll,
    clearSelection,
    isSelected,

    startEditing,
    stopEditing,

    insertRow,
    deleteRows,
    moveRow,

    insertColumn,
    deleteColumns,
    moveColumn,
    resizeColumn,
    renameColumn,
    updateColumnProps,

    copySelection,
    pasteFromClipboard,

    addComment,
    updateComment,
    deleteComment,

    openSearch,
    closeSearch,
    setSearchQuery,
    nextSearchResult,
    prevSearchResult,

    undo,
    redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,

    save,

    actionLogs: logger.logs,
    clearLogs: logger.clearLogs,

    changedCells,
    isDirty,
  };
}
