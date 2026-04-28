import { useState, useCallback, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

import type { PayrollRow, PayrollField, ChangeLogEntry, SavePayload } from '../types/payroll';
import { PAYROLL_FIELDS, FIELD_LABELS } from '../types/payroll';
import { getInitialPayrollData } from '../data/payrollMock';
import { isCellLocked, isRowLocked } from '../utils/protectionRules';
import { formatCurrency } from '../utils/payrollCalculations';
import { updateCell, batchUpdateCells, resetChangeIdCounter } from '../utils/changeTracking';

import PageHeader from '../components/PageHeader';
import PayrollSummaryCards from '../components/PayrollSummaryCards';
import BatchUpdatePanel from '../components/BatchUpdatePanel';
import ProtectionLegend from '../components/ProtectionLegend';
import ChangeLogPanel from '../components/ChangeLogPanel';
import SavePayloadModal from '../components/SavePayloadModal';
import AlertMessage from '../components/AlertMessage';
import ProsConsCard from '../components/ProsConsCard';
import LibraryShowcaseCard from '../components/LibraryShowcaseCard';
import { useChangeLogger } from '../hooks/useChangeLogger';

/**
 * แปลง payroll data เป็น FortuneSheet celldata format
 * FortuneSheet ใช้ celldata array ที่มี { r, c, v } objects
 */
function payrollToSheetData(rows: PayrollRow[]) {
  const celldata: Array<{ r: number; c: number; v: any }> = [];

  // Header row (row 0) - locked เสมอ
  PAYROLL_FIELDS.forEach((field, colIdx) => {
    celldata.push({
      r: 0,
      c: colIdx,
      v: {
        v: FIELD_LABELS[field],
        m: FIELD_LABELS[field],
        ct: { fa: 'General', t: 's' },
        bg: '#1e40af',
        fc: '#ffffff',
        bl: 1, // bold
      },
    });
  });

  // Data rows
  rows.forEach((row, rowIdx) => {
    const dataRowIdx = rowIdx + 1;

    PAYROLL_FIELDS.forEach((field, colIdx) => {
      const value = row[field as keyof PayrollRow];
      const cellLocked = isCellLocked(row, field);

      let displayValue = value;
      let cellType: { fa: string; t: string } = { fa: 'General', t: 's' };

      if (typeof value === 'number') {
        cellType = { fa: '#,##0', t: 'n' };
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      }

      celldata.push({
        r: dataRowIdx,
        c: colIdx,
        v: {
          v: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value,
          m: typeof value === 'number' ? formatCurrency(value) : String(displayValue),
          ct: cellType,
          bg: cellLocked ? '#fffbeb' : undefined,
          fc: cellLocked ? '#92400e' : undefined,
        },
      });
    });
  });

  return [
    {
      name: 'Payroll',
      celldata,
      row: rows.length + 1,
      column: PAYROLL_FIELDS.length,
      order: 0,
      status: 1,
      config: {
        columnlen: PAYROLL_FIELDS.reduce((acc, field, idx) => {
          acc[idx] = field === 'employeeName' ? 180 : field === 'note' ? 160 : 120;
          return acc;
        }, {} as Record<number, number>),
        rowlen: { 0: 36 },
      },
    },
  ];
}

export default function FortuneSheetDemoPage() {
  const [rows, setRows] = useState<PayrollRow[]>(getInitialPayrollData);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; message: string } | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [sheetKey, setSheetKey] = useState(0);

  // Batch update ใช้ manual row range
  const [batchStartRow, setBatchStartRow] = useState(1);
  const [batchEndRow, setBatchEndRow] = useState(1);

  // Hook บันทึก Log การเปลี่ยนแปลงลง Console
  useChangeLogger('FortuneSheet', changeLogs);

  // เก็บ snapshot ของ rows เพื่อเปรียบเทียบเมื่อ sheet เปลี่ยน
  const prevRowsRef = useRef<PayrollRow[]>(rows);
  prevRowsRef.current = rows;

  const sheetData = payrollToSheetData(rows);

  /**
   * ตรวจจับการเปลี่ยนแปลงจาก FortuneSheet
   * - ตรวจสอบ protection rules ก่อน update
   * - ถ้า cell locked -> rollback (re-render sheet)
   * - ถ้า cell ไม่ locked -> update state + add change log
   *
   * สำคัญ: FortuneSheet สามารถลบ row ได้ผ่าน context menu
   * เราป้องกันโดยตรวจสอบจำนวน row ที่เปลี่ยนแปลง
   * ถ้าจำนวน row ลดลง -> แสดงว่า user พยายามลบ row -> rollback ทันที
   */
  const handleCellChange = useCallback(
    (data: any) => {
      if (!data || !data[0]) return;

      const newSheetData = data[0];

      // ป้องกันการลบ row ผ่าน FortuneSheet context menu
      // ถ้าจำนวน row ลดลง แสดงว่า user ลบ row -> rollback
      if (newSheetData.row !== undefined && newSheetData.row < prevRowsRef.current.length + 1) {
        setAlertMsg({
          type: 'error',
          message: 'ไม่สามารถลบ row ผ่าน context menu ได้ - กรุณาใช้ปุ่มลบที่ toolbar แทน (เฉพาะ row Draft + unlocked)',
        });
        setSheetKey((k) => k + 1);
        return;
      }

      if (!newSheetData.celldata) return;

      const celldata = newSheetData.celldata;
      let hasLockedEdit = false;
      let updated = false;
      const newChangeLogs: ChangeLogEntry[] = [];

      for (const cell of celldata) {
        if (cell.r === 0) continue; // ข้าม header

        const rowIdx = cell.r - 1;
        if (rowIdx >= prevRowsRef.current.length || rowIdx < 0) continue;

        const colIdx = cell.c;
        const field = PAYROLL_FIELDS[colIdx];
        if (!field) continue;

        const row = prevRowsRef.current[rowIdx];
        const oldValue = row[field as keyof PayrollRow];
        const newValue = cell.v?.v;
        if (newValue === undefined || newValue === null || newValue === '') {
          // ถ้าถูก clear, ให้ใส่ค่า default ว่างๆ ลงไป
          if (typeof oldValue === 'number') {
             const result = updateCell(prevRowsRef.current, row.employeeId, field, 0);
             if (result.success) {
               prevRowsRef.current = result.rows;
               updated = true;
               if (result.changeLog) newChangeLogs.push(result.changeLog);
             } else {
               hasLockedEdit = true;
             }
          } else if (typeof oldValue === 'boolean') {
             const result = updateCell(prevRowsRef.current, row.employeeId, field, false);
             if (result.success) {
               prevRowsRef.current = result.rows;
               updated = true;
               if (result.changeLog) newChangeLogs.push(result.changeLog);
             } else {
               hasLockedEdit = true;
             }
          } else {
             const result = updateCell(prevRowsRef.current, row.employeeId, field, '');
             if (result.success) {
               prevRowsRef.current = result.rows;
               updated = true;
               if (result.changeLog) newChangeLogs.push(result.changeLog);
             } else {
               hasLockedEdit = true;
             }
          }
          continue;
        }

        // Parse value ตาม type ต้นฉบับ
        let parsedValue: string | number | boolean = newValue;
        if (typeof oldValue === 'number') {
          if (typeof newValue === 'string') {
            parsedValue = Number(newValue.replace(/,/g, ''));
          } else {
            parsedValue = Number(newValue);
          }
          if (isNaN(parsedValue as number)) continue;
        } else if (typeof oldValue === 'boolean') {
          parsedValue = newValue === 'Yes' || newValue === true;
        }

        if (String(parsedValue) === String(oldValue)) continue;

        const result = updateCell(prevRowsRef.current, row.employeeId, field, parsedValue);
        if (result.success) {
          prevRowsRef.current = result.rows;
          updated = true;
          if (result.changeLog) newChangeLogs.push(result.changeLog);
        } else {
          hasLockedEdit = true;
        }
      }

      if (updated || hasLockedEdit) {
        setRows(prevRowsRef.current);
        if (newChangeLogs.length > 0) {
          setChangeLogs((prev) => [...prev, ...newChangeLogs]);
        }
      }

      if (hasLockedEdit) {
        setAlertMsg({
          type: 'error',
          message: 'ไม่สามารถแก้ไข cell ที่ locked ได้ - ค่าจะถูก rollback กลับ',
        });
        setSheetKey((k) => k + 1);
      } else if (updated) {
        setAlertMsg({ type: 'success', message: 'อัพเดทข้อมูลสำเร็จ' });
      }
    },
    []
  );

  // Batch update ใช้ manual row range
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
      setChangeLogs((prev) => [...prev, ...result.changeLogs]);
      setSheetKey((k) => k + 1);
      setAlertMsg({
        type: result.updatedCount > 0 ? 'success' : 'warning',
        message: `Batch update: อัพเดท ${result.updatedCount} รายการ, ข้าม ${result.skippedCount} รายการ (locked)`,
      });
    },
    [rows, batchStartRow, batchEndRow]
  );

  // Reset
  const handleReset = useCallback(() => {
    const freshData = getInitialPayrollData();
    setRows(freshData);
    prevRowsRef.current = freshData;
    setChangeLogs([]);
    resetChangeIdCounter();
    setSheetKey((k) => k + 1);
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
        title="FortuneSheet"
        subtitle="Spreadsheet แบบ Google Sheets - ใช้ @fortune-sheet/react (fork จาก Luckysheet)"
        icon="fa-solid fa-table-list"
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
        description="FortuneSheet เป็น Library ที่สร้างจาก Luckysheet โดยนำมาทำพอร์ตให้เข้ากับ React เป็นสไตล์ Google Sheets ชนิดเบา ทำงานด้วยโครงสร้าง DOM เลียนแบบ Table Grid"
        canDo={[
          "ได้หน้าตาเหมือน Google Sheets ฟรีๆ พร้อมแถบเครื่องมือที่กดเล่นได้อย่างเพลิดเพลิน",
          "แก้ไข Cell ง่ายที่สุดโดยการลบล้างของเดิมออกแล้วพิมพ์ทับ แถมยังมีฟังก์ชันคลุมดำเป็นก้อน Selection ที่จับต้องได้เข้าใจง่ายกว่า Data Grid แบบ Canvas",
          "มี Document Export ฟังก์ชันดีๆ แบบพื้นฐานครบครันสำหรับคนที่อยากประหยัดเวลา"
        ]}
        cannotDo={[
          "ไม่มี API ของ Protection! ถ้าจะทำให้ดึงหรือป้องกัน Cell/Row จริงๆ ต้องใช้วิธี 'จำค่าเดิมไว้ เมื่อถูกเปลี่ยนค่อยเซ็ตกลับกลายเป็นค่าเก่า' (Rollback) ซึ่งทำให้หน้าจอกะพริบแปลกๆ เมื่อ User ลองเปลี่ยนช่องที่ถูกล็อก",
          "React State ผูกยากพอสมควรเนื่องจาก Global Object อยู่ที่ window.luckysheet",
          "ลบ Row หรือ Column สุ่มสี่สุ่มห้าพังได้ง่ายถ้าไม่ได้ดัก Event (ในที่นี้ห้ามใช้ Context Menu ลบ)"
        ]}
      />

      {/* คู่มือการใช้งาน */}

      {/* Alert */}
      {alertMsg && (
        <AlertMessage
          type={alertMsg.type}
          message={alertMsg.message}
          onClose={() => setAlertMsg(null)}
        />
      )}

      <PayrollSummaryCards rows={rows} />

      {/* Batch Update พร้อม row range */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-600"></i>
          อัพเดทช่วง Row (Batch Update)
        </h3>
        <div className="flex items-end gap-3 flex-wrap mb-3">
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Row เริ่มต้น
            </label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Row สิ้นสุด
            </label>
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

      {/* Spreadsheet */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="fortune-sheet-container" key={sheetKey}>
          <Workbook data={sheetData} onChange={handleCellChange} />
        </div>
      </div>

      {/* หมายเหตุ */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
        <strong>หมายเหตุ:</strong> FortuneSheet ใช้ API selection ผ่าน global state (window.luckysheet)
        ใน demo นี้ batch update ใช้ input Start/End Row แทน
        ห้ามลบ row ผ่าน context menu ของ FortuneSheet เพราะ demo จะ rollback ข้อมูลกลับ
        {/* TODO: Production ควร integrate กับ window.luckysheet.getRange() */}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProtectionLegend />
        <ChangeLogPanel
          logs={changeLogs}
          onClear={() => setChangeLogs([])}
        />
      </div>

      {/* ข้อดี / ข้อเสีย */}
      <ProsConsCard
        pros={[
          'UX คุ้นเคยที่สุด - หน้าตาและพฤติกรรมเหมือน Google Sheets เกือบ 1:1',
          'มี toolbar formatting built-in (bold, italic, สี, borders, font)',
          'รองรับ multi-cell selection และ range operations แบบ native',
          'รองรับ multiple sheets (tabs) ได้ทันที',
          'มี cell formatting ครบ (bold, colors, borders, merge cells)',
          'Setup ง่าย import แค่ Workbook component เดียว',
          'เหมาะสำหรับ prototype ที่ต้องการ UX spreadsheet อย่างรวดเร็ว',
        ]}
        cons={[
          'Document น้อยและส่วนใหญ่เป็นภาษาจีน - หาตัวอย่างยาก',
          'Selection API ต้องเรียกผ่าน global state (window.luckysheet) ซึ่งไม่ React-friendly',
          'การตรวจจับ change ต้องเปรียบเทียบ data ทั้ง sheet ซึ่งไม่ efficient',
          'Protection/locking ต้อง implement เองผ่าน onChange rollback',
          'Performance อาจลดลงกับ dataset ใหญ่มาก (10,000+ rows)',
          'TypeScript types ไม่ครอบคลุมบาง API',
          'ห้ามลบ row ผ่าน context menu ได้โดยไม่ผ่าน protection check ถ้าไม่ rollback',
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
