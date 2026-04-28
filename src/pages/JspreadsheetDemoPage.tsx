import { useState, useCallback, useRef, useEffect } from 'react';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';

// jspreadsheet-ce เป็น UMD module ต้อง import แบบนี้เพื่อให้ Vite จัดการ interop ถูกต้อง
// @ts-ignore
import jspreadsheetModule from 'jspreadsheet-ce';
const jspreadsheet: any = (jspreadsheetModule as any).default || jspreadsheetModule;

import type { PayrollRow, PayrollField, ChangeLogEntry, SavePayload } from '../types/payroll';
import { PAYROLL_FIELDS, FIELD_LABELS, PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../types/payroll';
import { getInitialPayrollData } from '../data/payrollMock';
import { isCellLocked, isRowDeletable } from '../utils/protectionRules';
import { formatCurrency } from '../utils/payrollCalculations';
import { updateCell, batchUpdateCells, batchDeleteRows, resetChangeIdCounter } from '../utils/changeTracking';

import PageHeader from '../components/PageHeader';
import PayrollSummaryCards from '../components/PayrollSummaryCards';
import ToolbarCard from '../components/ToolbarCard';
import BatchUpdatePanel from '../components/BatchUpdatePanel';
import ProtectionLegend from '../components/ProtectionLegend';
import ChangeLogPanel from '../components/ChangeLogPanel';
import SavePayloadModal from '../components/SavePayloadModal';
import AlertMessage from '../components/AlertMessage';
import ProsConsCard from '../components/ProsConsCard';
import LibraryShowcaseCard from '../components/LibraryShowcaseCard';
import { useChangeLogger } from '../hooks/useChangeLogger';

/**
 * แปลง PayrollRow[] เป็น 2D Array สำหรับ jspreadsheet
 */
function rowsToData(rows: PayrollRow[]): any[][] {
  return rows.map((row) =>
    PAYROLL_FIELDS.map((field) => {
      const val = row[field as keyof PayrollRow];
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return val;
    })
  );
}

/**
 * สร้าง jspreadsheet column config จาก PAYROLL_FIELDS
 */
function buildColumns() {
  return PAYROLL_FIELDS.map((field) => {
    const base: any = {
      title: FIELD_LABELS[field],
      width: field === 'employeeName' ? 180 : field === 'note' ? 160 : field === 'employeeId' ? 100 : 120,
      name: field,
    };

    if (['baseSalary', 'allowance', 'overtime', 'bonus', 'expenseReimbursement', 'deductionTax', 'deductionSocial', 'netPay'].includes(field)) {
      base.type = 'numeric';
      base.mask = '#,##0';
    } else if (field === 'paymentStatus') {
      base.type = 'dropdown';
      base.source = [...PAYMENT_STATUS_OPTIONS];
    } else if (field === 'paymentMethod') {
      base.type = 'dropdown';
      base.source = [...PAYMENT_METHOD_OPTIONS];
    } else if (field === 'locked') {
      base.type = 'checkbox';
      base.readOnly = true;
    } else {
      base.type = 'text';
    }

    return base;
  });
}

export default function JspreadsheetDemoPage() {
  const [rows, setRows] = useState<PayrollRow[]>(getInitialPayrollData);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; message: string } | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);

  // Batch update
  const [batchStartRow, setBatchStartRow] = useState(1);
  const [batchEndRow, setBatchEndRow] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const jssRef = useRef<any>(null);
  const rowsRef = useRef<PayrollRow[]>(rows);
  rowsRef.current = rows;

  // Hook บันทึก Log
  useChangeLogger('Jspreadsheet CE', changeLogs);

  // Initialize jspreadsheet
  useEffect(() => {
    if (!containerRef.current) return;

    // ล้างเนื้อหาเดิมก่อน (สำหรับ React StrictMode)
    containerRef.current.innerHTML = '';

    const data = rowsToData(rowsRef.current);
    const columns = buildColumns();

    // jspreadsheet-ce v5 ใช้ worksheets config
    jspreadsheet(containerRef.current, {
      tabs: false,
      worksheets: [{
        data,
        columns,
        minDimensions: [PAYROLL_FIELDS.length, 0],
        tableOverflow: true,
        tableWidth: '100%',
        tableHeight: '500px',
        defaultColWidth: 120,
        allowInsertRow: false,
        allowInsertColumn: false,
        allowDeleteRow: false,
        allowDeleteColumn: false,
        allowManualInsertRow: false,
        allowManualInsertColumn: false,
        columnSorting: false,
        // ตั้ง event handler สำหรับเปลี่ยนแปลงค่า
        onchange: (_worksheet: any, cell: any, x: number, y: number, value: any) => {
          handleCellChange(Number(x), Number(y), value);
        },
        // ตั้ง event handler สำหรับ beforeChange เพื่อป้องกัน locked cells
        onbeforechange: (_worksheet: any, cell: any, x: number, y: number, value: any) => {
          const currentRows = rowsRef.current;
          const xNum = Number(x);
          const yNum = Number(y);
          if (yNum >= currentRows.length) return value;
          const row = currentRows[yNum];
          const field = PAYROLL_FIELDS[xNum];
          if (isCellLocked(row, field)) {
            setAlertMsg({ type: 'error', message: `ไม่สามารถแก้ไข "${FIELD_LABELS[field]}" ของ ${row.employeeName} ได้ (ถูก Lock)` });
            return false;
          }
          return value;
        },
      }],
    });

    // เก็บ reference ไปที่ worksheet instance
    // jspreadsheet-ce v5 เก็บ spreadsheet object ที่ el.spreadsheet
    const getWorksheet = () => {
      const ss = (containerRef.current as any)?.spreadsheet;
      if (ss && ss.worksheets && ss.worksheets[0]) {
        return ss.worksheets[0];
      }
      return null;
    };

    // รอ async init เสร็จแล้วค่อยเก็บ ref + apply styles
    const checkReady = setInterval(() => {
      const ws = getWorksheet();
      if (ws) {
        jssRef.current = ws;
        clearInterval(checkReady);
        applyLockedStyles(containerRef.current, rowsRef.current);
      }
    }, 100);

    // หยุดรอหลัง 3 วินาที
    setTimeout(() => clearInterval(checkReady), 3000);

    return () => {
      clearInterval(checkReady);
      try {
        jspreadsheet.destroy(containerRef.current, true);
      } catch {
        // Ignore destroy errors
      }
      jssRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ทาสีพื้นหลัง locked cells ผ่าน DOM API
   */
  function applyLockedStyles(container: any, currentRows: PayrollRow[]) {
    if (!container) return;
    try {
      const tbody = container.querySelector('tbody');
      if (!tbody) return;
      const trs = tbody.querySelectorAll('tr');
      currentRows.forEach((row, rowIdx) => {
        if (!trs[rowIdx]) return;
        const tds = trs[rowIdx].querySelectorAll('td');
        PAYROLL_FIELDS.forEach((field, colIdx) => {
          // td[0] คือ row number ดังนั้น data columns เริ่มที่ index 1
          const td = tds[colIdx + 1];
          if (!td) return;
          if (isCellLocked(row, field)) {
            td.style.backgroundColor = '#fffbeb';
            td.style.color = '#92400e';
          }
        });
      });
    } catch {
      // fallback
    }
  }

  /**
   * Handle cell change จาก jspreadsheet
   */
  const handleCellChange = useCallback((colIdx: number, rowIdx: number, value: any) => {
    const currentRows = rowsRef.current;
    if (rowIdx >= currentRows.length) return;

    const row = currentRows[rowIdx];
    const field = PAYROLL_FIELDS[colIdx];
    if (!field) return;

    // Parse value ตาม type เดิม
    const oldValue = row[field as keyof PayrollRow];
    let parsedValue: string | number | boolean = value;

    if (typeof oldValue === 'number') {
      if (typeof value === 'string') {
        parsedValue = Number(value.replace(/,/g, ''));
      } else {
        parsedValue = Number(value);
      }
      if (isNaN(parsedValue as number)) parsedValue = 0;
    } else if (typeof oldValue === 'boolean') {
      parsedValue = value === 'Yes' || value === true || value === 'true';
    }

    if (String(parsedValue) === String(oldValue)) return;

    const result = updateCell(currentRows, row.employeeId, field, parsedValue);
    if (result.success) {
      setRows(result.rows);
      rowsRef.current = result.rows;
      if (result.changeLog) {
        setChangeLogs((prev) => [...prev, result.changeLog!]);
      }
      setAlertMsg({ type: 'success', message: `แก้ไข ${FIELD_LABELS[field]} ของ ${row.employeeName} สำเร็จ` });

      // อัปเดต netPay ใน grid ถ้าจำเป็น
      if (['baseSalary', 'allowance', 'overtime', 'bonus', 'expenseReimbursement', 'deductionTax', 'deductionSocial'].includes(field)) {
        const netPayColIdx = PAYROLL_FIELDS.indexOf('netPay');
        const updatedRow = result.rows.find((r) => r.employeeId === row.employeeId);
        if (updatedRow && jssRef.current) {
          jssRef.current.setValueFromCoords(netPayColIdx, rowIdx, updatedRow.netPay, true);
        }
      }
    }
  }, []);

  // Batch update
  const handleBatchUpdate = useCallback(
    (field: PayrollField, value: string | number) => {
      const start = Math.max(0, batchStartRow - 1);
      const end = Math.min(rows.length - 1, batchEndRow - 1);
      if (start > end) {
        setAlertMsg({ type: 'warning', message: 'ช่วง row ไม่ถูกต้อง' });
        return;
      }
      const employeeIds = rows.slice(start, end + 1).map((r) => r.employeeId);
      const result = batchUpdateCells(rows, employeeIds, field, value);
      setRows(result.rows);
      rowsRef.current = result.rows;
      setChangeLogs((prev) => [...prev, ...result.changeLogs]);
      setAlertMsg({
        type: result.updatedCount > 0 ? 'success' : 'warning',
        message: `Batch update: อัพเดท ${result.updatedCount} รายการ, ข้าม ${result.skippedCount} รายการ (locked)`,
      });

      // Sync grid data
      if (jssRef.current) {
        const newData = rowsToData(result.rows);
        jssRef.current.setData(newData);
        setTimeout(() => applyLockedStyles(containerRef.current, result.rows), 50);
      }
    },
    [rows, batchStartRow, batchEndRow]
  );

  // Delete Selected Rows (ใช้ manual row range)
  const handleDeleteRows = useCallback(() => {
    const start = Math.max(0, batchStartRow - 1);
    const end = Math.min(rows.length - 1, batchEndRow - 1);
    if (start > end) {
      setAlertMsg({ type: 'warning', message: 'ช่วง row ไม่ถูกต้อง' });
      return;
    }

    const selectedEmployeeIds = rows.slice(start, end + 1).map((r) => r.employeeId);
    const deletableIds = selectedEmployeeIds.filter((id) => {
      const row = rows.find((r) => r.employeeId === id);
      return row && isRowDeletable(row);
    });

    if (deletableIds.length === 0) {
      setAlertMsg({ type: 'error', message: 'ลบไม่ได้ - ไม่มี row ที่ลบได้จากช่วงที่เลือก (อาจถูก lock หรือไม่ใช่ Draft)' });
      return;
    }

    const result = batchDeleteRows(rows, deletableIds);
    setRows(result.rows);
    rowsRef.current = result.rows;
    setChangeLogs((prev) => [...prev, ...result.changeLogs]);
    setAlertMsg({
      type: 'success',
      message: `ลบ ${result.deletedCount} รายการสำเร็จ, ข้าม ${selectedEmployeeIds.length - deletableIds.length} รายการ (locked)`,
    });

    // Sync grid
    if (jssRef.current) {
      const newData = rowsToData(result.rows);
      jssRef.current.setData(newData);
      setTimeout(() => applyLockedStyles(containerRef.current, result.rows), 50);
    }
  }, [rows, batchStartRow, batchEndRow]);

  // Reset
  const handleReset = useCallback(() => {
    const freshData = getInitialPayrollData();
    setRows(freshData);
    rowsRef.current = freshData;
    setChangeLogs([]);
    resetChangeIdCounter();
    setAlertMsg({ type: 'info', message: 'รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นแล้ว' });

    if (jssRef.current) {
      const newData = rowsToData(freshData);
      jssRef.current.setData(newData);
      setTimeout(() => applyLockedStyles(containerRef.current, freshData), 50);
    }
  }, []);

  // Save
  const handleSave = useCallback(() => {
    const changedIds = new Set(changeLogs.filter((l) => l.action === 'update').map((l) => l.employeeId));
    const updatedRows = rows.filter((r) => changedIds.has(r.employeeId));
    setSavePayload({
      changes: changeLogs,
      updatedRows,
      submittedAt: new Date().toISOString(),
    });
  }, [changeLogs, rows]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Jspreadsheet CE"
        subtitle="Spreadsheet แบบเบาๆ ฟรี MIT License - ใช้ jspreadsheet-ce (Community Edition)"
        icon="fa-solid fa-table-cells"
      >
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <i className="fa-solid fa-rotate-right mr-1.5"></i>
          รีเซ็ต
        </button>
        <button
          onClick={handleSave}
          disabled={changeLogs.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          <i className="fa-solid fa-floppy-disk mr-1.5"></i>
          บันทึกการเปลี่ยนแปลง
        </button>
      </PageHeader>

      <LibraryShowcaseCard
        description="Jspreadsheet CE เป็น Library Spreadsheet แนว Lightweight ที่ฟรี 100% (MIT License) เหมาะกับโปรเจกต์ที่ต้องการตาราง Spreadsheet ง่ายๆ ที่แก้ไขได้ โดยไม่ต้องเสียค่า License ใดๆ"
        canDo={[
          "แก้ไข Cell ง่ายมาก แค่คลิกแล้วพิมพ์เลย รวมถึงมี Dropdown ในตัว",
          "ฟรี 100% MIT License ใช้ได้ทั้งเชิงพาณิชย์และส่วนตัว",
          "มี onbeforechange event สำหรับป้องกัน Cell ที่ locked ไม่ให้แก้ไขได้อย่างแท้จริง (ไม่มี Rollback Flicker)",
          "ขนาดเล็กมาก Bundle Size ไม่หนัก โหลดเร็ว",
        ]}
        cannotDo={[
          "ไม่มีระบบ Formula ซับซ้อน (CE version ไม่มี advanced formulas)",
          "ไม่มี Multiple Sheet Tabs",
          "Document อาจจะไม่ครอบคลุมเท่า Handsontable และบาง Feature มีเฉพาะใน Pro",
          "TypeScript types ไม่มีอย่างเป็นทางการ ต้องใช้ @ts-ignore",
        ]}
      />

      {/* Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <i className="fa-solid fa-circle-info mr-2"></i>
        <strong>วิธีใช้งาน:</strong> คลิกที่ Cell เพื่อแก้ไขโดยตรง
        ช่อง Dropdown จะมีรายการให้เลือก
        ช่องที่มีพื้นหลังสีเหลืองคือช่องที่ locked ไม่สามารถแก้ไขได้ (ระบบจะบล็อกก่อนที่จะเปลี่ยนค่า)
      </div>

      {/* Alert */}
      {alertMsg && (
        <AlertMessage
          type={alertMsg.type}
          message={alertMsg.message}
          onClose={() => setAlertMsg(null)}
        />
      )}

      <PayrollSummaryCards rows={rows} />

      {/* Toolbar: Delete + Row range */}
      <ToolbarCard>
        <button
          onClick={handleDeleteRows}
          className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors"
        >
          <i className="fa-solid fa-trash-can mr-1.5"></i>
          ลบ row ช่วงที่เลือก (เฉพาะ Draft)
        </button>
        <span className="text-xs text-slate-400">
          ทั้งหมด {rows.length} รายการ
        </span>
      </ToolbarCard>

      {/* Batch Update พร้อม row range */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-600"></i>
          อัพเดทช่วง Row (Batch Update)
        </h3>
        <div className="flex items-end gap-3 flex-wrap mb-3">
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Row เริ่มต้น</label>
            <input
              type="number"
              min={1}
              max={rows.length}
              value={batchStartRow}
              onChange={(e) => setBatchStartRow(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Row สิ้นสุด</label>
            <input
              type="number"
              min={1}
              max={rows.length}
              value={batchEndRow}
              onChange={(e) => setBatchEndRow(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-400 self-end pb-2">
            ช่วง row: 1 ถึง {rows.length}
          </p>
        </div>
        <BatchUpdatePanel
          title=""
          selectedCount={Math.max(0, batchEndRow - batchStartRow + 1)}
          onApply={handleBatchUpdate}
        />
      </div>

      {/* Spreadsheet Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-1">
        <div ref={containerRef} />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProtectionLegend />
        <ChangeLogPanel
          logs={changeLogs}
          onClear={() => setChangeLogs([])}
        />
      </div>

      {/* Pros Cons */}
      <ProsConsCard
        pros={[
          'ฟรี 100% MIT License ไม่มีค่าใช้จ่ายใดๆ ใช้เชิงพาณิชย์ได้เลย',
          'ขนาดเล็กมาก Bundle size ~50KB ไม่หนักเลย',
          'แก้ไข Cell ง่ายมาก คลิกแล้วพิมพ์ได้ทันที',
          'มี Dropdown, Checkbox, Calendar, Numeric types ในตัว',
          'มี onbeforechange event สำหรับป้องกัน Cell ที่ locked ไม่ให้เปลี่ยนค่า (Native protection)',
          'Setup ง่ายมาก import แค่ตัวเดียว + CSS 2 ไฟล์',
        ]}
        cons={[
          'CE version ไม่มีระบบ Formula ขั้นสูง (ต้อง Pro)',
          'ไม่มี Multiple Sheet Tabs (ต้อง Pro)',
          'Document ไม่ครอบคลุมเท่า Handsontable',
          'ไม่มี TypeScript types อย่างเป็นทางการ ต้อง @ts-ignore',
          'React Wrapper ไม่มีใน CE ต้อง mount ด้วย useRef + useEffect เอง',
          'Copy/Paste จาก Excel ทำได้แต่ไม่ดีเท่า Handsontable',
        ]}
      />

      {/* Save Modal */}
      <SavePayloadModal
        payload={savePayload}
        onClose={() => setSavePayload(null)}
      />
    </div>
  );
}
