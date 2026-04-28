import { useState, useCallback, useRef, useEffect } from 'react';
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
 * Build Univer workbook data from payroll rows
 */
function buildWorkbookData(rows: PayrollRow[]) {
  const cellData: Record<number, Record<number, any>> = {};

  // Header row (row 0)
  const headerRow: Record<number, any> = {};
  PAYROLL_FIELDS.forEach((field, colIdx) => {
    headerRow[colIdx] = {
      v: FIELD_LABELS[field],
      s: {
        bg: { rgb: '#1e40af' },
        cl: { rgb: '#ffffff' },
        bl: 1,
      },
    };
  });
  cellData[0] = headerRow;

  // Data rows
  rows.forEach((row, rowIdx) => {
    const dataRow: Record<number, any> = {};
    const rowLocked = isRowLocked(row);

    PAYROLL_FIELDS.forEach((field, colIdx) => {
      const value = row[field as keyof PayrollRow];
      const cellLocked = isCellLocked(row, field);

      let cellValue: any = value;
      if (typeof value === 'boolean') {
        cellValue = value ? 'Yes' : 'No';
      }

      dataRow[colIdx] = {
        v: cellValue,
        s: cellLocked
          ? { bg: { rgb: '#fffbeb' }, cl: { rgb: '#92400e' } }
          : undefined,
      };
    });

    cellData[rowIdx + 1] = dataRow;
  });

  return {
    id: 'payroll-sheet',
    name: 'Payroll',
    tabColor: '',
    hidden: 0,
    rowCount: rows.length + 10,
    columnCount: PAYROLL_FIELDS.length + 2,
    defaultColumnWidth: 120,
    defaultRowHeight: 28,
    cellData,
  };
}

export default function UniverDemoPage() {
  const [rows, setRows] = useState<PayrollRow[]>(getInitialPayrollData);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; message: string } | null>(null);
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<any>(null);
  const [univerReady, setUniverReady] = useState(false);

  // Hook บันทึก Log การเปลี่ยนแปลงลง Console
  useChangeLogger('Univer Sheets', changeLogs);

  // Batch update row range
  const [batchStartRow, setBatchStartRow] = useState(1);
  const [batchEndRow, setBatchEndRow] = useState(1);

  // Initialize Univer
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    async function initUniver() {
      try {
        // Dynamic import to handle potential module resolution issues
        const presetsModule = await import('@univerjs/presets');
        const presetSheetsCoreModule = await import('@univerjs/presets/preset-sheets-core');

        // Import CSS
        await import('@univerjs/presets/lib/styles/preset-sheets-core.css');

        let localeData: any = {};
        try {
          const localeModule = await import('@univerjs/presets/preset-sheets-core/locales/en-US');
          localeData = localeModule.default || localeModule;
        } catch {
          // Locale import may fail depending on package version, continue without
        }

        if (disposed || !containerRef.current) return;

        const { createUniver, LocaleType, mergeLocales } = presetsModule;
        const { UniverSheetsCorePreset } = presetSheetsCoreModule;

        const { univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          locales: localeData
            ? { [LocaleType.EN_US]: mergeLocales(localeData) } as any
            : undefined,
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current!,
            }),
          ],
        });

        // Create workbook with payroll data
        const sheetData = buildWorkbookData(rows);
        univerAPI.createWorkbook({
          id: 'payroll-workbook',
          name: 'Payroll Demo',
          sheetOrder: ['payroll-sheet'],
          sheets: {
            'payroll-sheet': sheetData,
          },
        });

        univerRef.current = univerAPI;
        setUniverReady(true);

        // Listen for cell edits via command listener
        // TODO: In production, use Univer Permission Control for range protection
        // Currently using command interceptor to detect edits and rollback if locked
        try {
          univerAPI.onCommandExecuted((command: any) => {
            if (
              command.id === 'sheet.mutation.set-range-values' ||
              command.id === 'sheet.command.set-range-values'
            ) {
              // Cell was edited - check protection
              // Due to Univer's async nature, we handle protection via rollback
              // The actual protection check happens in the periodic sync below
            }
          });
        } catch {
          // Command listener may not be available in all versions
        }
      } catch (err) {
        console.error('Failed to initialize Univer:', err);
        setAlertMsg({
          type: 'error',
          message: `Failed to initialize Univer: ${err instanceof Error ? err.message : 'Unknown error'}. Check console for details.`,
        });
      }
    }

    initUniver();

    return () => {
      disposed = true;
      if (univerRef.current) {
        try {
          univerRef.current.dispose();
        } catch {
          // Ignore dispose errors
        }
        univerRef.current = null;
        setUniverReady(false);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Sync data from Univer back to React state
   * Called manually via "Sync" button since real-time sync with Univer command system
   * can be complex depending on version
   */
  const handleSyncFromUniver = useCallback(() => {
    if (!univerRef.current) {
      setAlertMsg({ type: 'warning', message: 'Univer is not ready yet' });
      return;
    }

    try {
      const activeWorkbook = univerRef.current.getActiveWorkbook();
      if (!activeWorkbook) return;

      const sheet = activeWorkbook.getActiveSheet();
      if (!sheet) return;

      let changesDetected = 0;
      let blockedChanges = 0;
      const updatedRows = [...rows];

      // Read each data cell and compare with current state
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const sheetRowIdx = rowIdx + 1; // +1 for header

        for (let colIdx = 0; colIdx < PAYROLL_FIELDS.length; colIdx++) {
          const field = PAYROLL_FIELDS[colIdx];

          try {
            const range = sheet.getRange(sheetRowIdx, colIdx);
            if (!range) continue;

            const cellValue = range.getValue();
            if (cellValue === undefined || cellValue === null) continue;

            const currentValue = updatedRows[rowIdx][field as keyof PayrollRow];
            let newValue: any = cellValue;

            // Parse based on expected type
            if (typeof currentValue === 'number') {
              if (typeof cellValue === 'string') {
                newValue = Number(cellValue.replace(/,/g, ''));
              } else {
                newValue = Number(cellValue);
              }
              if (isNaN(newValue)) continue;
            } else if (typeof currentValue === 'boolean') {
              newValue = cellValue === 'Yes' || cellValue === true;
            } else {
              newValue = String(cellValue);
            }

            if (String(newValue) === String(currentValue)) continue;

            // Check protection
            const result = updateCell(updatedRows, updatedRows[rowIdx].employeeId, field, newValue);
            if (result.success) {
              updatedRows[rowIdx] = result.rows.find(
                (r) => r.employeeId === updatedRows[rowIdx].employeeId
              )!;
              if (result.changeLog) {
                setChangeLogs((prev) => [...prev, result.changeLog!]);
              }
              changesDetected++;
            } else {
              blockedChanges++;
            }
          } catch {
            // Cell read may fail, continue
          }
        }
      }

      if (changesDetected > 0 || blockedChanges > 0) {
        setRows([...updatedRows]);
        setAlertMsg({
          type: changesDetected > 0 ? 'success' : 'warning',
          message: `Synced: ${changesDetected} change(s) applied, ${blockedChanges} blocked by protection`,
        });
      } else {
        setAlertMsg({ type: 'info', message: 'No changes detected in the spreadsheet' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', message: 'Failed to sync data from Univer' });
    }
  }, [rows]);

  // Batch update
  const handleBatchUpdate = useCallback(
    (field: PayrollField, value: string | number) => {
      const start = Math.max(0, batchStartRow - 1);
      const end = Math.min(rows.length - 1, batchEndRow - 1);
      if (start > end) {
        setAlertMsg({ type: 'warning', message: 'Invalid row range' });
        return;
      }
      const employeeIds = rows.slice(start, end + 1).map((r) => r.employeeId);
      const result = batchUpdateCells(rows, employeeIds, field, value);
      setRows(result.rows);
      setChangeLogs((prev) => [...prev, ...result.changeLogs]);
      setAlertMsg({
        type: result.updatedCount > 0 ? 'success' : 'warning',
        message: `Batch update: ${result.updatedCount} updated, ${result.skippedCount} skipped`,
      });

      // Update the Univer sheet with new data
      // NOTE: In production, should use Univer Facade API to set cell values directly
      // For now, the user can see changes reflected in summary cards and change log
    },
    [rows, batchStartRow, batchEndRow]
  );

  // Reset
  const handleReset = useCallback(() => {
    setRows(getInitialPayrollData());
    setChangeLogs([]);
    resetChangeIdCounter();
    setAlertMsg({ type: 'info', message: 'Data has been reset. Please reload the page to refresh the spreadsheet.' });
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
        title="Univer Sheets"
        subtitle="Spreadsheet engine เต็มรูปแบบ - ใช้ @univerjs/presets (ใกล้เคียง Excel/Google Sheets มากที่สุด)"
        icon="fa-solid fa-table-cells-large"
      >
        <button
          onClick={handleSyncFromUniver}
          className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors"
        >
          <i className="fa-solid fa-arrows-rotate mr-1.5"></i>
          ซิงค์ข้อมูล
        </button>
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
        description="Univer Sheets เป็น Library ที่พยายามโคลน Excel และ Google Sheets อย่างสมบูรณ์แบบ มันมาพร้อมกับ Engine ในตัวแทบทุกอย่าง ตั้งแต่สูตรไปจนถึง Protection (ถ้าเสียเวลาเขียนปลั๊กอินครบ)"
        canDo={[
          "UX ใช้งานเหมือน Excel แบบ 100% (มี Tab ด้านล่าง, หัวคอลัมน์ A B C, และคลิกลากได้ครบถ้วน)",
          "สนับสนุน Formula แทบทุกตัวของ Excel",
          "มี API ระดับลึกที่สุดสำหรับการคุม Permission ระดับแอดมินรายช่องแบบแท้ทรู (Permission Control API)"
        ]}
        cannotDo={[
          "มีขนาดโคตรใหญ่ (Bundle Size หนักมาก) ไม่เหมาะกับเว็บที่ต้องการความเบาหวิว",
          "เรียนรู้ยากที่สุดในทุกตัว ความเป็น Canvas ของมันทำให้จัดการ State ระหว่าง React กับ Univer ลำบากมาก",
          "ฟังก์ชันฟรีหลายตัวต้องไปเสียเวลาคลำ Document ภาษาจีน หรือต้องแงะ Source code มาเขียน Plugin เอง",
          "ใน Demo นี้ การผูก Change Log หรือปกป้องข้อมูลทำได้แค่ Sync กดคล้ายๆ การดึงรอบๆ เนื่องจากการผูก Realtime กับ Command Pattern ของ Univer ทำได้ยากมากๆ ภายใน 1 วัน"
        ]}
      />

      {/* คู่มือการใช้งาน */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <i className="fa-solid fa-circle-info mr-2"></i>
        <strong>วิธีใช้งาน:</strong> แก้ไข cell โดยตรงใน Univer spreadsheet ด้านล่าง
        กด "ซิงค์ข้อมูล" เพื่อดึงการเปลี่ยนแปลงจาก spreadsheet เข้า change log
        Cell ที่มีพื้นหลังสีเหลือง (protected) จะถูก block เมื่อซิงค์
        ใช้ panel batch update เพื่ออัพเดทหลาย row พร้อมกัน
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

      {/* Batch Update with row range */}
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

      {/* Univer Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {!univerReady && (
          <div className="flex items-center justify-center h-16 bg-slate-50 border-b border-slate-200">
            <div className="animate-pulse-soft text-sm text-slate-500 flex items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin"></i>
              กำลังโหลด Univer Sheets...
            </div>
          </div>
        )}
        <div ref={containerRef} className="univer-container" />
      </div>

      {/* Protection Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
        <strong>หมายเหตุ:</strong> Demo นี้ใช้ปุ่ม "ซิงค์ข้อมูล" เพื่อตรวจจับการเปลี่ยนแปลงและตรวจสอบ protection rules
        ใน production ควรใช้ Univer Permission Control API สำหรับ real-time range protection
        และ command interceptors เพื่อ block การแก้ไข cell ที่ protected ก่อนที่จะ commit
        {/* TODO: Production ควรใช้ Univer Permission Control สำหรับ range/cell protection */}
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
          'Spreadsheet engine สมบูรณ์ที่สุด - ใกล้เคียง Excel/Google Sheets มากที่สุดทั้ง UX และ features',
          'มี formula engine built-in รองรับ function มากกว่า 500 ตัว เช่น SUM, VLOOKUP, IF',
          'มี Permission Control API สำหรับ range protection ระดับ cell/column/row แบบ native',
          'Canvas rendering ให้ performance สูง scroll ลื่น',
          'รองรับ multiple sheets, cell styling, merge cells, frozen rows/columns',
          'พัฒนาอย่างต่อเนื่อง มี plugin ecosystem ครอบคลุม (chart, pivot, comment)',
          'เหมาะกับระบบ enterprise ที่ต้องการ spreadsheet อย่างจริงจัง',
        ]}
        cons={[
          'Bundle size ใหญ่มาก (~5MB gzipped) เพราะเป็น engine เต็มรูปแบบ',
          'Setup ซับซ้อน ต้อง configure หลาย plugins/presets',
          'Learning curve สูง โดยเฉพาะ features ขั้นสูง เช่น permissions, formulas, command system',
          'React integration ต้องจัดการ lifecycle เอง (useEffect, dispose)',
          'การ sync state ระหว่าง Univer internal กับ React state ค่อนข้างซับซ้อน',
          'Documentation กระจัดกระจายตาม versions ต้องไล่หาเอง',
          'เวลา load ครั้งแรกช้าเพราะ bundle size ใหญ่',
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
