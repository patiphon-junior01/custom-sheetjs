/* =========================================================================
   Custom Sheet System - Utility Functions
   ========================================================================= */

import type { CellPosition, SheetRow, SheetColumn, Selection } from './types';

/**
 * ตรวจสอบว่า cell อยู่ใน selection หรือไม่
 */
export function isCellInSelection(
  pos: CellPosition,
  selection: Selection
): boolean {
  // ตรวจจาก cells ตรงๆ
  if (selection.cells.some((c) => c.rowId === pos.rowId && c.colId === pos.colId)) {
    return true;
  }

  // ตรวจจาก rows (ถ้า select ทั้งแถว)
  if (selection.rows.includes(pos.rowId)) {
    return true;
  }

  // ตรวจจาก columns (ถ้า select ทั้งคอลัมน์)
  if (selection.columns.includes(pos.colId)) {
    return true;
  }

  return false;
}

/**
 * ขยาย ranges ออกเป็น individual cell positions
 */
export function expandRangesToCells(
  ranges: Selection['ranges'],
  rows: SheetRow[],
  columns: SheetColumn[]
): CellPosition[] {
  const cells: CellPosition[] = [];

  for (const range of ranges) {
    const startRowIdx = rows.findIndex((r) => r.id === range.start.rowId);
    const endRowIdx = rows.findIndex((r) => r.id === range.end.rowId);
    const startColIdx = columns.findIndex((c) => c.id === range.start.colId);
    const endColIdx = columns.findIndex((c) => c.id === range.end.colId);

    if (startRowIdx === -1 || endRowIdx === -1 || startColIdx === -1 || endColIdx === -1) continue;

    const minRow = Math.min(startRowIdx, endRowIdx);
    const maxRow = Math.max(startRowIdx, endRowIdx);
    const minCol = Math.min(startColIdx, endColIdx);
    const maxCol = Math.max(startColIdx, endColIdx);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ rowId: rows[r].id, colId: columns[c].id });
      }
    }
  }

  return cells;
}

/**
 * รวม selection ทุกแบบออกเป็น flat list ของ CellPosition
 */
export function getAllSelectedCells(
  selection: Selection,
  rows: SheetRow[],
  columns: SheetColumn[]
): CellPosition[] {
  const result: CellPosition[] = [...selection.cells];

  // Expand ranges
  result.push(...expandRangesToCells(selection.ranges, rows, columns));

  // Expand row selections
  for (const rowId of selection.rows) {
    for (const col of columns) {
      result.push({ rowId, colId: col.id });
    }
  }

  // Expand column selections
  for (const colId of selection.columns) {
    for (const row of rows) {
      result.push({ rowId: row.id, colId });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return result.filter((pos) => {
    const key = `${pos.rowId}:${pos.colId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * ตรวจสอบ OS สำหรับ keyboard shortcuts
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || '') ||
    /Mac/.test(navigator.userAgent || '');
}

/**
 * ตรวจสอบว่ากด Meta key (Cmd บน Mac, Ctrl บน Windows/Linux)
 */
export function isModKey(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac() ? e.metaKey : e.ctrlKey;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as any;
  }
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * ย้าย item ใน array จาก index หนึ่งไปอีก index
 */
export function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Insert item ใน array ที่ position ที่กำหนด
 */
export function insertArrayItem<T>(arr: T[], index: number, item: T): T[] {
  const result = [...arr];
  result.splice(index, 0, item);
  return result;
}

/**
 * ลบ item ออกจาก array ตาม indices
 */
export function removeArrayItems<T>(arr: T[], indices: number[]): T[] {
  const sortedIndices = [...indices].sort((a, b) => b - a);
  const result = [...arr];
  for (const idx of sortedIndices) {
    result.splice(idx, 1);
  }
  return result;
}

/**
 * Format shortcut key label ตาม OS
 */
export function formatShortcut(key: string): string {
  const mac = isMac();
  return key
    .replace('Mod', mac ? 'Cmd' : 'Ctrl')
    .replace('Alt', mac ? 'Option' : 'Alt');
}
