/* =========================================================================
   Custom Sheet System - Data Helpers
   แปลง plain data เป็น SheetConfig อย่างง่าย
   รองรับทุกรูปแบบข้อมูล ไม่ต้องรู้ Type ล่วงหน้า
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
  /** รองรับ properties อื่นๆ ที่ consumer ต้องการส่งผ่านไปยัง SheetColumn */
  [key: string]: any;
}

/* =========================================================================
   API Column Definition
   กรณี columns ได้มาจาก API (ไม่รู้โครงสร้างล่วงหน้า)
   ========================================================================= */

export interface ApiColumnDefinition {
  /** key / field name ที่ตรงกับ data - ต้องมี key หรือ field หรือ id อย่างน้อย 1 ตัว */
  key?: string;
  field?: string;
  id?: string;
  /** ชื่อแสดงผล - title หรือ label หรือ header อย่างใดก็ได้ */
  title?: string;
  label?: string;
  header?: string;
  name?: string;
  /** ความกว้าง */
  width?: number;
  /** ประเภทข้อมูล - type หรือ dataType หรือ mode อย่างใดก็ได้ */
  type?: string;
  dataType?: string;
  mode?: string;
  /** รองรับ properties อื่นๆ ทุกอย่างที่ API ส่งมา */
  [key: string]: any;
}

/* =========================================================================
   Options สำหรับ createSheetConfigFromData
   ========================================================================= */

export interface CreateFromDataOptions {
  /** Column configs แบบ SimpleColumnConfig (กรณีรู้ล่วงหน้า) */
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
  /** รูปแบบเซลล์เริ่มต้น */
  defaultCellStyle?: 'plain' | 'input-preview';
  /** Custom context menu items */
  customContextMenuItems?: SheetConfig['customContextMenuItems'];
  /** ประเภทคอลัมน์ที่ developer กำหนดได้เอง (เช่น รายได้, รายหัก) */
  columnTags?: SheetConfig['columnTags'];
  /** โหมดอ่านอย่างเดียว (Read-only) */
  readonly?: boolean;
  /** รองรับ properties อื่นๆ ที่ consumer ต้องการ */
  [key: string]: any;
}

/* =========================================================================
   Internal: แปลง type string จาก API ให้เป็น CellMode
   ========================================================================= */

function resolveCellMode(raw?: string): CellMode {
  if (!raw) return 'editable-text';

  const normalized = raw.toLowerCase().trim();

  // mapping จาก type ทั่วไปที่ API อาจส่งมา
  const modeMap: Record<string, CellMode> = {
    'text': 'editable-text',
    'string': 'editable-text',
    'editable-text': 'editable-text',
    'editable': 'editable-text',
    'number': 'number',
    'numeric': 'number',
    'int': 'number',
    'float': 'number',
    'decimal': 'number',
    'integer': 'number',
    'currency': 'number',
    'money': 'number',
    'select': 'select',
    'dropdown': 'select',
    'enum': 'select',
    'choice': 'select',
    'readonly': 'readonly',
    'read-only': 'readonly',
    'disabled': 'readonly',
    'view': 'readonly',
    'display': 'readonly',
    'formula': 'formula',
    'calculated': 'formula',
    'computed': 'formula',
    'custom': 'custom',
    'input': 'input',
  };

  return modeMap[normalized] || 'editable-text';
}

/* =========================================================================
   Internal: ดึง column key จาก API column definition
   ========================================================================= */

function resolveColumnKey(col: ApiColumnDefinition): string {
  return col.key || col.field || col.id || col.name || '';
}

/* =========================================================================
   Internal: ดึง column title จาก API column definition
   ========================================================================= */

function resolveColumnTitle(col: ApiColumnDefinition, fallbackKey: string): string {
  return col.title || col.label || col.header || col.name || fallbackKey;
}

/* =========================================================================
   createSheetConfigFromData

   วิธีที่ 1: Data only (auto-detect columns จาก keys ของ data)
   ---------------------------------------------------------------
   const config = createSheetConfigFromData([
     { name: 'John', age: 30, dept: 'IT' },
     { name: 'Jane', age: 25, dept: 'HR' },
   ]);

   วิธีที่ 2: Data + SimpleColumnConfig (รู้ columns ล่วงหน้า)
   ---------------------------------------------------------------
   const config = createSheetConfigFromData(data, {
     columns: [
       { key: 'name', title: 'ชื่อ', width: 200 },
       { key: 'age', title: 'อายุ', width: 100, mode: 'number' },
     ],
   });

   วิธีที่ 3: ข้อมูลจาก API ทั้ง columns และ rows
   ---------------------------------------------------------------
   const { columns, rows } = await fetch('/api/sheet').then(r => r.json());
   const config = createSheetConfigFromApi(columns, rows);
   ========================================================================= */

export function createSheetConfigFromData(
  data: Record<string, any>[],
  options: CreateFromDataOptions = {}
): SheetConfig {
  // Auto-detect columns จาก data keys ถ้าไม่ได้กำหนด
  const columnConfigs: SimpleColumnConfig[] = options.columns
    || autoDetectColumns(data);

  // สร้าง SheetColumn[]
  const columns: SheetColumn[] = columnConfigs.map((cfg) => {
    const { key, title, width, mode, editable, options: selectOpts, placeholder, ...extra } = cfg;
    return createColumn(key, title || key, {
      width: width || 150,
      defaultMode: mode || 'editable-text',
      defaultEditable: editable ?? true,
      options: selectOpts,
      ...extra,
    });
  });

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
    // เก็บ extra fields ของ data item ไว้ที่ row level ด้วย (id, meta, etc.)
    const rowExtras: Record<string, any> = {};
    for (const k of Object.keys(item)) {
      if (!columnConfigs.some(cfg => cfg.key === k)) {
        rowExtras[k] = item[k];
      }
    }
    return createRow(cells, rowExtras);
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
    defaultCellStyle: options.defaultCellStyle,
    customContextMenuItems: options.customContextMenuItems,
    columnTags: options.columnTags,
    readonly: options.readonly,
  };
}

/* =========================================================================
   createSheetConfigFromApi

   สำหรับกรณีที่ทั้ง columns definition และ rows data ได้มาจาก API
   โดยไม่ต้องรู้โครงสร้างล่วงหน้าเลย

   ตัวอย่างการใช้งาน:
   ---------------------------------------------------------------
   // API ส่ง columns มาแบบนี้ (format ใดก็ได้)
   const apiColumns = [
     { field: 'name', label: 'ชื่อ', type: 'text', width: 200 },
     { field: 'salary', label: 'เงินเดือน', type: 'number', width: 120 },
     { key: 'dept', title: 'แผนก', dataType: 'select', options: [...] },
   ];

   // API ส่ง rows มาแบบนี้ (plain objects)
   const apiRows = [
     { name: 'สมชาย', salary: 50000, dept: 'IT' },
     { name: 'สมหญิง', salary: 45000, dept: 'HR' },
   ];

   const config = createSheetConfigFromApi(apiColumns, apiRows, {
     userName: 'admin',
     allowInsertRow: false,
   });
   ========================================================================= */

export function createSheetConfigFromApi(
  apiColumns: ApiColumnDefinition[],
  apiRows: Record<string, any>[],
  options: Omit<CreateFromDataOptions, 'columns'> = {}
): SheetConfig {
  // แปลง API columns เป็น SheetColumn[]
  const columns: SheetColumn[] = apiColumns
    .map((apiCol) => {
      const key = resolveColumnKey(apiCol);
      if (!key) return null; // ข้ามถ้าไม่มี key

      const title = resolveColumnTitle(apiCol, key);
      const mode = resolveCellMode(apiCol.type || apiCol.dataType || apiCol.mode);

      // ดึง known fields ออก เก็บ extras ไว้
      const {
        key: _k, field: _f, id: _id,
        title: _t, label: _l, header: _h, name: _n,
        type: _tp, dataType: _dt, mode: _m,
        width,
        ...extras
      } = apiCol;

      return createColumn(key, title, {
        width: width || 150,
        dataType: mode,
        ...extras,
      });
    })
    .filter(Boolean) as SheetColumn[];

  // สร้าง SheetRow[] จาก API data
  const columnIds = columns.map(c => c.id);
  const rows: SheetRow[] = apiRows.map((item) => {
    const cells: Record<string, any> = {};

    // สร้างเซลล์สำหรับทุก column ที่ตรง
    for (const col of columns) {
      const rawValue = item[col.id];
      const colMode = col.dataType || col.defaultMode || 'editable-text';
      cells[col.id] = createCell(col.id, rawValue ?? '', {
        mode: colMode,
        editable: colMode !== 'readonly' && colMode !== 'formula',
      });
    }

    // เก็บ extra fields ที่ไม่ตรงกับ column ใดๆ ไว้ที่ row level
    const rowExtras: Record<string, any> = {};
    for (const k of Object.keys(item)) {
      if (!columnIds.includes(k)) {
        rowExtras[k] = item[k];
      }
    }

    return createRow(cells, rowExtras);
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
    defaultCellStyle: options.defaultCellStyle,
    customContextMenuItems: options.customContextMenuItems,
    columnTags: options.columnTags,
    readonly: options.readonly,
  };
}

/* =========================================================================
   autoDetectColumns

   ตรวจจับโครงสร้าง columns อัตโนมัติจาก data keys
   จะดู type ของค่าจริงใน data เพื่อเดา mode ที่เหมาะสม
   ========================================================================= */

export function autoDetectColumns(data: Record<string, any>[]): SimpleColumnConfig[] {
  if (data.length === 0) return [];

  // รวม keys ทั้งหมดจากทุก row (ไม่ใช่แค่ row แรก เผื่อ row แรกข้อมูลไม่ครบ)
  const allKeys = new Set<string>();
  for (const item of data) {
    for (const key of Object.keys(item)) {
      allKeys.add(key);
    }
  }

  return Array.from(allKeys).map((key) => {
    // ดูค่าจริงจาก data หลายๆ row เพื่อเดา type
    const sampleValues = data
      .map(item => item[key])
      .filter(v => v !== null && v !== undefined && v !== '');

    const detectedMode = detectModeFromValues(sampleValues);

    return {
      key,
      title: key,
      width: estimateColumnWidth(key, sampleValues),
      mode: detectedMode,
    };
  });
}

/* =========================================================================
   Internal: เดา CellMode จากค่าจริงของข้อมูล
   ========================================================================= */

function detectModeFromValues(values: any[]): CellMode {
  if (values.length === 0) return 'editable-text';

  // เช็คว่าทุกค่าเป็นตัวเลข
  const allNumeric = values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''));
  if (allNumeric) return 'number';

  // ค่าเริ่มต้น: editable-text
  return 'editable-text';
}

/* =========================================================================
   Internal: ประมาณความกว้างคอลัมน์จากข้อมูล
   ========================================================================= */

function estimateColumnWidth(key: string, values: any[]): number {
  const headerLen = key.length;
  const maxValueLen = values.reduce((max, v) => {
    const len = String(v).length;
    return len > max ? len : max;
  }, 0);

  const charWidth = 9; // ประมาณ px ต่อตัวอักษร
  const padding = 32;  // padding ซ้ายขวา
  const estimated = Math.max(headerLen, maxValueLen) * charWidth + padding;

  return Math.max(80, Math.min(estimated, 350)); // min 80, max 350
}
