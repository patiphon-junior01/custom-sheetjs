import type { PayrollRow } from '../types/payroll';

/**
 * คำนวณ netPay จากค่าต่าง ๆ ของ payroll row
 * netPay = baseSalary + allowance + overtime + bonus + expenseReimbursement - deduction - tax - socialSecurity
 */
export function recalculateNetPay(
  row: Omit<PayrollRow, 'netPay'> | PayrollRow
): number {
  return (
    row.baseSalary +
    row.allowance +
    row.overtime +
    row.bonus +
    row.expenseReimbursement -
    row.deduction -
    row.tax -
    row.socialSecurity
  );
}

/**
 * Fields ที่กระทบ payroll calculation
 */
export const CALCULATION_FIELDS = [
  'baseSalary',
  'allowance',
  'overtime',
  'bonus',
  'expenseReimbursement',
  'deduction',
  'tax',
  'socialSecurity',
] as const;

/**
 * ตรวจสอบว่า field ที่แก้ไขกระทบ netPay calculation หรือไม่
 */
export function isCalculationField(field: string): boolean {
  return (CALCULATION_FIELDS as readonly string[]).includes(field);
}

/**
 * Format ตัวเลขเป็น currency
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * คำนวณ summary ของ payroll data
 */
export function calculateSummary(rows: PayrollRow[]) {
  const totalNetPay = rows.reduce((sum, r) => sum + r.netPay, 0);
  const totalBaseSalary = rows.reduce((sum, r) => sum + r.baseSalary, 0);
  const totalDeductions = rows.reduce(
    (sum, r) => sum + r.deduction + r.tax + r.socialSecurity,
    0
  );
  const totalBonus = rows.reduce((sum, r) => sum + r.bonus, 0);

  const statusCounts = {
    Draft: rows.filter((r) => r.paymentStatus === 'Draft').length,
    Pending: rows.filter((r) => r.paymentStatus === 'Pending').length,
    Approved: rows.filter((r) => r.paymentStatus === 'Approved').length,
    Paid: rows.filter((r) => r.paymentStatus === 'Paid').length,
    Locked: rows.filter((r) => r.paymentStatus === 'Locked').length,
  };

  return {
    totalNetPay,
    totalBaseSalary,
    totalDeductions,
    totalBonus,
    totalEmployees: rows.length,
    statusCounts,
  };
}
