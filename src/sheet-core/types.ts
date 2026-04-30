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
  | 'number'         // แสดงตัวเลข
  | 'formula';       // สูตรคำนวณ (คำนวณจากคอลัมน์อื่น)

// ========== Column Tag Definition ==========
// กำหนดประเภทคอลัมน์เองได้ (เช่น รายได้, รายหัก, ข้อมูลทั่วไป)
// แต่ละประเภทสามารถเลือก format ย่อย (number, text, select) ได้อีกที

export interface ColumnTagDefinition {
  /** key เช่น 'income', 'deduction', 'info' */
  key: string;
  /** ชื่อแสดงผล เช่น 'รายได้', 'รายหัก' */
  label: string;
  /** Font Awesome icon class เช่น 'fa-solid fa-plus' */
  icon?: string;
  /** สีป้ายประเภท (เช่น '#22c55e' สีเขียวสำหรับรายได้, '#ef4444' สีแดงสำหรับรายหัก) */
  color?: string;
  /** รูปแบบข้อมูลที่อนุญาตให้เลือก (default: ['editable-text', 'number', 'select', 'readonly']) */
  allowedFormats?: CellMode[];
  /** รองรับ properties เพิ่มเติม */
  [key: string]: any;
}

// ========== Formula Template ==========
// สูตรสำเร็จรูปที่สร้างจาก columnTag โดยอัตโนมัติ
// เช่น "SUM:income" จะรวมค่าทุกคอลัมน์ที่มี columnTag='income' และ dataType='number'

export interface FormulaTemplate {
  /** รหัส Template เช่น 'SUM:income', 'SUM:deduction' */
  key: string;
  /** ชื่อแสดงผล เช่น 'รวมรายได้ทั้งหมด' */
  label: string;
  /** ประเภท operation: 'SUM' (อนาคตอาจมี AVG, COUNT, etc.) */
  operation: 'SUM';
  /** อิงจาก columnTag key ไหน (เช่น 'income', 'deduction') */
  targetTag: string;
  /** icon สำหรับแสดงผล */
  icon?: string;
}

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
  /** รองรับ properties อื่นๆ ที่ consumer ต้องการเก็บเพิ่ม */
  [key: string]: any;
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
  lockDataType?: boolean;      // ล็อคประเภทข้อมูล (ห้ามเปลี่ยน dataType ผ่าน UI, กำหนดได้จาก code เท่านั้น)
  dataType?: CellMode;         // บังคับประเภทข้อมูลทั้งคอลัมน์ ('text', 'number', 'select', etc.)
  options?: SelectOption[];    // ช้อยส์ตั้งต้นกรณี dataType หรือ defaultMode เป็น 'select'
  defaultMode?: CellMode;
  defaultEditable?: boolean;
  deletable?: boolean;
  render?: (value: any, row: SheetRow, col: SheetColumn) => React.ReactNode;
  /** รูปแบบการแสดงผลเซลล์: 'plain' = ช่องเปล่า | 'input-preview' = แสดงกรอบคล้าย input ตลอด */
  cellStyle?: 'plain' | 'input-preview';
  /** ชุดคำสั่งสูตรคำนวณแบบ String (เช่น [baseSalary] + [bonus]) */
  formula?: string;
  /** รหัส Formula Template ที่ใช้ (เช่น 'SUM:income') ระบบจะ rebuild สูตรให้อัตโนมัติเมื่อมีการเปลี่ยนแปลงคอลัมน์ */
  formulaTemplate?: string;
  /** ประเภทคอลัมน์ (เช่น 'income' = รายได้, 'deduction' = รายหัก, 'info' = ข้อมูลทั่วไป) */
  columnTag?: string;
  /** แสดงยอดติดลบเป็นสีแดง (สำหรับคอลัมน์สูตรเท่านั้น) default: true สำหรับ formula columns */
  showNegativeRed?: boolean;
  /** บังคับแสดงผลเป็นตัวเลขติดลบและเป็นสีแดง (เพื่อการแสดงผลเท่านั้น ไม่กระทบค่าจริงที่ใช้คำนวณ) เช่น การรวมยอดรายหัก */
  forceNegativeDisplay?: boolean;
  /** รองรับ properties อื่นๆ ที่ consumer ต้องการเก็บเพิ่ม */
  [key: string]: any;
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
  /** รองรับ properties อื่นๆ ที่ consumer ต้องการเก็บเพิ่ม */
  [key: string]: any;
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
  | 'column-props-updated'
  | 'sort-changed';

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

// ========== Change Payload ==========

/** Payload ที่ส่งให้ onChange callback ทุกครั้งที่ข้อมูลเปลี่ยนแปลง */
export interface SheetChangePayload {
  /** ฟังก์ชันสำหรับดึงข้อมูลแถวทั้งหมด (รวมผลคำนวณสูตร) แบบ Deep Clone */
  getRows: () => SheetRow[];
  /** ฟังก์ชันสำหรับดึงข้อมูลแถวดิบ (base data) แบบ Deep Clone */
  getBaseRows: () => SheetRow[];
  /** ฟังก์ชันสำหรับดึงคอลัมน์ทั้งหมด แบบ Deep Clone */
  getColumns: () => SheetColumn[];
  /** เซลล์ที่ถูกแก้ไข */
  changedCells: ChangedCell[];
  /** มีการเปลี่ยนแปลงหรือยัง */
  isDirty: boolean;
  /** เวลาที่เกิดการเปลี่ยนแปลง */
  timestamp: string;
  /** Action ล่าสุดที่เกิดขึ้น (เช่น แก้เซลล์ไหน, เพิ่ม/ลบแถว, เปลี่ยน type อะไร) */
  lastAction: ActionLog | null;
  /** ประวัติ action ทั้งหมดที่เกิดขึ้น */
  actionLogs: ActionLog[];
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
  /** เรียกเมื่อสูตร Template ถูก rebuild อัตโนมัติ (เช่น เมื่อเพิ่ม/ลบคอลัมน์ที่มี tag ตรง) */
  onFormulaAutoUpdate?: (detail: {
    colId: string;
    columnTitle: string;
    templateKey: string;
    oldFormula: string;
    newFormula: string;
    affectedColumns: string[];
  }) => void;
  /** เรียกทุกครั้งที่ข้อมูลเปลี่ยนแปลง (ส่ง rows, columns, changedCells ทั้งหมด) */
  onChange?: (payload: SheetChangePayload) => void;
}

// ========== Sheet Config ==========

export interface SheetConfig {
  /** ID ของ sheet (ใช้เป็น key สำหรับเก็บ layout ลง localStorage, ถ้าไม่กำหนดจะไม่เก็บ) */
  sheetId?: string;
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
  /** ประเภทคอลัมน์ที่ developer กำหนดได้เอง (เช่น รายได้, รายหัก) แต่ละประเภทเลือก format ได้ */
  columnTags?: ColumnTagDefinition[];
  /** โหมดอ่านอย่างเดียว (Read-only) ถ้า true จะห้ามแก้ไขข้อมูล, ห้ามเพิ่ม/ลบ แถวและคอลัมน์ (ทำได้แค่ Sort, ค้นหา, ย่อขยาย) */
  readonly?: boolean;
  /** เปิดแสดง message ของ antd เมื่อทำรายการสำเร็จ/error (default: true) */
  enableMessages?: boolean;
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
  children?: ContextMenuItem[];
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

// ========== Sort ==========

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  /** column ID ที่กำลัง sort อยู่ */
  colId: string | null;
  /** ทิศทาง: 'asc' = น้อยไปมาก, 'desc' = มากไปน้อย, null = ไม่ sort */
  direction: SortDirection;
}

export const EMPTY_SORT: SortState = {
  colId: null,
  direction: null,
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
