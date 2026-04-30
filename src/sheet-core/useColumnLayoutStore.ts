/* =========================================================================
   Custom Sheet System - Column Layout Store (Zustand + LocalStorage)
   เก็บ layout ของคอลัมน์ (ความกว้าง, ลำดับ) ลง localStorage
   เพื่อให้ผู้ใช้กลับมาเปิดหน้าใหม่ยังคงเห็น layout เดิม

   การใช้งาน:
   - ต้องกำหนด sheetId ใน SheetConfig เพื่อเป็น key แยก store แต่ละ sheet
   - ถ้าไม่กำหนด sheetId จะไม่เก็บ layout ลง localStorage
   ========================================================================= */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ========== Types ==========

/** Layout ของคอลัมน์เดียว */
export interface ColumnLayout {
  width: number;
}

/** Layout ของ sheet ทั้งหมด (key = colId) */
export type SheetColumnLayouts = Record<string, ColumnLayout>;

/** State ของ store */
interface ColumnLayoutState {
  /** layouts[sheetId][colId] = { width } */
  layouts: Record<string, SheetColumnLayouts>;

  /** บันทึกความกว้างของคอลัมน์ */
  setColumnWidth: (sheetId: string, colId: string, width: number) => void;

  /** บันทึกความกว้างหลายคอลัมน์พร้อมกัน */
  setColumnsWidth: (sheetId: string, widths: Record<string, number>) => void;

  /** ดึง layout ของ sheet */
  getSheetLayout: (sheetId: string) => SheetColumnLayouts;

  /** ดึงความกว้างของคอลัมน์ (return undefined ถ้ายังไม่เคยบันทึก) */
  getColumnWidth: (sheetId: string, colId: string) => number | undefined;

  /** ลบ layout ของ sheet ทั้งหมด (reset เป็นค่าเริ่มต้น) */
  clearSheetLayout: (sheetId: string) => void;

  /** ลบ layout ทุก sheet */
  clearAllLayouts: () => void;
}

// ========== Store ==========

const STORAGE_KEY = 'cs-column-layouts';

export const useColumnLayoutStore = create<ColumnLayoutState>()(
  persist(
    (set, get) => ({
      layouts: {},

      setColumnWidth: (sheetId, colId, width) => {
        set((state) => ({
          layouts: {
            ...state.layouts,
            [sheetId]: {
              ...(state.layouts[sheetId] || {}),
              [colId]: { width },
            },
          },
        }));
      },

      setColumnsWidth: (sheetId, widths) => {
        set((state) => {
          const existing = state.layouts[sheetId] || {};
          const updated = { ...existing };
          for (const [colId, w] of Object.entries(widths)) {
            updated[colId] = { width: w };
          }
          return {
            layouts: {
              ...state.layouts,
              [sheetId]: updated,
            },
          };
        });
      },

      getSheetLayout: (sheetId) => {
        return get().layouts[sheetId] || {};
      },

      getColumnWidth: (sheetId, colId) => {
        return get().layouts[sheetId]?.[colId]?.width;
      },

      clearSheetLayout: (sheetId) => {
        set((state) => {
          const { [sheetId]: _, ...rest } = state.layouts;
          return { layouts: rest };
        });
      },

      clearAllLayouts: () => {
        set({ layouts: {} });
      },
    }),
    {
      name: STORAGE_KEY,
      // เก็บเฉพาะ layouts (ไม่เก็บ functions)
      partialize: (state) => ({ layouts: state.layouts }),
    }
  )
);

// ========== Hook Helper ==========

/**
 * Hook สำหรับใช้ใน component ที่ต้องการเข้าถึง layout ของ sheet เฉพาะ
 * @param sheetId - ID ของ sheet (ถ้า undefined จะไม่เก็บ/อ่าน localStorage)
 */
export function useSheetColumnLayout(sheetId?: string) {
  const store = useColumnLayoutStore();

  return {
    /** ดึง layout ปัจจุบัน */
    getLayout: () => (sheetId ? store.getSheetLayout(sheetId) : {}),

    /** ดึงความกว้างของคอลัมน์ */
    getWidth: (colId: string) =>
      sheetId ? store.getColumnWidth(sheetId, colId) : undefined,

    /** บันทึกความกว้าง */
    setWidth: (colId: string, width: number) => {
      if (sheetId) store.setColumnWidth(sheetId, colId, width);
    },

    /** บันทึกหลายคอลัมน์พร้อมกัน */
    setBulkWidths: (widths: Record<string, number>) => {
      if (sheetId) store.setColumnsWidth(sheetId, widths);
    },

    /** Reset layout ของ sheet นี้ */
    clearLayout: () => {
      if (sheetId) store.clearSheetLayout(sheetId);
    },

    /** มี store หรือไม่ (sheetId ถูกกำหนดหรือเปล่า) */
    isEnabled: !!sheetId,
  };
}
