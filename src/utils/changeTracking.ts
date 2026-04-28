import type { PayrollRow, PayrollField, ChangeLogEntry } from '../types/payroll';
import { recalculateNetPay, isCalculationField } from './payrollCalculations';
import { isCellLocked, isRowDeletable, getLockedReason, getDeleteBlockedReason } from './protectionRules';

let changeIdCounter = 0;

function generateChangeId(): string {
  changeIdCounter += 1;
  return `CHG-${changeIdCounter.toString().padStart(4, '0')}`;
}

export function resetChangeIdCounter(): void {
  changeIdCounter = 0;
}

interface UpdateCellResult {
  success: boolean;
  rows: PayrollRow[];
  changeLog: ChangeLogEntry | null;
  reason: string | null;
}

/**
 * อัพเดท cell เดียว
 * 1. หา row จาก employeeId
 * 2. ตรวจ isCellLocked
 * 3. ถ้า locked -> ไม่ update, return reason
 * 4. ถ้าไม่ locked -> update field, recalculate netPay ถ้าจำเป็น, add change log
 */
export function updateCell(
  rows: PayrollRow[],
  employeeId: string,
  field: PayrollField,
  newValue: string | number | boolean
): UpdateCellResult {
  const rowIndex = rows.findIndex((r) => r.employeeId === employeeId);
  if (rowIndex === -1) {
    return { success: false, rows, changeLog: null, reason: 'Row not found' };
  }

  const row = rows[rowIndex];
  const reason = getLockedReason(row, field);
  if (isCellLocked(row, field)) {
    return { success: false, rows, changeLog: null, reason: reason || 'Cell is locked' };
  }

  const oldValue = row[field as keyof PayrollRow];
  const updatedRows = [...rows];
  const updatedRow = { ...row, [field]: newValue };

  // recalculate netPay ถ้า field ที่แก้กระทบ payroll calculation
  if (isCalculationField(field)) {
    updatedRow.netPay = recalculateNetPay(updatedRow);
  }

  updatedRows[rowIndex] = updatedRow;

  const changeLog: ChangeLogEntry = {
    id: generateChangeId(),
    timestamp: new Date().toISOString(),
    employeeId,
    employeeName: row.employeeName,
    field,
    oldValue: oldValue as string | number | boolean,
    newValue,
    action: 'update',
  };

  return { success: true, rows: updatedRows, changeLog, reason: null };
}

interface DeleteRowResult {
  success: boolean;
  rows: PayrollRow[];
  changeLog: ChangeLogEntry | null;
  reason: string | null;
}

/**
 * ลบ row
 * 1. ตรวจ isRowDeletable
 * 2. ถ้าลบไม่ได้ -> return reason
 * 3. ถ้าลบได้ -> remove row, add change log
 */
export function deleteRow(
  rows: PayrollRow[],
  employeeId: string
): DeleteRowResult {
  const rowIndex = rows.findIndex((r) => r.employeeId === employeeId);
  if (rowIndex === -1) {
    return { success: false, rows, changeLog: null, reason: 'Row not found' };
  }

  const row = rows[rowIndex];
  if (!isRowDeletable(row)) {
    const reason = getDeleteBlockedReason(row);
    return {
      success: false,
      rows,
      changeLog: null,
      reason: reason || 'Row cannot be deleted',
    };
  }

  const updatedRows = rows.filter((r) => r.employeeId !== employeeId);

  const changeLog: ChangeLogEntry = {
    id: generateChangeId(),
    timestamp: new Date().toISOString(),
    employeeId,
    employeeName: row.employeeName,
    field: '*',
    oldValue: 'exists',
    newValue: 'deleted',
    action: 'delete',
  };

  return { success: true, rows: updatedRows, changeLog, reason: null };
}

interface BatchUpdateResult {
  rows: PayrollRow[];
  changeLogs: ChangeLogEntry[];
  updatedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

/**
 * Batch update หลาย row/cell พร้อมกัน
 */
export function batchUpdateCells(
  rows: PayrollRow[],
  employeeIds: string[],
  field: PayrollField,
  newValue: string | number | boolean
): BatchUpdateResult {
  let currentRows = [...rows];
  const changeLogs: ChangeLogEntry[] = [];
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedReasons: string[] = [];

  for (const empId of employeeIds) {
    const result = updateCell(currentRows, empId, field, newValue);
    if (result.success) {
      currentRows = result.rows;
      if (result.changeLog) {
        changeLogs.push(result.changeLog);
      }
      updatedCount++;
    } else {
      skippedCount++;
      if (result.reason) {
        skippedReasons.push(`${empId}: ${result.reason}`);
      }
    }
  }

  return { rows: currentRows, changeLogs, updatedCount, skippedCount, skippedReasons };
}

interface BatchDeleteResult {
  rows: PayrollRow[];
  changeLogs: ChangeLogEntry[];
  deletedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

/**
 * Batch delete หลาย row พร้อมกัน
 */
export function batchDeleteRows(
  rows: PayrollRow[],
  employeeIds: string[]
): BatchDeleteResult {
  let currentRows = [...rows];
  const changeLogs: ChangeLogEntry[] = [];
  let deletedCount = 0;
  let skippedCount = 0;
  const skippedReasons: string[] = [];

  for (const empId of employeeIds) {
    const result = deleteRow(currentRows, empId);
    if (result.success) {
      currentRows = result.rows;
      if (result.changeLog) {
        changeLogs.push(result.changeLog);
      }
      deletedCount++;
    } else {
      skippedCount++;
      if (result.reason) {
        skippedReasons.push(`${empId}: ${result.reason}`);
      }
    }
  }

  return { rows: currentRows, changeLogs, deletedCount, skippedCount, skippedReasons };
}
