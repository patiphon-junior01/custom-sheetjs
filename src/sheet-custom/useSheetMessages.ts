import { useEffect, useRef } from "react";
import { message } from "antd";
import type { UseSheetEngineReturn } from "../sheet-core";

export function useSheetMessages(
  engine: UseSheetEngineReturn,
  enableMessages: boolean,
) {
  const [messageApi, contextHolder] = message.useMessage();
  const lastEmittedLogIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enableMessages) return;
    const logs = engine.actionLogs;

    // เอาเฉพาะ action ล่าสุด
    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

    // ข้ามถ้าไม่มี log ใหม่ หรือเป็น log ที่เคยแจ้งไปแล้ว
    if (!lastLog || lastLog.id === lastEmittedLogIdRef.current) return;
    lastEmittedLogIdRef.current = lastLog.id;

    // Action ที่ไม่ต้องแจ้งเตือน
    const silentActions = [
      "selection-changed",
      "sort-changed",
      "column-resized",
      "cell-edited",
    ];
    if (silentActions.includes(lastLog.type)) return;

    // แสดง message ตามประเภท action
    const messageMap: Record<
      string,
      { text: string; type: "success" | "info" | "warning" }
    > = {
      save: { text: "บันทึกข้อมูลสำเร็จ", type: "success" },
      "row-inserted": { text: "เพิ่มแถวสำเร็จ", type: "success" },
      "row-deleted": { text: "ลบแถวสำเร็จ", type: "success" },
      "row-moved": { text: "ย้ายแถวสำเร็จ", type: "info" },
      "column-inserted": { text: "เพิ่มคอลัมน์สำเร็จ", type: "success" },
      "column-deleted": { text: "ลบคอลัมน์สำเร็จ", type: "success" },
      "column-renamed": { text: "เปลี่ยนชื่อคอลัมน์สำเร็จ", type: "success" },
      "column-moved": { text: "ย้ายคอลัมน์สำเร็จ", type: "info" },
      "column-props-updated": { text: "อัปเดตคอลัมน์สำเร็จ", type: "info" },
      "bulk-edit": { text: "แก้ไขข้อมูลหลายเซลล์สำเร็จ", type: "success" },
      "cell-cleared": { text: "ล้างข้อมูลสำเร็จ", type: "info" },
      undo: { text: "ย้อนกลับสำเร็จ", type: "info" },
      redo: { text: "ทำซ้ำสำเร็จ", type: "info" },
      "comment-added": { text: "เพิ่มคอมเมนต์สำเร็จ", type: "success" },
      "comment-updated": { text: "แก้ไขคอมเมนต์สำเร็จ", type: "success" },
      "comment-deleted": { text: "ลบคอมเมนต์สำเร็จ", type: "success" },
    };

    const mapped = messageMap[lastLog.type];
    if (mapped) {
      messageApi[mapped.type](mapped.text);
    }
  }, [engine.actionLogs, enableMessages, messageApi]);

  return { contextHolder };
}
