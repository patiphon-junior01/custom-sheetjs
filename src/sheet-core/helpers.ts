/* =========================================================================
   Custom Sheet System - Data Helpers
   แปลง plain data เป็น SheetConfig อย่างง่าย
   ========================================================================= */

import type {
  SheetConfig, SheetRow, SheetColumn, SheetCallbacks, CellMode, SelectOption,
} from './types';
import { createCell, createRow, createColumn } from './types';

/* =========================================================================
   Column Config สำหรับ createSheetConfigFromData
   ========================================================================= */

export interface SimpleColumnConfig {
  /** key ของ column (ตรงกับ key ใน data object) */
  key: string;
  /** หัวข้อคอลัมน์ (default: ใช้ key) */
  title?: string;
  /** ความกว้าง (default: 150) */
  width?: number;
  /** Cell mode (default: 'editable-text') */
  mode?: CellMode;
  /** แก้ไขได้ (default: true) */
  editable?: boolean;
  /** ตัวเลือกสำหรับ mode: 'select' */
  options?: SelectOption[];
  /** placeholder */
  placeholder?: string;
}

/* =========================================================================
   Options สำหรับ createSheetConfigFromData
   ========================================================================= */

export interface CreateFromDataOptions {
  /** Column configs (ถ้าไม่กำหนด จะ auto-detect จาก data keys) */
  columns?: SimpleColumnConfig[];
  /** ชื่อ user */
  userName?: string;
  /** Callbacks */
  callbacks?: SheetCallbacks;
  /** จำนวน undo history สูงสุด */
  maxUndoHistory?: number;
  /** อนุญาตให้ insert/delete */
  allowInsertRow?: boolean;
  allowInsertColumn?: boolean;
  allowDeleteRow?: boolean;
  allowDeleteColumn?: boolean;
}

/* =========================================================================
   createSheetConfigFromData

   ใช้งานง่าย:
   const config = createSheetConfigFromData([
     { name: 'John', age: 30, dept: 'IT' },
     { name: 'Jane', age: 25, dept: 'HR' },
   ]);

   หรือกำหนด columns:
   const config = createSheetConfigFromData(data, {
     columns: [
       { key: 'name', title: 'ชื่อ', width: 200 },
       { key: 'age', title: 'อายุ', width: 100 },
       { key: 'dept', title: 'แผนก', mode: 'select', options: [...] },
     ],
   });
   ========================================================================= */

export function createSheetConfigFromData(
  data: Record<string, any>[],
  options: CreateFromDataOptions = {}
): SheetConfig {
  // Auto-detect columns จาก data keys ถ้าไม่ได้กำหนด
  const columnConfigs: SimpleColumnConfig[] = options.columns
    || (data.length > 0
      ? Object.keys(data[0]).map((key) => ({ key }))
      : []);

  // สร้าง SheetColumn[]
  const columns: SheetColumn[] = columnConfigs.map((cfg) =>
    createColumn(cfg.key, cfg.title || cfg.key, {
      width: cfg.width || 150,
      defaultMode: cfg.mode || 'editable-text',
      defaultEditable: cfg.editable ?? true,
    })
  );

  // สร้าง SheetRow[]
  const rows: SheetRow[] = data.map((item) => {
    const cells: Record<string, any> = {};
    columnConfigs.forEach((cfg) => {
      cells[cfg.key] = createCell(cfg.key, item[cfg.key] ?? '', {
        mode: cfg.mode || 'editable-text',
        editable: cfg.editable ?? true,
        options: cfg.options,
        placeholder: cfg.placeholder,
      });
    });
    return createRow(cells);
  });

  return {
    initialRows: rows,
    initialColumns: columns,
    userName: options.userName,
    callbacks: options.callbacks,
    maxUndoHistory: options.maxUndoHistory ?? 50,
    allowInsertRow: options.allowInsertRow ?? true,
    allowInsertColumn: options.allowInsertColumn ?? true,
    allowDeleteRow: options.allowDeleteRow ?? true,
    allowDeleteColumn: options.allowDeleteColumn ?? true,
  };
}
