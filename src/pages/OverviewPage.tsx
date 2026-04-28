import PageHeader from '../components/PageHeader';
import { payrollMockData } from '../data/payrollMock';
import { formatCurrency } from '../utils/payrollCalculations';
import { FIELD_LABELS, PAYROLL_FIELDS } from '../types/payroll';
import { Link } from 'react-router-dom';

const requirementChecklist = [
  { label: 'Uses real library component', supported: true },
  { label: 'Spreadsheet-like selection', supported: true },
  { label: 'Multi-cell selection', supported: true },
  { label: 'Batch update', supported: true },
  { label: 'Dropdown/autocomplete', supported: true },
  { label: 'Locked fields', supported: true },
  { label: 'Locked rows', supported: true },
  { label: 'Delete protection', supported: true },
  { label: 'Change log', supported: true },
  { label: 'Save payload preview', supported: true },
  { label: 'API-ready structure', supported: true },
];

const lockedRules = [
  'employeeId - always read-only',
  'employeeName - always read-only',
  'netPay - calculated field, cannot edit directly',
  'Header row - always locked',
  'Row with paymentStatus = "Paid" - all cells locked',
  'Row with paymentStatus = "Locked" - all cells locked',
  'Row with locked = true - cannot edit or delete',
  'Only rows with paymentStatus = "Draft" and locked = false can be deleted',
];

const demoPages = [
  {
    to: '/univer',
    label: 'Univer Sheets',
    description: 'Full spreadsheet engine with range protection',
    icon: 'fa-solid fa-table-cells-large',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    to: '/fortune-sheet',
    label: 'FortuneSheet',
    description: 'Google Sheets-like UX with familiar interface',
    icon: 'fa-solid fa-table-list',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    to: '/custom-sheet',
    label: 'Custom Sheet',
    description: 'Spreadsheet-like Custom HTML/CSS component',
    icon: 'fa-solid fa-code',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },

  {
    to: '/comparison',
    label: 'Comparison',
    description: 'Side-by-side feature comparison',
    icon: 'fa-solid fa-scale-balanced',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payroll Spreadsheet Library Comparison"
        subtitle="Compare Univer Sheets, FortuneSheet, and Glide Data Grid for spreadsheet-like payroll data editing"
        icon="fa-solid fa-house"
      />

      {/* Project Goal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-bullseye text-blue-600"></i>
          Project Goal
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          This demo evaluates three spreadsheet/data-grid libraries for building a payroll management
          system. Each demo page uses the actual library component (not plain HTML tables) to render
          and edit payroll data with cell-level and row-level protection. The goal is to identify the
          best library for production use based on features, performance, and developer experience.
        </p>
      </div>

      {/* Demo Pages */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-rocket text-blue-600"></i>
          Demo Pages
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoPages.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className={`group border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${page.color}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <i className={`${page.icon} text-xl`}></i>
                <span className="font-semibold text-sm">{page.label}</span>
              </div>
              <p className="text-xs opacity-80">{page.description}</p>
              <div className="mt-3 text-xs font-medium flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                Open demo
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Requirement Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-clipboard-check text-blue-600"></i>
          Requirement Checklist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {requirementChecklist.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200"
            >
              <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
              <span className="text-emerald-800">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Data Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-database text-blue-600"></i>
          Mock Payroll Data ({payrollMockData.length} records)
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Sample payroll data with various payment statuses and lock states for testing protection rules.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 text-slate-500 font-medium">ID</th>
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Name</th>
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Dept</th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">Base Salary</th>
                <th className="text-right py-2 px-2 text-slate-500 font-medium">Net Pay</th>
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Status</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium">Locked</th>
              </tr>
            </thead>
            <tbody>
              {payrollMockData.map((row) => (
                <tr
                  key={row.employeeId}
                  className={`border-b border-slate-50 ${
                    row.paymentStatus === 'Paid' || row.paymentStatus === 'Locked' || row.locked
                      ? 'bg-amber-50'
                      : ''
                  }`}
                >
                  <td className="py-2 px-2 font-mono text-slate-600">{row.employeeId}</td>
                  <td className="py-2 px-2 text-slate-700">{row.employeeName}</td>
                  <td className="py-2 px-2 text-slate-500">{row.department}</td>
                  <td className="py-2 px-2 text-right text-slate-700">
                    {formatCurrency(row.baseSalary)}
                  </td>
                  <td className="py-2 px-2 text-right font-medium text-emerald-700">
                    {formatCurrency(row.netPay)}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        row.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.paymentStatus === 'Locked'
                          ? 'bg-rose-100 text-rose-700'
                          : row.paymentStatus === 'Draft'
                          ? 'bg-slate-100 text-slate-600'
                          : row.paymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {row.locked ? (
                      <i className="fa-solid fa-lock text-rose-500"></i>
                    ) : (
                      <i className="fa-solid fa-lock-open text-slate-300"></i>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-blue-600"></i>
          Protection / Locked Rules
        </h2>
        <div className="space-y-2">
          {lockedRules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg bg-amber-50 border border-amber-200"
            >
              <span className="bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-amber-800">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How to Test */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-flask text-blue-600"></i>
          How to Test
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="space-y-2">
            <p className="font-medium text-slate-700">Test locked behavior:</p>
            <ul className="space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-blue-500 mt-0.5 text-xs"></i>
                Try editing employeeId - should be blocked
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-blue-500 mt-0.5 text-xs"></i>
                Try editing employeeName - should be blocked
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-blue-500 mt-0.5 text-xs"></i>
                Try editing netPay - should be blocked
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-blue-500 mt-0.5 text-xs"></i>
                Try editing any Paid/Locked row - should be blocked
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-slate-700">Test editable behavior:</p>
            <ul className="space-y-1.5 list-none">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-emerald-500 mt-0.5 text-xs"></i>
                Edit allowance/overtime/bonus on Draft rows - should work
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-emerald-500 mt-0.5 text-xs"></i>
                Delete Draft rows (unlocked) - should work
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-emerald-500 mt-0.5 text-xs"></i>
                Delete Paid/Locked rows - should be blocked
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-arrow-right text-emerald-500 mt-0.5 text-xs"></i>
                Batch update selected cells/range
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
