import { useEffect, useRef } from 'react';
import type { ChangeLogEntry } from '../types/payroll';

/**
 * Hook สำหรับตรวจจับการเปลี่ยนแปลงและพิมพ์ Log ลงใน Console เพื่อการ Debug 
 * รวมถังทำ Highlight ช่วยให้นักพัฒนาเห็นชัดเจนเมื่อมีการแก้ไข หรือ Batch Update
 */
export function useChangeLogger(libraryName: string, changeLogs: ChangeLogEntry[]) {
  const previousLengthStr = useRef(0);

  useEffect(() => {
    if (changeLogs.length === 0) return;

    if (changeLogs.length > previousLengthStr.current) {
      // มี Log ล่าสุดเพิ่มเข้ามา
      const newLogs = changeLogs.slice(previousLengthStr.current);
      
      console.group(`📘 [${libraryName}] มีการ Update ข้อมูลใหม่ (${newLogs.length} รายการ)`);
      
      newLogs.forEach(log => {
        if (log.action === 'update') {
          console.log(
            `%c[EDIT]%c รหัส %c${log.employeeId}%c 필ด์ %c${log.field}%c 변경: %c${log.oldValue}%c -> %c${log.newValue}`,
            'color: #0284c7; font-weight: bold;', 
            'color: inherit;',
            'color: #ef4444; font-weight: bold;',
            'color: inherit;',
            'color: #f59e0b; font-weight: bold;',
            'color: inherit;',
            'color: #64748b; text-decoration: line-through;',
            'color: inherit;',
            'color: #10b981; font-weight: bold;'
          );
        } else if (log.action === 'delete') {
          console.log(
            `%c[DELETE]%c รายการรหัส %c${log.employeeId}%c ถูกลบออกจากระบบ`,
            'color: #e11d48; font-weight: bold;',
            'color: inherit;',
            'color: #ef4444; font-weight: bold;',
            'color: inherit;'
          );
        }
      });
      
      console.groupEnd();
      previousLengthStr.current = changeLogs.length;
    } else if (changeLogs.length === 0) {
      // Clear logs
      previousLengthStr.current = 0;
    }
  }, [changeLogs, libraryName]);
}
