import { useState, useCallback, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';

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

// Register Handsontable's modules
registerAllModules();

export default function HandsontableDemoPage() {
  const [rows, setRows] = useState<PayrollRow[]>(getInitialPayrollData);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; message: string } | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  
  const hotRef = useRef<HotTable>(null);

  // Hook บันทึก Log
  useChangeLogger('Handsontable', changeLogs);

  // Setup Handsontable columns configuration
  const columns = PAYROLL_FIELDS.map((field) => {
    let type = 'text';
    let source: string[] | undefined;
    let numericFormat: any;

    if (['baseSalary', 'allowance', 'overtime', 'bonus', 'expenseReimbursement', 'deductionTax', 'deductionSocial', 'netPay'].includes(field)) {
      type = 'numeric';
      numericFormat = { pattern: '0,0' };
    } else if (field === 'paymentStatus') {
      type = 'dropdown';
      source = [...PAYMENT_STATUS_OPTIONS];
    } else if (field === 'paymentMethod') {
      type = 'dropdown';
      source = [...PAYMENT_METHOD_OPTIONS];
    } else if (field === 'locked') {
      type = 'checkbox';
    }

    return {
      data: field,
      title: FIELD_LABELS[field],
      type,
      source,
      numericFormat,
      width: field === 'employeeName' ? 180 : field === 'note' ? 160 : field === 'employeeId' ? 100 : 120,
    };
  });

  // cells function สำหรับกำหนด readOnly และ renderer
  const cellsFunction = function(this: any, row: number, col: number, prop: string) {
    const cellProperties: any = {};
    if (row >= rows.length) return cellProperties;

    const rowData = rows[row];
    const field = prop as PayrollField;
    const locked = isCellLocked(rowData, field);

    if (locked) {
      cellProperties.readOnly = true;
      cellProperties.className = 'htLocked';
    }

    return cellProperties;
  };

  /**
   * Handle changes from Handsontable
   */
  const handleAfterChange = useCallback((changes: any[] | null, source: string) => {
    // Ignore changes caused by loadData to prevent looping
    if (!changes || source === 'loadData') return;

    let updatedRows = [...rows];
    const newLogs: ChangeLogEntry[] = [];
    let hasError = false;

    for (const [rowIdx, prop, oldValue, newValue] of changes) {
      if (oldValue === newValue) continue;

      const employeeId = updatedRows[rowIdx]?.employeeId;
      if (!employeeId) continue;

      let parsedValue = newValue;
      const fieldOpts = columns.find((c) => c.data === prop);

      if (fieldOpts?.type === 'numeric') {
        if (typeof newValue === 'string') {
          // ลบลูกน้ำออกก่อนเพื่อการแปลงเป็นตัวเลขที่ถูกต้อง (เช่น '10,000' -> 10000)
          const cleaned = newValue.replace(/,/g, '');
          const num = parseFloat(cleaned);
          parsedValue = isNaN(num) ? 0 : num;
        } else if (typeof newValue === 'number') {
          parsedValue = isNaN(newValue) ? 0 : newValue;
        } else {
          parsedValue = 0;
        }
      }

      const result = updateCell(updatedRows, employeeId, prop as PayrollField, parsedValue);
      if (result.success) {
        updatedRows = result.rows;
        if (result.changeLog) newLogs.push(result.changeLog);
      } else {
        hasError = true;
      }
    }

    if (newLogs.length > 0) {
      setRows(updatedRows);
      setChangeLogs(prev => [...prev, ...newLogs]);
    }

    if (hasError) {
      setAlertMsg({ type: 'error', message: 'บาง Cell ไม่สามารถแก้ไขได้เนื่องจากถูก Lock ไว้' });
    } else if (newLogs.length > 0) {
      setAlertMsg({ type: 'success', message: `อัพเดทข้อมูล ${newLogs.length} รายการ` });
    }
  }, [rows, columns]);

  // Batch Update
  const handleBatchUpdate = useCallback(
    (field: PayrollField, value: string | number) => {
      const hot = (hotRef.current as any)?.hotInstance;
      if (!hot) return;

      const selected = hot.getSelected(); // [[startRow, startCol, endRow, endCol]]
      if (!selected || selected.length === 0) {
        setAlertMsg({ type: 'warning', message: 'กรุณาเลือกตารางส่วนที่จะอัพเดทก่อน' });
        return;
      }

      const selectedRows = new Set<number>();
      selected.forEach(([r1, _, r2]: any) => {
        const start = Math.min(r1, r2);
        const end = Math.max(r1, r2);
        for (let r = start; r <= end; r++) {
          selectedRows.add(r);
        }
      });

      const selectedEmployeeIds = Array.from(selectedRows)
        .filter(i => i < rows.length)
        .map(i => rows[i].employeeId);

      if (selectedEmployeeIds.length === 0) return;

      const result = batchUpdateCells(rows, selectedEmployeeIds, field, value);
      setRows(result.rows);
      setChangeLogs((prev) => [...prev, ...result.changeLogs]);
      setAlertMsg({
        type: result.updatedCount > 0 ? 'success' : 'warning',
        message: `Batch update: อัพเดท ${result.updatedCount} รายการ, ข้าม ${result.skippedCount} รายการ (locked)`,
      });
    },
    [rows]
  );

  // Delete Selected Rows
  const handleDeleteSelected = useCallback(() => {
    const hot = (hotRef.current as any)?.hotInstance;
    if (!hot) return;

    const selected = hot.getSelected();
    if (!selected || selected.length === 0) {
      setAlertMsg({ type: 'warning', message: 'กรุณาเลือก Row ที่ต้องการลบ' });
      return;
    }

    const selectedRows = new Set<number>();
    selected.forEach(([r1, _, r2]: any) => {
      const start = Math.min(r1, r2);
      const end = Math.max(r1, r2);
      for (let r = start; r <= end; r++) {
        selectedRows.add(r);
      }
    });

    const selectedEmployeeIds = Array.from(selectedRows)
      .filter(i => i < rows.length)
      .map(i => rows[i].employeeId);

    const deletableIds = selectedEmployeeIds.filter((id) => {
      const row = rows.find((r) => r.employeeId === id);
      return row && isRowDeletable(row);
    });

    if (deletableIds.length === 0) {
       setAlertMsg({ type: 'error', message: `ลบไม่ได้ - ไม่มี row ที่ลบได้จากการเลือก` });
       return;
    }

    const result = batchDeleteRows(rows, deletableIds);
    setRows(result.rows);
    setChangeLogs((prev) => [...prev, ...result.changeLogs]);
    setAlertMsg({
      type: 'success',
      message: `ลบ ${result.deletedCount} รายการสำเร็จ, ข้าม ${selectedEmployeeIds.length - deletableIds.length} รายการ (locked)`,
    });
  }, [rows]);

  // Reset
  const handleReset = useCallback(() => {
    setRows(getInitialPayrollData());
    setChangeLogs([]);
    resetChangeIdCounter();
    setAlertMsg({ type: 'info', message: 'รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นแล้ว' });
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
        title="Handsontable"
        subtitle="Data Grid ระดับองค์กรที่เปิดกว้างและยืดหยุ่นสูง"
        icon="fa-solid fa-table"
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
        description="Handsontable เป็น Enterprise Data Grid แบบไฮบริด มีความพยายามที่จะดึงประสบการณ์แบบ Excel มาใช้บนหน้าเว็บ (เช่นการลากคลุมจุดแล้วก็อปปี้) บนโครงสร้างรูปแบบ Table Grid ปกติ"
        canDo={[
          "ใช้งาน Copy/Paste แถบตารางแบบลากคลุมจุดขวาล่างได้แบบ Excel ทุกประการ ซึ่งดีงามมาก!",
          "มี Dropdown list และ Format คอลัมน์พิเศษในตัว ไม่ต้องเขียน Canvas วาดเอง",
          "รองรับการ Protect เซลล์ได้ค่อนข้าง 100% ด้วยการเซ็ต readOnly"
        ]}
        cannotDo={[
          "มีหน้าตาแข็งๆ ดั้งเดิมๆ สไตล์ปี 2010 หากหวังให้สวยโมเดิร์นอาจจะต้องเขียน CSS ซ้อนทับเยอะ",
          "ไม่ใช่ Spreadsheet 100% จึงไม่มีหน้าต่าง Sheet Tab ข้างล่าง",
          "Commercial License สำหรับการนำไปทำเงินถือว่าค่อนข้างสูงมาก เมื่อเทียบกับตัวอื่นๆ"
        ]}
      />

      {/* Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <i className="fa-solid fa-circle-info mr-2"></i>
        <strong>วิธีใช้งาน:</strong> ดับเบิลคลิกบน Grid เพื่อแก้ไข, หรือจะ copy & paste ก็นำมาวางในช่องได้เลย 
        ช่องที่เป็น Dropdown จะมีรายการให้เลือก ส่วนช่องที่เป็น Number กรอกเฉพาะตัวเลขมันจะ format เอง
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

      {/* Toolbar */}
      <ToolbarCard>
        <button
          onClick={handleDeleteSelected}
          className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors"
        >
          <i className="fa-solid fa-trash-can mr-1.5"></i>
          ลบ row ที่เลือก (เฉพาะ Draft)
        </button>
        <span className="text-xs text-slate-400">
          ทั้งหมด {rows.length} รายการ
        </span>
      </ToolbarCard>

      <BatchUpdatePanel
        title="อัพเดทหลายรายการพร้อมกัน (Batch Update)"
        selectedCount={0} // Handsontable API handles this internally for exact UI match but we need selection sync
        onApply={handleBatchUpdate}
      />

      <style>{`
        .htLocked {
          background-color: #fffbeb !important;
          color: #92400e !important;
        }
      `}</style>
      
      {/* Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden z-0 relative p-1">
        <HotTable
          ref={hotRef as any}
          data={rows}
          columns={columns}
          cells={cellsFunction as any}
          colHeaders={true}
          rowHeaders={true}
          autoWrapRow={true}
          autoWrapCol={true}
          dropdownMenu={true}
          filters={true}
          contextMenu={['copy', 'cut', 'alignment']}
          afterChange={handleAfterChange}
          licenseKey="non-commercial-and-evaluation"
          height="500"
          width="100%"
          stretchH="all"
        />
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
          'ประสิทธิภาพสูง รองรับข้อมูลจำนวนเยอะด้วย Virtual DOM rendering ภายใน',
          'มี Dropdown, Checkbox และ Format พิเศษ (Numeric, Date) ครบจบไม่ต้องใช้ Custom Cells บ่อย',
          'เอกสารละเอียดสุดๆ + Community ขนาดใหญ่สุดในบรรดา Data Grid',
          'รองรับการ Copy/Paste ระดับเทพ สามารถลากจาก Excel มาวางได้เลย',
          'Set readOnly ผ่าน cells function ได้ง่าย ปกป้องได้อย่างมั่นใจ',
        ]}
        cons={[
          'Commercial license แพงมาก สำหรับการใช้เชิงพาณิชย์',
          'มีสไตล์ที่ล้าสมัยเล็กน้อย (Classic 2010s Look) ถ้าไม่แต่ง CSS เพิ่ม',
          'React Wrapper แค่ครอบ DOM ปกติไว้ บางครั้งอาจทำให้ State หลุด Sync ได้ถ้าแก้ไข data property ตรงๆ',
          'ไม่ใช่ Spreadsheet (ไม่มี tab แผ่นงาน)',
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
