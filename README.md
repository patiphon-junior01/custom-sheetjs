# Payroll Spreadsheet Library Comparison Demo

## Project Overview

Demo web application for comparing three spreadsheet/data-grid libraries for payroll data management:

1. **Univer Sheets** - Full-featured spreadsheet engine
2. **FortuneSheet** - Google Sheets-like experience
3. **Glide Data Grid** - High-performance canvas data grid

Each demo page uses the **actual library component** (not plain HTML tables) to render and edit payroll data with cell-level and row-level protection.

## Tech Stack

- React 19
- Vite 8
- TypeScript 6
- TailwindCSS 4
- React Router DOM

## Installed Libraries

| Library | Package |
|---------|---------|
| Univer Sheets | `@univerjs/presets`, `@univerjs/core`, `@univerjs/design`, `@univerjs/docs`, `@univerjs/docs-ui`, `@univerjs/engine-formula`, `@univerjs/engine-render`, `@univerjs/sheets`, `@univerjs/sheets-ui`, `@univerjs/sheets-formula`, `@univerjs/ui` |
| FortuneSheet | `@fortune-sheet/react` |
| Glide Data Grid | `@glideapps/glide-data-grid` |

## How to Run

```bash
# Install dependencies (requires --legacy-peer-deps due to React 19 peer deps)
npm install --legacy-peer-deps

# Start dev server
npm run dev

# Open http://localhost:5173
```

## How to Build

```bash
npm run build
npm run preview
```

## Demo Pages

| Page | Path | Description |
|------|------|-------------|
| Overview | `/` | Project goal, requirements, mock data, locked rules |
| Univer Sheets | `/univer` | Full spreadsheet engine demo |
| FortuneSheet | `/fortune-sheet` | Google Sheets-like demo |
| Glide Data Grid | `/glide` | Canvas data grid demo |
| Comparison | `/comparison` | Side-by-side feature comparison |

## Mock Payroll Data

Located at `src/data/payrollMock.ts` with 10 employee records.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| employeeId | string | Employee identifier (read-only) |
| employeeName | string | Employee name (read-only) |
| department | string | Engineering, Sales, Finance, HR, Operations |
| position | string | Job title |
| baseSalary | number | Base monthly salary |
| allowance | number | Monthly allowance |
| overtime | number | Overtime pay |
| bonus | number | Bonus amount |
| expenseReimbursement | number | Expense reimbursement |
| deduction | number | Deductions |
| tax | number | Tax amount |
| socialSecurity | number | Social security contribution |
| netPay | number | Calculated: baseSalary + allowance + overtime + bonus + expenseReimbursement - deduction - tax - socialSecurity |
| paymentStatus | string | Draft, Pending, Approved, Paid, Locked |
| paymentMethod | string | Bank Transfer, PromptPay, Cash |
| note | string | Additional notes |
| locked | boolean | Explicit lock flag |

### Net Pay Calculation

```
netPay = baseSalary + allowance + overtime + bonus + expenseReimbursement - deduction - tax - socialSecurity
```

## Protection / Locked Rules

1. **employeeId** - Always read-only
2. **employeeName** - Always read-only
3. **netPay** - Calculated field, cannot edit directly
4. **Header row** - Always locked
5. **Row with paymentStatus = "Paid"** - All cells locked
6. **Row with paymentStatus = "Locked"** - All cells locked
7. **Row with locked = true** - Cannot edit or delete
8. **Delete** - Only rows with paymentStatus = "Draft" AND locked = false can be deleted

## How to Test Locked Behavior

### Test locked cells:
- Try editing **employeeId** on any row -> should be blocked
- Try editing **employeeName** on any row -> should be blocked
- Try editing **netPay** on any row -> should be blocked
- Try editing **allowance/overtime/bonus** on a Draft row -> should work
- Try editing any cell on a **Paid** row (EMP001) -> should be blocked
- Try editing any cell on a **Locked** row (EMP002, EMP008) -> should be blocked

### Test row operations:
- Try deleting a **Draft** row with locked=false (EMP003, EMP006, EMP009) -> should work
- Try deleting a **Paid** row (EMP001) -> should be blocked
- Try deleting a **Locked** row (EMP002, EMP008) -> should be blocked

### Test batch update:
- Select multiple rows and use "Apply to Selected" panel
- Locked rows/cells should be skipped with count displayed

### Test save payload:
- Make some changes, then click "Save Changes"
- A modal shows the JSON payload with changes and updated rows

## How to Replace Mock Data with Real API

1. Replace `getInitialPayrollData()` in each demo page with API fetch
2. Update `updateCell()` and `deleteRow()` in `src/utils/changeTracking.ts` to call API
3. Replace `SavePayloadModal` with actual API submission
4. Keep protection rules in `src/utils/protectionRules.ts` - these can work with any data source

## Known Limitations

### Univer Sheets
- Heavy bundle size (~5MB gzipped for preset-sheets-core)
- React state sync requires manual "Sync Data" button click
- Permission Control API integration deferred (marked with TODO)
- Complex setup with multiple plugins

### FortuneSheet
- Change detection relies on full sheet data comparison
- Selection API uses global state (window.luckysheet)
- Batch update uses manual row range input (not live selection)
- Documentation is mostly Chinese-language
- TypeScript type coverage is incomplete

### Glide Data Grid
- Peer dependency limited to React 16-18 (requires --legacy-peer-deps)
- No built-in dropdown/autocomplete cells (text-based editing)
- Not a full spreadsheet (no formulas, no multi-sheet)
- Custom cell implementation required for advanced features

## Project Structure

```
src/
  components/         # Shared UI components
    Layout.tsx
    Sidebar.tsx
    PageHeader.tsx
    ProtectionLegend.tsx
    ChangeLogPanel.tsx
    SavePayloadModal.tsx
    ProsConsCard.tsx
    AlertMessage.tsx
    ToolbarCard.tsx
    PayrollSummaryCards.tsx
    BatchUpdatePanel.tsx
  data/
    payrollMock.ts     # Mock payroll data (10 records)
  pages/
    OverviewPage.tsx
    UniverDemoPage.tsx
    FortuneSheetDemoPage.tsx
    GlideDemoPage.tsx
    ComparisonPage.tsx
  types/
    payroll.ts         # TypeScript types and constants
  utils/
    payrollCalculations.ts  # Net pay calculation, formatting
    protectionRules.ts      # Cell/row lock checks
    changeTracking.ts       # Update/delete/batch operations
  App.tsx              # Router setup
  main.tsx             # Entry point
  index.css            # TailwindCSS + custom styles
```
