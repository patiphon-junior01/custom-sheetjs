/* =========================================================================
   Custom Sheet System - Barrel Export
   ========================================================================= */

// Types
export type {
  SheetCell,
  SheetRow,
  SheetColumn,
  SheetConfig,
  SheetCallbacks,
  CellMode,
  CellComment,
  CellPosition,
  CellRange,
  CellComponentProps,
  SelectOption,
  Selection,
  ActionLog,
  ActionType,
  ChangedCell,
  SavePayload,
  MovePayload,
  InsertPayload,
  DeletePayload,
  UndoableCommand,
  ContextMenuItem,
  CustomContextMenuItem,
  CustomMenuContext,
  CustomMenuTarget,
  RowComponentProps,
  SearchState,
  ColumnTagDefinition,
  FormulaTemplate,
  SortState,
  SortDirection,
} from './types';

// Helpers
export {
  createCell,
  createRow,
  createColumn,
  createActionLog,
  resetActionCounter,
  EMPTY_SELECTION,
  EMPTY_SEARCH,
  EMPTY_SORT,
} from './types';

// Utils
export {
  isCellInSelection,
  expandRangesToCells,
  getAllSelectedCells,
  isMac,
  isModKey,
  deepClone,
  generateId,
  moveArrayItem,
  insertArrayItem,
  removeArrayItems,
  formatShortcut,
  generateFormulaTemplates,
  buildFormulaFromTemplate,
  rebuildTemplateFormulas,
} from './utils';

// Hooks
export { useSheetEngine } from './useSheetEngine';
export type { UseSheetEngineReturn } from './useSheetEngine';

export { useActionLogger } from './useActionLogger';
export type { UseActionLoggerReturn } from './useActionLogger';

export { useUndoRedo } from './useUndoRedo';
export type { UseUndoRedoReturn } from './useUndoRedo';

export { useKeyboard } from './useKeyboard';

// Data Helpers
export { createSheetConfigFromData, createSheetConfigFromApi, autoDetectColumns } from './helpers';
export type { SimpleColumnConfig, CreateFromDataOptions, ApiColumnDefinition } from './helpers';
