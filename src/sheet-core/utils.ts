/* =========================================================================
   Custom Sheet System - Utility Functions
   ========================================================================= */

import type { CellPosition, SheetRow, SheetColumn, Selection, ColumnTagDefinition, FormulaTemplate } from './types';

/**
 * ตรวจสอบว่า cell อยู่ใน selection หรือไม่
 */
export function isCellInSelection(
  pos: CellPosition,
  selection: Selection
): boolean {
  // ตรวจจาก cells ตรงๆ
  if (selection.cells.some((c) => c.rowId === pos.rowId && c.colId === pos.colId)) {
    return true;
  }

  // ตรวจจาก rows (ถ้า select ทั้งแถว)
  if (selection.rows.includes(pos.rowId)) {
    return true;
  }

  // ตรวจจาก columns (ถ้า select ทั้งคอลัมน์)
  if (selection.columns.includes(pos.colId)) {
    return true;
  }

  return false;
}

/**
 * คำนวณสูตรอิงตามคอลัมน์ใหม่อัตโนมัติ หากคอลัมน์ใดกำหนดโหมดเป็น formula
 */
export function computeRowFormulas(rows: SheetRow[], columns: SheetColumn[]): SheetRow[] {
  // กรองเฉพาะคอลัมน์สูตร + early exit ถ้าไม่มี
  const formulaCols = columns.filter(c =>
    (c.dataType === 'formula' || c.defaultMode === 'formula') && c.formula
  );
  if (formulaCols.length === 0) return rows;

  // Pre-compile regex ครั้งเดียวนอก loop
  const colRegex = /\[([^\]]+)\]/g;

  // 1. สร้าง Dependency Graph และหา Topological Order
  const graph = new Map<string, string[]>(); // colId -> [อ้างอิงไปหาใครบ้าง (edges)]
  const inDegree = new Map<string, number>();
  formulaCols.forEach(c => {
    graph.set(c.id, []);
    inDegree.set(c.id, 0);
  });

  formulaCols.forEach(c => {
    if (!c.formula) return;
    const deps = new Set<string>();
    let match;
    colRegex.lastIndex = 0;
    while ((match = colRegex.exec(c.formula)) !== null) {
      const depId = match[1];
      // เฉพาะ dependencies ที่เป็น formula คอลัมน์เหมือนกัน
      if (formulaCols.some(fc => fc.id === depId)) {
        deps.add(depId);
      }
    }
    deps.forEach(depId => {
      graph.get(depId)?.push(c.id);
      if (inDegree.has(c.id)) {
        inDegree.set(c.id, inDegree.get(c.id)! + 1);
      }
    });
  });

  // 2. Kahn's Algorithm
  const sortedFormulaCols: SheetColumn[] = [];
  const cycleCols = new Set<string>();
  const queue: string[] = [];
  
  inDegree.forEach((degree, colId) => {
    if (degree === 0) queue.push(colId);
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const col = formulaCols.find(c => c.id === currentId);
    if (col) sortedFormulaCols.push(col);

    graph.get(currentId)?.forEach(neighbor => {
      const currentDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, currentDegree);
      if (currentDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // 3. คอลัมน์ที่ In-degree ไม่เป็น 0 คือพวกที่ติด Cycle (หรือดึงค่าจาก Cycle)
  inDegree.forEach((degree, colId) => {
    if (degree > 0) cycleCols.add(colId);
  });

  return rows.map(row => {
    let newRow: SheetRow | null = null;
    
    // สำเนาค่า cells ล่าสุดไว้ใช้ระหว่างการคำนวณ (เพื่อให้อ้างอิงผลลัพธ์ของคอลัมน์สูตรที่คำนวณก่อนหน้าได้ถูกต้อง)
    const currentCells = { ...row.cells };

    // คำนวณตามลำดับ Topological Order
    for (const col of sortedFormulaCols) {
      if (!col.formula) continue;

      colRegex.lastIndex = 0;
      const parsedFormula = col.formula.replace(colRegex, (_match, colId) => {
        const val = currentCells[colId]?.value;
        if (val === undefined || val === null || val === '') return '0';
        return JSON.stringify(val);
      });

      let resultVal: any = '';
      try {
        // eslint-disable-next-line no-new-func
        resultVal = new Function(`return ${parsedFormula}`)();
        if (typeof resultVal === 'number') {
          if (!isFinite(resultVal)) {
            resultVal = '#DIV/0!';
          } else {
            resultVal = parseFloat(resultVal.toFixed(10));
          }
        } else if (resultVal !== null && resultVal !== undefined) {
          resultVal = String(resultVal);
        }
      } catch {
        resultVal = '#ERROR';
      }

      currentCells[col.id] = { ...currentCells[col.id], value: resultVal };
      if (row.cells[col.id]?.value !== resultVal) {
        if (!newRow) newRow = { ...row, cells: { ...row.cells } };
        newRow.cells[col.id] = currentCells[col.id];
      }
    }

    // กำหนดค่า #CYCLE! ให้กับคอลัมน์ที่อ้างอิงกันเป็นวงกลม
    for (const colId of cycleCols) {
      const resultVal = '#CYCLE!';
      if (row.cells[colId]?.value !== resultVal) {
        if (!newRow) newRow = { ...row, cells: { ...row.cells } };
        newRow.cells[colId] = { ...row.cells[colId], value: resultVal };
      }
    }

    return newRow ?? row;
  });
}

/**
 * ขยาย ranges ออกเป็น individual cell positions
 */
export function expandRangesToCells(
  ranges: Selection['ranges'],
  rows: SheetRow[],
  columns: SheetColumn[]
): CellPosition[] {
  const cells: CellPosition[] = [];

  for (const range of ranges) {
    const startRowIdx = rows.findIndex((r) => r.id === range.start.rowId);
    const endRowIdx = rows.findIndex((r) => r.id === range.end.rowId);
    const startColIdx = columns.findIndex((c) => c.id === range.start.colId);
    const endColIdx = columns.findIndex((c) => c.id === range.end.colId);

    if (startRowIdx === -1 || endRowIdx === -1 || startColIdx === -1 || endColIdx === -1) continue;

    const minRow = Math.min(startRowIdx, endRowIdx);
    const maxRow = Math.max(startRowIdx, endRowIdx);
    const minCol = Math.min(startColIdx, endColIdx);
    const maxCol = Math.max(startColIdx, endColIdx);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ rowId: rows[r].id, colId: columns[c].id });
      }
    }
  }

  return cells;
}

/**
 * รวม selection ทุกแบบออกเป็น flat list ของ CellPosition
 */
export function getAllSelectedCells(
  selection: Selection,
  rows: SheetRow[],
  columns: SheetColumn[]
): CellPosition[] {
  const result: CellPosition[] = [...selection.cells];

  // Expand ranges
  result.push(...expandRangesToCells(selection.ranges, rows, columns));

  // Expand row selections
  for (const rowId of selection.rows) {
    for (const col of columns) {
      result.push({ rowId, colId: col.id });
    }
  }

  // Expand column selections
  for (const colId of selection.columns) {
    for (const row of rows) {
      result.push({ rowId: row.id, colId });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return result.filter((pos) => {
    const key = `${pos.rowId}:${pos.colId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * ตรวจสอบ OS สำหรับ keyboard shortcuts
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || '') ||
    /Mac/.test(navigator.userAgent || '');
}

/**
 * ตรวจสอบว่ากด Meta key (Cmd บน Mac, Ctrl บน Windows/Linux)
 */
export function isModKey(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac() ? e.metaKey : e.ctrlKey;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as any;
  }
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * ย้าย item ใน array จาก index หนึ่งไปอีก index
 */
export function moveArrayItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Insert item ใน array ที่ position ที่กำหนด
 */
export function insertArrayItem<T>(arr: T[], index: number, item: T): T[] {
  const result = [...arr];
  result.splice(index, 0, item);
  return result;
}

/**
 * ลบ item ออกจาก array ตาม indices
 */
export function removeArrayItems<T>(arr: T[], indices: number[]): T[] {
  const sortedIndices = [...indices].sort((a, b) => b - a);
  const result = [...arr];
  for (const idx of sortedIndices) {
    result.splice(idx, 1);
  }
  return result;
}

/**
 * Format shortcut key label ตาม OS
 */
export function formatShortcut(key: string): string {
  const mac = isMac();
  return key
    .replace('Mod', mac ? 'Cmd' : 'Ctrl')
    .replace('Alt', mac ? 'Option' : 'Alt');
}

// =========================================================================
// Formula Template Engine
// สร้างสูตรคำนวณสำเร็จรูปจาก columnTag อัตโนมัติ
// =========================================================================

/**
 * สร้างรายการ FormulaTemplate จาก columnTags ที่มี allowedFormats รวม 'number'
 * เฉพาะ tag ที่รองรับ 'number' เท่านั้นจึงจะมี template SUM ให้เลือก
 */
export function generateFormulaTemplates(columnTags: ColumnTagDefinition[]): FormulaTemplate[] {
  return columnTags
    .filter((tag) => {
      // เฉพาะ tag ที่รองรับ number เท่านั้น
      if (!tag.allowedFormats) return false;
      return tag.allowedFormats.includes('number');
    })
    .map((tag) => ({
      key: `SUM:${tag.key}`,
      label: `รวม${tag.label}ทั้งหมด`,
      operation: 'SUM' as const,
      targetTag: tag.key,
      icon: tag.icon || 'fa-solid fa-calculator',
    }));
}

/**
 * สร้างสูตรจริง (เช่น "[col1] + [col2] + [col3]") จาก FormulaTemplate
 * โดยหาทุกคอลัมน์ที่ตรงกับ tag + dataType='number'
 */
export function buildFormulaFromTemplate(
  templateKey: string,
  columns: SheetColumn[],
  columnTags: ColumnTagDefinition[]
): { formula: string; affectedColumns: string[] } {
  // parse template key: "SUM:income" -> operation=SUM, targetTag=income
  const [operation, targetTag] = templateKey.split(':');
  if (!operation || !targetTag) return { formula: '', affectedColumns: [] };

  // หาคอลัมน์ที่ตรงกับ tag + เป็นตัวเลข (ไม่เอา formula/template columns)
  const matchingCols = columns.filter(
    (col) =>
      col.columnTag === targetTag &&
      col.dataType === 'number' &&
      !col.formulaTemplate  // ไม่เอาคอลัมน์ที่ตัวเองเป็น template
  );

  if (matchingCols.length === 0) {
    return { formula: '0', affectedColumns: [] };
  }

  const affectedColumns = matchingCols.map((col) => col.id);

  switch (operation) {
    case 'SUM':
      return {
        formula: matchingCols.map((col) => `[${col.id}]`).join(' + '),
        affectedColumns,
      };
    default:
      return { formula: '0', affectedColumns: [] };
  }
}

/**
 * สแกนทุกคอลัมน์ที่มี formulaTemplate แล้ว rebuild สูตรใหม่
 * คืนค่า columns ที่อัปเดตแล้ว + รายการของ changes สำหรับ callback
 */
export function rebuildTemplateFormulas(
  columns: SheetColumn[],
  columnTags: ColumnTagDefinition[]
): {
  updatedColumns: SheetColumn[];
  changes: {
    colId: string;
    columnTitle: string;
    templateKey: string;
    oldFormula: string;
    newFormula: string;
    affectedColumns: string[];
  }[];
} {
  const changes: {
    colId: string;
    columnTitle: string;
    templateKey: string;
    oldFormula: string;
    newFormula: string;
    affectedColumns: string[];
  }[] = [];

  const updatedColumns = columns.map((col) => {
    if (!col.formulaTemplate) return col;

    const { formula: newFormula, affectedColumns } = buildFormulaFromTemplate(
      col.formulaTemplate,
      columns,
      columnTags
    );

    const oldFormula = col.formula || '';

    // ถ้าสูตรไม่เปลี่ยนก็ไม่ต้องอัปเดต
    if (oldFormula === newFormula) return col;

    changes.push({
      colId: col.id,
      columnTitle: col.title,
      templateKey: col.formulaTemplate,
      oldFormula,
      newFormula,
      affectedColumns,
    });

    return {
      ...col,
      formula: newFormula,
      dataType: 'formula' as const,
    };
  });

  return { updatedColumns, changes };
}
