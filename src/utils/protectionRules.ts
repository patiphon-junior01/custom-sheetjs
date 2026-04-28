import type { PayrollRow, PayrollField } from '../types/payroll';

/**
 * ตรวจสอบว่า cell นี้ locked หรือไม่
 *
 * Rules:
 * 1. employeeId - locked เสมอ
 * 2. employeeName - locked เสมอ
 * 3. netPay - locked เสมอ (calculated field)
 * 4. row ที่ paymentStatus = Paid หรือ Locked - ทุก cell locked
 * 5. row ที่ locked = true - ทุก cell locked
 */
export function isCellLocked(row: PayrollRow, field: PayrollField): boolean {
  // Always-locked fields
  if (field === 'employeeId') return true;
  if (field === 'employeeName') return true;
  if (field === 'netPay') return true;

  // Row-level locks
  if (row.paymentStatus === 'Paid' || row.paymentStatus === 'Locked') return true;
  if (row.locked === true) return true;

  return false;
}

/**
 * ตรวจสอบว่าทั้ง row นี้ locked หรือไม่
 *
 * Row locked เมื่อ:
 * - paymentStatus = Paid
 * - paymentStatus = Locked
 * - locked = true
 */
export function isRowLocked(row: PayrollRow): boolean {
  if (row.paymentStatus === 'Paid' || row.paymentStatus === 'Locked') return true;
  if (row.locked === true) return true;
  return false;
}

/**
 * ตรวจสอบว่า row ลบได้หรือไม่
 *
 * ลบได้เฉพาะ:
 * - paymentStatus = Draft
 * - locked = false
 */
export function isRowDeletable(row: PayrollRow): boolean {
  return row.paymentStatus === 'Draft' && row.locked === false;
}

/**
 * ตรวจสอบว่า header row locked หรือไม่
 * Header row (index 0 ใน spreadsheet) locked เสมอ
 */
export function isHeaderLocked(rowIndex: number): boolean {
  return rowIndex === 0;
}

/**
 * คืนค่าเหตุผลที่ cell/row ถูก lock
 */
export function getLockedReason(row: PayrollRow, field: PayrollField): string | null {
  if (field === 'employeeId') {
    return 'Employee ID is a read-only identifier field';
  }
  if (field === 'employeeName') {
    return 'Employee Name is a read-only identifier field';
  }
  if (field === 'netPay') {
    return 'Net Pay is a calculated field and cannot be edited directly';
  }
  if (row.paymentStatus === 'Paid') {
    return `Row is locked because payment status is "Paid"`;
  }
  if (row.paymentStatus === 'Locked') {
    return `Row is locked because payment status is "Locked"`;
  }
  if (row.locked === true) {
    return 'Row is explicitly locked and cannot be edited or deleted';
  }
  return null;
}

/**
 * คืนค่าเหตุผลที่ row ลบไม่ได้
 */
export function getDeleteBlockedReason(row: PayrollRow): string | null {
  if (row.locked === true) {
    return 'Row is explicitly locked and cannot be deleted';
  }
  if (row.paymentStatus !== 'Draft') {
    return `Row cannot be deleted because payment status is "${row.paymentStatus}" (only "Draft" rows can be deleted)`;
  }
  return null;
}
