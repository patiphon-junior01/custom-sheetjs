/* =========================================================================
   Custom Sheet System - Core Types
   ========================================================================= */

// ========== Cell Position & Range ==========

export interface CellPosition {
  rowId: string;
  colId: string;
  initialValue?: string;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

// ========== Cell Comment ==========

export interface CellComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

// ========== Cell Component Props ==========

export interface CellComponentProps {
  cell: SheetCell;
  row: SheetRow;
  column: SheetColumn;
  isSelected: boolean;
  isEditing: boolean;
  onChange: (value: any) => void;
  onBlur: () => void;
}

// ========== Cell Modes ==========

export type CellMode =
  | 'text'           // แสดงข้อความอย่างเดียว
  | 'editable-text'  // double-click เพื่อแก้ไข
  | 'input'          // แสดง input field ตลอด
  | 'select'         // แสดง dropdown select
  | 'readonly'       // read-only ไม่สามารถแก้ไขได้
  | 'custom'         // ใช้ custom component
  | 'number';        // แสดงตัวเลข

// ========== Cell ==========

export interface SheetCell {
  id: string;
  value: any;
  mode: CellMode;
  editable: boolean;
  disabled: boolean;
  deletable: boolean;
  selectable: boolean;
  movable: boolean;
  overwritable: boolean;
  comment?: CellComment;
  component?: React.ComponentType<CellComponentProps>;
  options?: SelectOption[];   // สำหรับ mode: 'select'
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

// ========== Column ==========

export interface SheetColumn {
  id: string;
  title: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  resizable: boolean;
  draggable: boolean;
  sortable?: boolean;
  locked?: boolean;            // บังคับล็อคห้ามแก้ไขทั้งคอลัมน์
  dataType?: CellMode;         // บังคับประเภทข้อมูลทั้งคอลัมน์ ('text', 'number', 'select', etc.)
  options?: SelectOption[];    // ช้อยส์ตั้งต้นกรณี dataType หรือ defaultMode เป็น 'select'
  defaultMode?: CellMode;
  defaultEditable?: boolean;
  deletable?: boolean;
  render?: (value: any, row: SheetRow, col: SheetColumn) => React.ReactNode;
  /** รูปแบบการแสดงผลเซลล์: 'plain' = ช่องเปล่า | 'input-preview' = แสดงกรอบคล้าย input ตลอด */
  cellStyle?: 'plain' | 'input-preview';
}

// ========== Row ==========

export interface SheetRow {
  id: string;
  cells: Record<string, SheetCell>;
  draggable: boolean;
  deletable: boolean;
  /** Custom component สำหรับวาดแถวทั้งแถวแบบกำหนดเอง (จะไม่สามารถแก้ไขเซลล์ปกติได้) */
  component?: React.ComponentType<RowComponentProps>;
  /** Custom className สำหรับแถวนี้ */
  className?: string;
}

export interface RowComponentProps {
  row: SheetRow;
  columns: SheetColumn[];
  rowIndex: number;
}

// ========== Selection ==========

export interface Selection {
  cells: CellPosition[];
  ranges: CellRange[];
  rows: string[];       // row IDs ที่ถูก select ทั้งแถว
  columns: string[];    // column IDs ที่ถูก select ทั้งคอลัมน์
  anchor?: CellPosition; // จุดเริ่มต้นการ select
  focus?: CellPosition;  // จุดปัจจุบันของ cursor
}

export const EMPTY_SELECTION: Selection = {
  cells: [],
  ranges: [],
  rows: [],
  columns: [],
};

// ========== Action Log ==========

export type ActionType =
  | 'cell-edited'
  | 'bulk-edit'
  | 'row-moved'
  | 'column-moved'
  | 'row-inserted'
  | 'column-inserted'
  | 'row-deleted'
  | 'column-deleted'
  | 'column-renamed'
  | 'selection-changed'
  | 'comment-added'
  | 'comment-updated'
  | 'comment-deleted'
  | 'column-resized'
  | 'cell-cleared'
  | 'undo'
  | 'redo'
  | 'save'
  | 'column-props-updated';

export interface ActionLog {
  id: string;
  type: ActionType;
  timestamp: string;
  user?: string;
  payload: any;
  before: any;
  after: any;
}

// ========== Changed Cell ==========

export interface ChangedCell {
  rowId: string;
  colId: string;
  before: any;
  after: any;
}

// ========== Move / Insert / Delete Payloads ==========

export interface MovePayload {
  id: string;
  fromIndex: number;
  toIndex: number;
}

export interface InsertPayload {
  position: 'before' | 'after' | 'end';
  referenceId?: string;
  newId: string;
}

export interface DeletePayload {
  ids: string[];
}

// ========== Save Payload ==========

export interface SavePayload {
  data: SheetRow[];
  columns: SheetColumn[];
  changedCells: ChangedCell[];
  actionLogs: ActionLog[];
  selection: Selection | null;
  timestamp: string;
  source: 'keyboard-shortcut' | 'button' | 'context-menu';
}

// ========== Callbacks ==========

export interface SheetCallbacks {
  onCellEdit?: (cell: SheetCell, before: any, after: any) => void;
  onRowMove?: (payload: MovePayload) => void;
  onColumnMove?: (payload: MovePayload) => void;
  onRowInsert?: (payload: InsertPayload) => void;
  onColumnInsert?: (payload: InsertPayload) => void;
  onRowDelete?: (payload: DeletePayload) => void;
  onColumnDelete?: (payload: DeletePayload) => void;
  onSelectionChange?: (selection: Selection) => void;
  onCommentChange?: (comment: CellComment, action: 'add' | 'update' | 'delete') => void;
  onColumnResize?: (columnId: string, width: number) => void;
  onSave?: (payload: SavePayload) => void;
  onAction?: (action: ActionLog) => void;
}

// ========== Sheet Config ==========

export interface SheetConfig {
  /** ข้อมูล rows เริ่มต้น */
  initialRows: SheetRow[];
  /** คอลัมน์ config */
  initialColumns: SheetColumn[];
  /** Callbacks */
  callbacks?: SheetCallbacks;
  /** ชื่อ user (สำหรับ action log) */
  userName?: string;
  /** จำนวน undo history สูงสุด (default: 50) */
  maxUndoHistory?: number;
  /** อนุญาตให้ insert row */
  allowInsertRow?: boolean;
  /** อนุญาตให้ insert column */
  allowInsertColumn?: boolean;
  /** อนุญาตให้ลบ row */
  allowDeleteRow?: boolean;
  /** อนุญาตให้ลบ column */
  allowDeleteColumn?: boolean;
  /** Custom context menu items - เมนูคลิกขวาแบบกำหนดเอง */
  customContextMenuItems?: CustomContextMenuItem[];
  /** รูปแบบเซลล์เริ่มต้น: 'plain' = ช่องเปล่า | 'input-preview' = แสดงกรอบคล้าย input */
  defaultCellStyle?: 'plain' | 'input-preview';
}

// ========== Undo/Redo Command ==========

export interface UndoableCommand {
  id: string;
  type: ActionType;
  execute: () => void;
  undo: () => void;
  description: string;
}

// ========== Context Menu Item ==========

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

// ========== Custom Context Menu (Config-level) ==========

export type CustomMenuTarget = 'cell' | 'row-header' | 'col-header' | 'all';

export interface CustomMenuContext {
  cellPos: CellPosition;
  row?: SheetRow;
  column?: SheetColumn;
  cell?: SheetCell;
  menuType: 'cell' | 'row-header' | 'col-header';
}

export interface CustomContextMenuItem {
  /** Unique key */
  key: string;
  /** ข้อความที่แสดงบนเมนู */
  label: string;
  /** Font Awesome icon class */
  icon?: string;
  /** แสดงที่ไหน: 'cell' | 'row-header' | 'col-header' | 'all' */
  target: CustomMenuTarget;
  /** ปิดการใช้งานหรือไม่ */
  disabled?: boolean;
  /** สีแดงเตือน (danger) */
  danger?: boolean;
  /** Callback เมื่อกดเมนู */
  onClick: (context: CustomMenuContext) => void;
}

// ========== Search ==========

export interface SearchState {
  query: string;
  results: CellPosition[];
  currentIndex: number;
  isOpen: boolean;
}

export const EMPTY_SEARCH: SearchState = {
  query: '',
  results: [],
  currentIndex: -1,
  isOpen: false,
};

// ========== Helper: สร้าง Cell ==========

export function createCell(
  colId: string,
  value: any,
  overrides?: Partial<SheetCell>
): SheetCell {
  return {
    id: `cell-${colId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    value,
    mode: 'editable-text',
    editable: true,
    disabled: false,
    deletable: true,
    selectable: true,
    movable: true,
    overwritable: true,
    ...overrides,
  };
}

// ========== Helper: สร้าง Row ==========

export function createRow(
  cells: Record<string, SheetCell>,
  overrides?: Partial<SheetRow>
): SheetRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cells,
    draggable: true,
    deletable: true,
    ...overrides,
  };
}

// ========== Helper: สร้าง Column ==========

export function createColumn(
  id: string,
  title: string,
  options: Partial<SheetColumn> = {}
): SheetColumn {
  return {
    id,
    title,
    width: 100,
    resizable: true,
    draggable: true,
    deletable: true,
    ...options,
  };
}

// ========== Helper: สร้าง Action Log ==========

let actionCounter = 0;

export function createActionLog(
  type: ActionType,
  payload: any,
  before: any,
  after: any,
  user?: string
): ActionLog {
  return {
    id: `action-${++actionCounter}`,
    type,
    timestamp: new Date().toISOString(),
    user,
    payload,
    before,
    after,
  };
}

export function resetActionCounter() {
  actionCounter = 0;
}
