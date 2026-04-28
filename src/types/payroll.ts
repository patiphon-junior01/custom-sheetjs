export type PaymentStatus = 'Draft' | 'Pending' | 'Approved' | 'Paid' | 'Locked';

export type PaymentMethod = 'Bank Transfer' | 'PromptPay' | 'Cash';

export type Department = 'Engineering' | 'Sales' | 'Finance' | 'HR' | 'Operations';

export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  department: Department;
  position: string;
  baseSalary: number;
  allowance: number;
  overtime: number;
  bonus: number;
  expenseReimbursement: number;
  deduction: number;
  tax: number;
  socialSecurity: number;
  netPay: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  note: string;
  locked: boolean;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
  action: 'update' | 'delete';
}

export interface SavePayload {
  changes: ChangeLogEntry[];
  updatedRows: PayrollRow[];
  submittedAt: string;
}

export const PAYROLL_FIELDS = [
  'employeeId',
  'employeeName',
  'department',
  'position',
  'baseSalary',
  'allowance',
  'overtime',
  'bonus',
  'expenseReimbursement',
  'deduction',
  'tax',
  'socialSecurity',
  'netPay',
  'paymentStatus',
  'paymentMethod',
  'note',
  'locked',
] as const;

export type PayrollField = (typeof PAYROLL_FIELDS)[number];

export const EDITABLE_BATCH_FIELDS: PayrollField[] = [
  'paymentStatus',
  'paymentMethod',
  'allowance',
  'overtime',
  'bonus',
  'note',
];

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'Draft',
  'Pending',
  'Approved',
  'Paid',
  'Locked',
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'Bank Transfer',
  'PromptPay',
  'Cash',
];

export const DEPARTMENT_OPTIONS: Department[] = [
  'Engineering',
  'Sales',
  'Finance',
  'HR',
  'Operations',
];

export const FIELD_LABELS: Record<PayrollField, string> = {
  employeeId: 'Employee ID',
  employeeName: 'Employee Name',
  department: 'Department',
  position: 'Position',
  baseSalary: 'Base Salary',
  allowance: 'Allowance',
  overtime: 'Overtime',
  bonus: 'Bonus',
  expenseReimbursement: 'Expense Reimb.',
  deduction: 'Deduction',
  tax: 'Tax',
  socialSecurity: 'Social Security',
  netPay: 'Net Pay',
  paymentStatus: 'Status',
  paymentMethod: 'Pay Method',
  note: 'Note',
  locked: 'Locked',
};
