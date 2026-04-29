# AGENTS.md - Custom Sheet System

## Project Overview

Custom Sheet System เป็น React Spreadsheet Component ที่สร้างขึ้นเองทั้งหมด
ออกแบบมาให้นำไปใช้ซ้ำได้ในทุกโปรเจค ไม่ผูกกับโครงสร้างข้อมูลใดๆ

### Tech Stack

- **Runtime**: Node.js v24+ (ใช้ `nvm use 24`)
- **Framework**: React 18+ / TypeScript / Vite
- **UI Library**: Ant Design (antd) - ใช้ Tooltip, Input, Select
- **Icons**: Font Awesome 6 (CDN) - ใช้ icon classes เท่านั้น
- **CSS**: Vanilla CSS (`custom-sheet.css`) - ไม่ใช้ Tailwind

### Documentation

| เอกสาร | เนื้อหา | สำหรับ |
|--------|---------|--------|
| `AGENTS.md` | Rules, conventions, architecture, patterns | AI Agents + นักพัฒนาที่จะ **แก้ไข** core |
| `USAGE.md` | คู่มือใช้งาน, วิธี integration, ตัวอย่างโค้ด, checklist | ทีมที่จะ **นำไปใช้** กับโปรเจคอื่น |
| `README.md` | ภาพรวมโปรเจค, วิธี dev/build | ทุกคน |

---

## Architecture

```
sheet-core/    (Logic Layer - Framework agnostic)
  types.ts          Interface/Type ทั้งหมด + Helper Functions (createCell, createRow, createColumn)
  useSheetEngine.ts Main hook: state management, CRUD, undo/redo, formula computation
  useKeyboard.ts    Keyboard shortcut handler (Tab, Arrow, Enter, Ctrl+Z/Y/S/C/V/X/A/F)
  useUndoRedo.ts    Undo/Redo stack (ref-based, synchronous)
  useActionLogger.ts Action logging (ทุก action ที่เกิดขึ้น)
  utils.ts          Pure utility functions + Formula engine (computeRowFormulas)
  helpers.ts        Data transformation: แปลง raw data -> SheetConfig (3 วิธี)
  index.ts          Barrel exports

sheet-custom/  (UI Layer - React Components)
  CustomSheet.tsx       Main component (Toolbar, Table, Context Menu, Formula Modal)
  CustomSheetCell.tsx   Individual cell component (memo, รองรับทุก mode)
  CustomContextMenu.tsx Right-click menu (dynamic items based on context)
  CustomCommentPopover.tsx Comment popup (add/edit/delete)
  CustomSearchBar.tsx   Search bar (Ctrl+F, highlight matches, navigate)
  custom-sheet.css      All styles (sticky headers, selection, drag, resize, formula)
```

---

## Critical Rules

### 1. Language

- ตอบกลับและเข้าใจบริบทเป็น **ภาษาไทย** เท่านั้น
- Code comments เขียนเป็นภาษาไทยได้ (ยกเว้น JSDoc/API docs)

### 2. No Emoji in Code/UI

- **ห้ามใช้ Emoji** ในโค้ดและ UI ทุกกรณี
- ใช้ **ข้อความ** หรือ **Font Awesome icon classes** แทน
- ตัวอย่าง: ใช้ `<i className="fa-solid fa-calculator"></i>` แทน calculator emoji

### 3. Type Flexibility

- `SheetCell`, `SheetColumn`, `SheetRow` ทั้งหมดมี `[key: string]: any`
- **ห้าม** กำหนด type ตายตัวสำหรับข้อมูลที่ consumer ส่งเข้ามา
- ข้อมูลจาก API/Database มีโครงสร้างไม่แน่นอน ต้องรองรับทุกอย่าง
- `cell.value` เป็น `any` เสมอ ไม่ต้อง cast
- ห้ามเพิ่ม required fields ใหม่ใน interfaces เหล่านี้ (เพิ่มได้เฉพาะ optional)

### 4. State Management

- ใช้ `baseRows` (raw data) + `useMemo` => `rows` (computed with formulas)
- Undo/Redo ใช้ **ref-based synchronous stack** (ไม่ใช่ state)
- Refs ใช้สำหรับ closures ที่ต้องเข้าถึง state ล่าสุดเสมอ
- `setRows` จริงๆ คือ `setBaseRows` (ข้อมูลดิบ) -> `useMemo` จะคำนวณ formula ให้อัตโนมัติ

### 5. CSS

- ใช้ Vanilla CSS เท่านั้น (`custom-sheet.css`)
- Sticky headers: `position: sticky; top: 0; z-index: 10;`
- Sticky row numbers: `position: sticky; left: 0; z-index: 5;`
- ไม่ใช้ TailwindCSS ยกเว้นผู้ใช้ร้องขอ

### 6. Formula Engine

- Parser ใช้ `new Function()` ด้วย `JSON.stringify` สำหรับ variable injection
- รองรับทั้ง **Math** และ **String concatenation**
- ค่าว่าง/null ใน formula จะ fallback เป็น `0`
- ผลลัพธ์ `#ERROR` หรือ `#DIV/0!` สำหรับข้อผิดพลาด
- เซลล์ formula เป็น readonly อัตโนมัติ
- เซลล์ formula แสดงเป็น plain text (ไม่มี input-preview)

### 7. Context Menu Permissions

- ปุ่ม Insert Row/Column จะ **ซ่อนอัตโนมัติ** ตาม `allowInsertRow` / `allowInsertColumn`
- ปุ่ม Delete Row/Column จะ **ซ่อนอัตโนมัติ** ตาม `allowDeleteRow` / `allowDeleteColumn`
- ทั้ง Toolbar buttons และ Context Menu items จะซ่อนพร้อมกัน

### 8. Data Initialization (สำคัญมาก)

- ข้อมูลจาก API อาจมีโครงสร้างต่างกันไป (field names, type names ฯลฯ)
- ใช้ `createSheetConfigFromApi()` สำหรับกรณี columns + rows มาจาก API
- ใช้ `createSheetConfigFromData()` สำหรับกรณี data array อย่างเดียว
- `autoDetectColumns()` จะสแกนทุก row เพื่อหา keys ทั้งหมด (ไม่ใช่แค่ row แรก)
- `resolveCellMode()` จะ map type strings จาก API เป็น CellMode อัตโนมัติ
  (เช่น `numeric` -> `number`, `dropdown` -> `select`, `read-only` -> `readonly`)

---

## Data Flow

```
ข้อมูลจาก API (Record<string, any>[])
         |
         v
  helpers.ts
  ├── createSheetConfigFromData()   <-- รับ data[] + optional columns
  ├── createSheetConfigFromApi()    <-- รับ apiColumns[] + data[]
  └── autoDetectColumns()           <-- เดา columns จาก data keys + values
         |
         v
  SheetConfig { initialRows, initialColumns, callbacks, ... }
         |
         v
  useSheetEngine(config)
  ├── baseRows (raw state)
  ├── useMemo -> formulaRows (computed with formulas)
  ├── useMemo -> rows (sorted formulaRows for display only)
  ├── columns (state)
  ├── selection, editingCell, search, changedCells, sort
  └── returns: UseSheetEngineReturn (complete API)
         |
         v
  <CustomSheet config={config} />
  ├── Toolbar (undo/redo, insert row/col, delete, search)
  ├── Table (sticky header, sticky row numbers)
  │   ├── <th> column headers (drag, resize, context menu)
  │   └── <tr> rows
  │       ├── <td> row number (sticky left)
  │       └── <CustomSheetCell> per cell
  │           ├── mode: editable-text -> <input> on edit
  │           ├── mode: number -> <input type="number"> validation
  │           ├── mode: select -> antd <Select>
  │           ├── mode: formula -> plain text (readonly, blue, tooltip)
  │           ├── mode: custom -> cell.component
  │           └── mode: readonly -> plain text (gray)
  ├── <CustomContextMenu> (dynamic items per context)
  ├── <CustomCommentPopover> (on comment click)
  ├── <CustomSearchBar> (on Ctrl+F)
  └── Formula Modal (antd Modal, on col-header context menu)
```

---

## Patterns & Conventions

### Adding New Cell Modes

1. เพิ่ม mode ใน `CellMode` type (`types.ts`)
2. เพิ่ม rendering logic ใน `CustomSheetCell.tsx` > `renderContent()`
3. เพิ่มเมนูประเภทข้อมูลใน `CustomSheet.tsx` > `contextMenuItems` (col-header section)
4. เพิ่ม mapping ใน `helpers.ts` > `resolveCellMode()` (ถ้ามี API type string ใหม่)

### Adding New Props to Config

1. เพิ่ม field ใน `SheetConfig` interface (`types.ts`)
2. Destructure ใน `useSheetEngine()` (`useSheetEngine.ts` line ~106)
3. ใช้ใน `CustomSheet.tsx` ผ่าน `config.xxx`
4. อัปเดต `helpers.ts` ให้ pass ค่าผ่าน `CreateFromDataOptions`

### Adding New Context Menu Items

1. ใช้ `customContextMenuItems` ใน `SheetConfig` (config-level, ไม่ต้องแก้ core)
2. หรือแก้ใน `CustomSheet.tsx` > `contextMenuItems` useMemo

### Adding New Column Properties

1. เพิ่ม optional field ใน `SheetColumn` interface (types.ts) - **ห้ามเพิ่มเป็น required**
2. เพิ่มใน `updateColumnProps` type signature ใน `useSheetEngine.ts` (ทั้ง interface และ useCallback)
3. ถ้าต้องการ undo/redo ให้เพิ่มใน `oldProps` object ด้วย
4. อัปเดต `ApiColumnDefinition` ใน `helpers.ts` ถ้าต้อง map จาก API

### How Formula Dependencies Highlighting Works

1. `CustomSheet.tsx` คำนวณ `dependentColIds` จาก `column.formula` pattern `[colId]`
2. ส่ง `isFormulaDependent` prop ลงไปยัง `CustomSheetCell`
3. `CustomSheetCell` เพิ่ม class `formula-dependent` เข้าไปใน td
4. CSS `.cs-td.formula-dependent` แสดงพื้นหลังสีเขียวอ่อน + ขอบเขียว

### How Frontend Sort Works

1. `useSheetEngine` จัดการ `sort` state (`colId` และ `direction`)
2. แทนที่จะส่ง `formulaRows` ออกไปโดยตรง `useSheetEngine` จะมี `useMemo` อีกชั้นเพื่อ sort ข้อมูล
3. การ sort ทำแบบสร้าง Array ใหม่ (`[...formulaRows].sort()`) เพื่อไม่ให้กระทบ `baseRows`
4. การกด Header จะไปเรียก `engine.sortColumn(colId)` สลับ state (asc -> desc -> null)

### How Read-only Mode Works

1. **State Protection**: เพิ่มเช็ค `if (readonly) return;` ที่ต้นทางของฟังก์ชันที่ทำการ mutate ข้อมูลทั้งหมดใน `useSheetEngine.ts` (เช่น `setCellValue`, `insertRow`, `undo`)
2. **UI Protection**: ส่ง `engine.readonly` ออกไปให้ `CustomSheet.tsx` ปิดการทำงาน (disabled) หรือซ่อน (hide) เมนูต่างๆ
3. **Context Menu**: ตรวจสอบและตั้งค่า `disabled: engine.readonly` ใน Context Menu Items ที่เกี่ยวกับการแก้ไขข้อมูล
4. **Popovers**: ใน `CustomCommentPopover` มีการรับ props `readonly` เพื่อซ่อนปุ่มและปิดการพิมพ์ข้อความ

---

## File Relationships

```
CustomSheet.tsx
  ├── uses: useSheetEngine(config) -> engine
  ├── uses: useKeyboard({ containerRef, engine })
  ├── computes: allowInsertRow, allowInsertColumn, allowDeleteRow, allowDeleteColumn
  ├── computes: contextMenuItems (useMemo, dynamic per type: cell/row-header/col-header)
  ├── computes: formula modal state (formulaModal, openFormulaModal, handleFormulaSubmit)
  ├── computes: dependentColIds (formula dependency highlighting per row)
  ├── renders: Toolbar (undo/redo, insert, delete, search toggle, sort status badge)
  ├── renders: <table> with sticky <thead> and <tbody>
  ├── renders: CustomSheetCell (per cell, with isFormulaDependent prop)
  ├── renders: CustomContextMenu (on right-click)
  ├── renders: CustomCommentPopover (on comment indicator click)
  ├── renders: CustomSearchBar (on Ctrl+F / search toggle)
  └── renders: antd Modal (for formula editing)

useSheetEngine.ts
  ├── uses: useUndoRedo (undo/redo stack)
  ├── uses: useActionLogger (action logging)
  ├── uses: utils.ts > computeRowFormulas (formula recalculation via useMemo)
  ├── manages: baseRows + columns + selection + editingCell + search + changedCells
  ├── provides: setCellValue, clearSelectedCells, bulkSetValue
  ├── provides: selectCell, selectRange, selectRow, selectColumn, selectAll, clearSelection
  ├── provides: insertRow, deleteRows, moveRow
  ├── provides: insertColumn, deleteColumns, moveColumn, resizeColumn, renameColumn
  ├── provides: updateColumnProps (locked, dataType, options, formula)
  ├── provides: copySelection, pasteFromClipboard
  ├── provides: addComment, updateComment, deleteComment
  ├── provides: openSearch, closeSearch, setSearchQuery, nextSearchResult, prevSearchResult
  ├── provides: sortColumn, clearSort
  ├── provides: undo, redo, canUndo, canRedo
  └── provides: save (Ctrl+S -> onSave callback)

helpers.ts
  ├── createSheetConfigFromData(data[], options?) -> SheetConfig
  │     - auto-detect columns จาก data keys (ถ้าไม่กำหนด columns)
  │     - เก็บ extra data fields ไว้ที่ row level
  ├── createSheetConfigFromApi(apiColumns[], apiRows[], options?) -> SheetConfig
  │     - รองรับ API column format: key/field/id, title/label/header/name, type/dataType/mode
  │     - resolveCellMode() map type string จาก API -> CellMode
  │     - เก็บ extra API column properties ไว้ที่ SheetColumn level
  └── autoDetectColumns(data[]) -> SimpleColumnConfig[]
        - สแกนทุก row เพื่อหา keys ทั้งหมด
        - เดา mode จากค่าจริง (number vs text)
        - ประมาณความกว้างจากข้อมูล
```

---

## Known Limitations

1. **Performance**: `computeRowFormulas` recalculates all rows on any change.
   - สำหรับ dataset ขนาดใหญ่ (>1000 rows) ควรพิจารณา dependency graph
2. **Formula Security**: ใช้ `new Function()` ซึ่งต้องระวังเรื่อง injection
   - ปัจจุบันใช้ `JSON.stringify` ป้องกัน แต่ไม่ใช่ sandbox เต็มรูปแบบ
3. **Virtual Scrolling**: ยังไม่ได้ implement (มี `virtualThreshold` prop ไว้แต่ยังไม่ทำงาน)
4. **Circular Formula**: ไม่มี circular dependency detection (formula A อ้าง B อ้าง A จะ loop)

---

## Testing

```bash
# Build check (type validation + production build)
source ~/.nvm/nvm.sh && nvm use 24 && npm run build

# Dev server
npm run dev
```

---

## Common Tasks

### เพิ่มคอลัมน์ใหม่ทาง Code
```tsx
createColumn('newField', 'ชื่อคอลัมน์', { width: 150, dataType: 'editable-text' });
```

### เพิ่มแถวใหม่ทาง Code
```tsx
createRow({
  field1: createCell('field1', 'value1'),
  field2: createCell('field2', 'value2'),
});
```

### ปิดการเพิ่ม/ลบแถวและคอลัมน์
```tsx
const config: SheetConfig = {
  // ...
  allowInsertRow: false,
  allowInsertColumn: false,
  allowDeleteRow: false,
  allowDeleteColumn: false,
};
```

### ใช้ข้อมูลจาก API โดยไม่ต้องรู้ Type
```tsx
// วิธีที่ 1: data อย่างเดียว
const data = await fetch('/api/data').then(r => r.json());
const config = createSheetConfigFromData(data);

// วิธีที่ 2: columns + data จาก API
const { columns, rows } = await fetch('/api/sheet').then(r => r.json());
const config = createSheetConfigFromApi(columns, rows);
```

### เพิ่ม Custom Column Property ใหม่
```tsx
// ไม่ต้องแก้ types.ts เพราะมี [key: string]: any อยู่แล้ว
createColumn('salary', 'เงินเดือน', {
  width: 120,
  myCustomProp: 'anything',    // ใส่อะไรก็ได้
  validation: { min: 0 },      // ใส่ object ก็ได้
  apiMapping: 'base_salary',   // ใช้ mapping กับ API ก็ได้
});
```
