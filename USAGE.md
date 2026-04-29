# Custom Sheet System - คู่มือการใช้งาน

> เอกสารนี้ออกแบบให้ทั้ง **ทีมนักพัฒนา** และ **AI Agents** สามารถอ่านและนำระบบไปใช้ได้ทันที
> อ้างอิงร่วมกับ `AGENTS.md` สำหรับ rules และ conventions ในการพัฒนา

## สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [โครงสร้างไฟล์ และการนำไปใช้](#โครงสร้างไฟล์-และการนำไปใช้)
- [การติดตั้ง Dependencies](#การติดตั้ง-dependencies)
- [3 วิธีเริ่มต้นใช้งาน](#3-วิธีเริ่มต้นใช้งาน)
- [การกำหนดค่า Columns](#การกำหนดค่า-columns)
- [การกำหนดค่า Rows / Data](#การกำหนดค่า-rows--data)
- [Config Options ทั้งหมด](#config-options-ทั้งหมด)
- [ระบบ Column Tags (จัดกลุ่มคอลัมน์)](#ระบบ-column-tags-จัดกลุ่มคอลัมน์)
- [ระบบเรียงลำดับข้อมูล (Sort)](#ระบบเรียงลำดับข้อมูล-sort)
- [ระบบสูตรคำนวณ (Formula)](#ระบบสูตรคำนวณ-formula)
- [Custom Context Menu](#custom-context-menu)
- [Custom Cell Component](#custom-cell-component)
- [Custom Row Component](#custom-row-component)
- [Callbacks / Events](#callbacks--events)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Advanced: ข้อมูลยืดหยุ่น](#advanced-ข้อมูลยืดหยุ่น)
- [Integration Checklist](#integration-checklist)
- [ตัวอย่างเต็ม (Full Example)](#ตัวอย่างเต็ม-full-example)

---

## ภาพรวมระบบ

Custom Sheet System เป็นระบบตารางคำนวณ (Spreadsheet) ที่สร้างขึ้นเองด้วย React + TypeScript
ออกแบบให้ **ไม่ผูกกับโครงสร้างข้อมูลใดๆ** เพื่อนำไปใช้ซ้ำได้กับทุกโปรเจค

### ความสามารถหลัก

- แก้ไขข้อมูลได้ทุกประเภท (text, number, select, readonly, formula, custom)
- Drag & Drop แถว / คอลัมน์
- ปรับขนาดคอลัมน์ (Resize)
- Context Menu (เมนูคลิกขวา) พร้อมใส่ Custom Items ได้
- Undo / Redo
- ค้นหาในตาราง (Ctrl/Cmd + F)
- Copy / Paste / Cut
- Multi-select (Shift + Click / Drag)
- เรียงลำดับข้อมูล (Sort) แบบ Preview หน้าบ้าน
- Formula Engine (สูตรคำนวณ + เชื่อมข้อความ)
- Comment ระดับเซลล์
- Keyboard Navigation (Tab, Arrow Keys, Enter, F2)
- Sticky Header + Sticky Row Numbers (#)

### Dependencies ที่ต้องมี

- **React 18+**
- **Ant Design (antd)** - ใช้ Tooltip, Input, Select
- **Font Awesome 6** - ใช้ icon classes

---

## โครงสร้างไฟล์ และการนำไปใช้

### โฟลเดอร์ที่ต้องคัดลอก

```
src/
├── sheet-core/                     # Logic Layer (ไม่ผูกกับ UI)
│   ├── types.ts                    # Type/Interface ทั้งหมด + Helper Functions
│   ├── useSheetEngine.ts           # Main Hook: จัดการ state, CRUD, undo/redo
│   ├── useKeyboard.ts              # Keyboard shortcuts
│   ├── useActionLogger.ts          # Action logging
│   ├── useUndoRedo.ts              # Undo/Redo stack (ref-based, synchronous)
│   ├── utils.ts                    # Pure utility functions + Formula engine
│   ├── helpers.ts                  # แปลงข้อมูลดิบ -> SheetConfig (3 วิธี)
│   └── index.ts                    # Barrel exports
│
└── sheet-custom/                   # UI Layer (React Components)
    ├── CustomSheet.tsx             # Component หลัก (<CustomSheet config={...} />)
    ├── CustomSheetCell.tsx          # Component เซลล์ (memo)
    ├── CustomContextMenu.tsx        # เมนูคลิกขวา
    ├── CustomCommentPopover.tsx     # Comment popup
    ├── CustomSearchBar.tsx          # แถบค้นหา
    └── custom-sheet.css             # CSS ทั้งหมด
```

### วิธีนำไปใช้ในโปรเจคอื่น

**ขั้นตอนที่ 1:** คัดลอก `sheet-core/` และ `sheet-custom/` ไปวางในโปรเจค

```bash
# ตัวอย่างโครงสร้างโปรเจคปลายทาง
my-project/
├── src/
│   ├── sheet-core/          # <-- วางตรงนี้
│   ├── sheet-custom/        # <-- วางตรงนี้
│   ├── pages/
│   │   └── MyTablePage.tsx  # <-- หน้าที่จะใช้ตาราง
│   └── App.tsx
├── public/
│   └── index.html           # <-- ใส่ Font Awesome CDN
└── package.json
```

**ขั้นตอนที่ 2:** ติดตั้ง Dependencies (ดูหัวข้อถัดไป)

**ขั้นตอนที่ 3:** Import และใช้งาน

```tsx
// MyTablePage.tsx
import CustomSheet from '../sheet-custom/CustomSheet';
import { createSheetConfigFromApi } from '../sheet-core';

export default function MyTablePage() {
  const [config, setConfig] = useState<SheetConfig | null>(null);

  useEffect(() => {
    fetch('/api/my-data')
      .then(r => r.json())
      .then(({ columns, rows }) => {
        setConfig(createSheetConfigFromApi(columns, rows));
      });
  }, []);

  if (!config) return <div>Loading...</div>;
  return <CustomSheet config={config} />;
}
```

---

## การติดตั้ง Dependencies

```bash
# ติดตั้ง antd (ถ้ายังไม่มี)
npm install antd @ant-design/icons
```

เพิ่ม Font Awesome CDN ใน `index.html`:

```html
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
/>
```

---

## 3 วิธีเริ่มต้นใช้งาน

### วิธีที่ 1: Data Only (Auto-detect ทุกอย่าง)

เหมาะกับกรณีที่ **ไม่รู้โครงสร้างเลย** แค่มี array of objects ก็ใช้ได้:

```tsx
import CustomSheet from '../sheet-custom/CustomSheet';
import { createSheetConfigFromData } from '../sheet-core';

// ข้อมูลดิบ - ไม่ต้องกำหนด type
const data = [
  { name: 'สมชาย', age: 30, dept: 'IT', salary: 50000 },
  { name: 'สมหญิง', age: 25, dept: 'HR', salary: 45000 },
];

// ระบบจะ auto-detect columns จาก keys และ เดา type จากข้อมูลจริง
const config = createSheetConfigFromData(data);

function MyPage() {
  return <CustomSheet config={config} />;
}
```

> Auto-detect จะ: สแกน keys จากทุก row, เดา number/text จากค่าจริง, ประมาณความกว้างคอลัมน์

### วิธีที่ 2: Data + Column Config (กำหนดหัวตารางเอง)

เหมาะกับกรณีที่ **รู้ว่ามี columns อะไรบ้าง** แต่ข้อมูลอาจมาทีหลัง:

```tsx
import CustomSheet from '../sheet-custom/CustomSheet';
import { createSheetConfigFromData } from '../sheet-core';

const data = await fetch('/api/employees').then(r => r.json());

const config = createSheetConfigFromData(data, {
  columns: [
    { key: 'name', title: 'ชื่อพนักงาน', width: 200 },
    { key: 'age', title: 'อายุ', width: 100, mode: 'number' },
    { key: 'dept', title: 'แผนก', width: 150, mode: 'select', options: [
      { label: 'IT', value: 'IT' },
      { label: 'HR', value: 'HR' },
    ]},
    { key: 'salary', title: 'เงินเดือน', width: 120, mode: 'number' },
  ],
  allowInsertRow: false,   // ห้ามเพิ่มแถว
  allowDeleteRow: false,   // ห้ามลบแถว
});

function MyPage() {
  return <CustomSheet config={config} />;
}
```

### วิธีที่ 3: API Columns + API Rows (ไม่รู้อะไรเลย)

เหมาะกับกรณีที่ **ทั้ง columns และ rows ได้มาจาก API** โดยไม่รู้โครงสร้าง:

```tsx
import CustomSheet from '../sheet-custom/CustomSheet';
import { createSheetConfigFromApi } from '../sheet-core';
import type { SheetConfig } from '../sheet-core';
import { useState, useEffect } from 'react';

function MyPage() {
  const [config, setConfig] = useState<SheetConfig | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/payroll-sheet');
      const { columns, rows } = await res.json();

      // columns จาก API อาจเป็นรูปแบบใดก็ได้:
      // [{ field: 'name', label: 'ชื่อ', type: 'text' }]
      // [{ key: 'salary', title: 'เงินเดือน', dataType: 'number' }]
      // [{ id: 'dept', header: 'แผนก', mode: 'select' }]
      // ระบบจะจัดการ mapping ให้อัตโนมัติ

      const sheetConfig = createSheetConfigFromApi(columns, rows, {
        userName: 'admin',
        allowInsertRow: true,
        callbacks: {
          onSave: (payload) => {
            // ส่งข้อมูลกลับ API
            fetch('/api/payroll-sheet', {
              method: 'PUT',
              body: JSON.stringify(payload.data),
            });
          },
        },
      });

      setConfig(sheetConfig);
    }
    load();
  }, []);

  if (!config) return <div>Loading...</div>;
  return <CustomSheet config={config} />;
}
```

> API Column format ที่รองรับ: `key/field/id` สำหรับ key, `title/label/header/name` สำหรับชื่อแสดงผล, `type/dataType/mode` สำหรับประเภท

---

## การกำหนดค่า Columns

### ผ่าน `createColumn(id, title, options)`

```tsx
createColumn('salary', 'เงินเดือน', {
  width: 120,         // ความกว้าง (px)
  minWidth: 60,       // ความกว้างต่ำสุด
  maxWidth: 400,      // ความกว้างสูงสุด
  resizable: true,    // ปรับขนาดได้
  draggable: true,    // ลากย้ายได้
  locked: false,      // ล็อคห้ามแก้ไข
  dataType: 'number', // ประเภทข้อมูล
  deletable: true,    // ลบได้
  sortable: true,     // เรียงลำดับได้ (ค่าเริ่มต้นคือ true)
  cellStyle: 'plain', // 'plain' | 'input-preview'
  formula: '[base] + [bonus]', // สูตรคำนวณ (ถ้ามี)
});
```

### ประเภทข้อมูล (dataType / mode)

| Mode            | รายละเอียด                                      |
| --------------- | ----------------------------------------------- |
| `text`          | แสดงข้อความอย่างเดียว                            |
| `editable-text` | Double-click เพื่อแก้ไข (ค่าเริ่มต้น)           |
| `number`        | บังคับให้ใส่เฉพาะตัวเลข                          |
| `input`         | แสดง input field ตลอดเวลา                       |
| `select`        | แสดง dropdown select                            |
| `readonly`      | อ่านอย่างเดียว                                   |
| `formula`       | คำนวณจากสูตร (อ้างอิงคอลัมน์อื่น)               |
| `custom`        | ใช้ custom component ที่กำหนดเอง                 |

### Auto-mapping จาก API type strings

ถ้า API ส่ง type มาเป็น string ระบบจะ map ให้อัตโนมัติ:

| API ส่งมา                         | ระบบแปลงเป็น    |
| --------------------------------- | --------------- |
| `text`, `string`, `editable`      | `editable-text` |
| `number`, `numeric`, `int`, `float`, `currency`, `money` | `number` |
| `select`, `dropdown`, `enum`, `choice` | `select`   |
| `readonly`, `read-only`, `disabled`, `view`, `display` | `readonly` |
| `formula`, `calculated`, `computed` | `formula`    |

---

## การกำหนดค่า Rows / Data

### ข้อมูลยืดหยุ่น (ไม่จำกัด type)

ทุก Interface หลัก (`SheetCell`, `SheetColumn`, `SheetRow`) รองรับ `[key: string]: any`:

```tsx
// เก็บข้อมูลเพิ่มเติมใน Row ได้เลย
createRow(cells, {
  _id: 'db-record-123',          // ID จาก database
  metadata: { source: 'api' },    // ข้อมูล meta
});

// เก็บข้อมูลเพิ่มเติมใน Column ได้เลย
createColumn('salary', 'เงินเดือน', {
  apiFieldName: 'base_salary',    // mapping กับ API
  validation: { min: 0 },         // custom validation rules
});

// เก็บข้อมูลเพิ่มเติมใน Cell ได้เลย
createCell('name', 'สมชาย', {
  originalValue: 'สมชาย',         // เก็บค่าเดิมไว้เปรียบเทียบ
});
```

---

## Config Options ทั้งหมด

### SheetConfig

| Property             | Type                    | Default | รายละเอียด                                |
| -------------------- | ----------------------- | ------- | ----------------------------------------- |
| `initialRows`        | `SheetRow[]`            | -       | ข้อมูลแถวเริ่มต้น (required)              |
| `initialColumns`     | `SheetColumn[]`         | -       | คอลัมน์เริ่มต้น (required)                |
| `callbacks`          | `SheetCallbacks`        | -       | Callback functions                        |
| `userName`           | `string`                | -       | ชื่อผู้ใช้ (สำหรับ action log)            |
| `maxUndoHistory`     | `number`                | `50`    | จำนวน undo สูงสุด                         |
| `allowInsertRow`     | `boolean`               | `true`  | อนุญาตให้เพิ่มแถว                         |
| `allowInsertColumn`  | `boolean`               | `true`  | อนุญาตให้เพิ่มคอลัมน์                      |
| `allowDeleteRow`     | `boolean`               | `true`  | อนุญาตให้ลบแถว                            |
| `allowDeleteColumn`  | `boolean`               | `true`  | อนุญาตให้ลบคอลัมน์                         |
| `customContextMenuItems` | `CustomContextMenuItem[]` | -  | เมนูคลิกขวาเพิ่มเติม                      |
| `defaultCellStyle`   | `'plain' \| 'input-preview'` | `'plain'` | รูปแบบเซลล์เริ่มต้น               |
| `columnTags`         | `ColumnTagDefinition[]` | -       | ประเภทคอลัมน์ที่กำหนดเอง (เช่น รายได้/รายหัก) |

---

## ระบบ Column Tags (จัดกลุ่มคอลัมน์)

Column Tags ช่วยให้ developer สามารถ **จัดกลุ่ม** คอลัมน์ตามหมวดหมู่ที่กำหนดเอง เช่น รายได้/รายหัก/ข้อมูลทั่วไป
Tag ต่างจาก dataType ตรงที่ **Tag คือหมวดหมู่เชิงธุรกิจ** ส่วน dataType คือรูปแบบการแสดงผล

### กำหนด Column Tags ผ่าน Config

```tsx
const config = createSheetConfigFromApi(columns, rows, {
  columnTags: [
    {
      key: 'income',                              // key ไม่ซ้ำ
      label: 'รายได้',                             // ชื่อแสดงผลในเมนู
      icon: 'fa-solid fa-circle-plus',             // Font Awesome class
      color: '#22c55e',                            // สีของ tag badge
      allowedFormats: ['number', 'readonly'],      // จำกัด format ที่ใช้ได้ในกลุ่มนี้
    },
    {
      key: 'deduction',
      label: 'รายหัก',
      icon: 'fa-solid fa-circle-minus',
      color: '#ef4444',
      allowedFormats: ['number', 'readonly'],
    },
    {
      key: 'info',
      label: 'ข้อมูลทั่วไป',
      icon: 'fa-solid fa-circle-info',
      color: '#3b82f6',
      // ถ้าไม่กำหนด allowedFormats จะใช้ format ทั้งหมดได้
    },
  ],
});
```

### กำหนด Tag ให้ Column ผ่าน API

```tsx
const apiColumns = [
  { field: 'salary', label: 'เงินเดือน', type: 'number', columnTag: 'income' },
  { field: 'bonus', label: 'โบนัส', type: 'number', columnTag: 'income' },
  { field: 'tax', label: 'หักภาษี', type: 'number', columnTag: 'deduction' },
  { field: 'name', label: 'ชื่อ', type: 'editable-text', columnTag: 'info' },
];
```

### ColumnTagDefinition Interface

| Property         | Type         | Required | รายละเอียด                                |
| ---------------- | ------------ | -------- | ----------------------------------------- |
| `key`            | `string`     | YES      | key ไม่ซ้ำสำหรับ tag นี้                  |
| `label`          | `string`     | YES      | ชื่อแสดงผลในเมนูคลิกขวา                  |
| `icon`           | `string`     | NO       | Font Awesome class (เช่น `fa-solid fa-tag`) |
| `color`          | `string`     | NO       | สีของ tag badge (hex/rgb)                 |
| `allowedFormats` | `CellMode[]` | NO       | format ที่อนุญาตในกลุ่มนี้ (default: ทั้งหมด) |
| `[key: string]`  | `any`        | NO       | ใส่ property เพิ่มได้ตามต้องการ            |

### การทำงานใน UI

- คลิกขวาที่หัวคอลัมน์จะเห็นเมนู **"ประเภทคอลัมน์"** แสดง tags ทั้งหมด
- เลือก tag แล้วจะจำกัด **"รูปแบบข้อมูล"** ตาม `allowedFormats`
- ถ้าคอลัมน์มี tag ที่กำหนด `allowedFormats: ['number']` จะเปลี่ยนเป็น text ไม่ได้

---

## ระบบเรียงลำดับข้อมูล (Sort)

ระบบ Sort ของ Custom Sheet เป็นรูปแบบ **Preview หน้าบ้าน** หมายความว่าเมื่อผู้ใช้เรียงข้อมูล จะเป็นการจัดเรียงเพื่อการแสดงผลเท่านั้น **ข้อมูลต้นฉบับ (baseRows) จะไม่ถูกสลับตำแหน่งจริง** เพื่อรักษาความถูกต้องเมื่อส่งข้อมูลกลับไปบันทึก

### พฤติกรรมใน UI
- **Hover:** เมื่อนำเมาส์ไปชี้ที่หัวคอลัมน์ที่ sort ได้ จะมีไอคอนลูกศรปรากฏขึ้น
- **คลิก 1 ครั้ง:** เรียงจากน้อยไปมาก (Ascending)
- **คลิก 2 ครั้ง:** เรียงจากมากไปน้อย (Descending)
- **คลิก 3 ครั้ง:** ยกเลิกการเรียงลำดับ (กลับสู่ค่าเริ่มต้น)
- **Toolbar:** เมื่อมีการเรียงลำดับ จะมี Badge บอกสถานะที่ด้านบนพร้อมปุ่มกดกากบาท (x) เพื่อยกเลิก

### การปิดใช้งาน Sort เป็นบางคอลัมน์
ค่าเริ่มต้นของทุกคอลัมน์คือ `sortable: true` (อนุญาตให้ sort ได้หมด)
ถ้ามีคอลัมน์ไหนที่ไม่ต้องการให้ sort ได้ เช่น คอลัมน์ปุ่มสถานะ หรือหมายเหตุ สามารถกำหนด `sortable: false` ใน config ได้เลย:

```tsx
const apiColumns = [
  { field: 'name', label: 'ชื่อ', type: 'editable-text' }, // Sort ได้ตามปกติ
  { field: 'note', label: 'หมายเหตุ', type: 'editable-text', sortable: false }, // ซ่อนไอคอน Sort
  { field: 'action', label: 'จัดการ', type: 'custom', sortable: false }, // ซ่อนไอคอน Sort
];
```

---

## โหมด Read-only (ดูข้อมูลอย่างเดียว)

คุณสามารถเปิดใช้งานโหมดดูข้อมูลอย่างเดียวในระดับ Sheet ได้โดยการกำหนด `readonly: true` ใน Config การทำเช่นนี้จะล็อกการแก้ไขทุกรูปแบบทันทีโดยไม่ต้องไปแก้ที่ระดับคอลัมน์ทีละอัน

```tsx
const config = createSheetConfigFromApi(columns, rows, {
  userName: 'Admin',
  readonly: true, // กำหนดบรรทัดนี้เพื่อล็อคทั้งตาราง
});
```

### สิ่งที่ระบบจะทำการระงับ/ซ่อนอัตโนมัติ:
- ดับเบิ้ลคลิกเพื่อแก้ไข หรือกดปุ่ม Enter
- พิมพ์ข้อมูลทับหรือลบ (Delete/Backspace) ในเซลล์
- การใช้วางข้อมูล (Paste/Ctrl+V) และ ตัดข้อมูล (Cut/Ctrl+X)
- ปุ่มเพิ่ม/ลบแถวคอลัมน์ ทั้งใน Toolbar และใน Context Menu (คลิกขวา)
- การใช้คีย์ลัด Undo/Redo/Save
- การแก้ไข/เพิ่ม/ลบ Comment ของเซลล์ (ดูได้อย่างเดียว)
- การเปลี่ยนการตั้งค่าโครงสร้างของคอลัมน์ (เช่น เปลี่ยนชื่อคอลัมน์, เปลี่ยนรูปแบบข้อมูล, กำหนดสูตร)
- การลากสลับคอลัมน์ (Drag & Drop)

### สิ่งที่ยังใช้งานได้ปกติ:
- คัดลอกข้อมูล (Copy/Ctrl+C)
- ยืดหดขนาดคอลัมน์ (Resize)
- ค้นหาข้อมูล (Ctrl+F)
- เรียงลำดับข้อมูล (Sort)
- การเลือกครอบเซลล์ (Selection)

---

## ระบบสูตรคำนวณ (Formula)

### รูปแบบสูตร

ใช้ `[columnId]` เพื่ออ้างอิงค่าจากคอลัมน์อื่นในแถวเดียวกัน:

```
# คณิตศาสตร์
[baseSalary] + [bonus] - [deductTax]
[price] * [quantity]
([baseSalary] + [allowance]) * 1.5

# เชื่อมข้อความ (String Concatenation)
[firstName] + " " + [lastName]
"สวัสดีคุณ " + [name]
[dept] + " - " + [position]
```

### การทำงาน

- คำนวณ **อัตโนมัติ** ทุกครั้งที่ข้อมูลเปลี่ยน
- แสดง **ตัวอักษรสีฟ้า** + **icon** ที่หัวคอลัมน์
- Hover แสดง **Tooltip (antd)** บอกสูตร
- คลิกที่เซลล์สูตร -> **ไฮไลต์เซลล์ต้นทางสีเขียว**
- เซลล์สูตร **read-only อัตโนมัติ** (แก้ไขไม่ได้)

### กำหนดผ่าน Code

```tsx
createColumn('totalPay', 'รายได้รวม', {
  dataType: 'formula',
  formula: '[baseSalary] + [allowance] + [overtime] + [bonus]',
});
```

---

## Custom Context Menu

```tsx
const config: SheetConfig = {
  // ...
  customContextMenuItems: [
    {
      key: 'export-row',
      label: 'ส่งออกแถวนี้',
      icon: 'fa-solid fa-file-export',
      target: 'cell',  // 'cell' | 'row-header' | 'col-header' | 'all'
      onClick: (context) => {
        console.log('Row:', context.row);
      },
    },
  ],
};
```

---

## Custom Cell Component

```tsx
import type { CellComponentProps } from '../sheet-core';

function StatusCell({ cell, onChange }: CellComponentProps) {
  return (
    <span
      style={{ background: cell.value === 'active' ? '#52c41a' : '#ff4d4f', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
      onClick={() => onChange(cell.value === 'active' ? 'inactive' : 'active')}
    >
      {cell.value || 'N/A'}
    </span>
  );
}

// ใช้:
createCell('status', 'active', { mode: 'custom', component: StatusCell });
```

---

## Custom Row Component

```tsx
import type { RowComponentProps } from '../sheet-core';

function SummaryRow({ row }: RowComponentProps) {
  return <div style={{ padding: 8, fontWeight: 'bold' }}>สรุปยอดรวม</div>;
}

// ใช้:
createRow({}, { component: SummaryRow });
```

---

## Callbacks / Events

```tsx
callbacks: {
  onSave: (payload) => { /* payload.data, payload.changedCells, payload.timestamp */ },
  onCellEdit: (cell, before, after) => {},
  onRowInsert: (payload) => {},
  onRowDelete: (payload) => {},
  onColumnInsert: (payload) => {},
  onColumnDelete: (payload) => {},
  onSelectionChange: (selection) => {},
  onAction: (action) => { /* ทุก action */ },
}
```

---

## Keyboard Shortcuts

| Shortcut              | การทำงาน                             |
| --------------------- | ------------------------------------ |
| `Ctrl/Cmd + Z`        | Undo                                 |
| `Ctrl/Cmd + Y`        | Redo                                 |
| `Ctrl/Cmd + S`        | Save (เรียก onSave callback)         |
| `Ctrl/Cmd + C`        | คัดลอก                               |
| `Ctrl/Cmd + V`        | วาง                                  |
| `Ctrl/Cmd + X`        | ตัด                                  |
| `Ctrl/Cmd + A`        | เลือกทั้งหมด                          |
| `Ctrl/Cmd + F`        | ค้นหา                                |
| `Delete / Backspace`  | ล้างค่าเซลล์ที่เลือก                 |
| `Enter`               | เข้าสู่โหมดแก้ไข / ยืนยัน            |
| `Escape`              | ยกเลิกแก้ไข / ปิดเมนู               |
| `Tab`                 | เลื่อนไปเซลล์ถัดไป                   |
| `Shift + Tab`         | เลื่อนไปเซลล์ก่อนหน้า               |
| `Arrow Keys`          | นำทางระหว่างเซลล์                     |
| `F2`                  | เข้าสู่โหมดแก้ไข                     |

---

## Advanced: ข้อมูลยืดหยุ่น

### หลักการออกแบบ

```
ข้อมูลจาก API (ไม่รู้ Type)
         |
         v
  +-----------------------+
  | helpers.ts            |
  | - createSheetConfig.. |   <-- แปลงข้อมูลดิบเป็น SheetConfig
  | - autoDetectColumns   |   <-- เดา columns จากข้อมูลจริง
  | - resolveCellMode     |   <-- แปลง API type string -> CellMode
  +-----------------------+
         |
         v
  +-----------------------+
  | types.ts              |
  | - SheetConfig         |   <-- ตัวกลางที่ CustomSheet อ่าน
  | - SheetRow []         |   <-- แถวข้อมูล (+ [key: string]: any)
  | - SheetColumn []      |   <-- คอลัมน์ (+ [key: string]: any)
  | - SheetCell           |   <-- เซลล์ (+ [key: string]: any)
  +-----------------------+
         |
         v
  +-----------------------+
  | useSheetEngine.ts     |   <-- จัดการ state ทั้งหมด
  +-----------------------+
         |
         v
  +-----------------------+
  | CustomSheet.tsx       |   <-- UI Component (<CustomSheet config={..} />)
  +-----------------------+
```

### สรุปเส้นทางข้อมูล

| ขั้นตอน | ไฟล์                | ทำอะไร                                     |
| ------- | ------------------- | ------------------------------------------ |
| 1       | `helpers.ts`        | รับข้อมูลดิบ -> แปลงเป็น `SheetConfig`     |
| 2       | `useSheetEngine.ts` | รับ `SheetConfig` -> จัดการ state + API     |
| 3       | `CustomSheet.tsx`   | รับ engine -> render UI ทั้งตาราง           |
| 4       | `CustomSheetCell`   | render เซลล์แต่ละช่อง                      |

---

## สรุป: เลือกวิธีที่เหมาะกับคุณ

| กรณี                              | ใช้ฟังก์ชัน                     | ตัวอย่าง                                    |
| --------------------------------- | ----------------------------- | ------------------------------------------- |
| มี data array อย่างเดียว          | `createSheetConfigFromData(data)` | Auto-detect ทุกอย่าง                       |
| รู้ columns + มี data             | `createSheetConfigFromData(data, { columns })` | กำหนด columns เอง             |
| ทั้ง columns + data มาจาก API     | `createSheetConfigFromApi(cols, rows)` | ยืดหยุ่นที่สุด                       |
| ต้องการ full control              | `createColumn` + `createRow` + `createCell` เอง | ควบคุมทุกอย่าง               |

---

## Integration Checklist

ใช้ checklist นี้เมื่อจะนำ Custom Sheet ไปใช้กับโปรเจคใหม่:

```
[ ] 1. คัดลอก src/sheet-core/ (8 ไฟล์) ไปไว้ใน src/ ของโปรเจคปลายทาง
[ ] 2. คัดลอก src/sheet-custom/ (6 ไฟล์) ไปไว้ใน src/ ของโปรเจคปลายทาง
[ ] 3. ติดตั้ง antd + @ant-design/icons (npm install antd @ant-design/icons)
[ ] 4. เพิ่ม Font Awesome 6 CDN ใน index.html:
       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
[ ] 5. Import CustomSheet + helper ในหน้าที่ต้องการ
[ ] 6. สร้าง config ด้วย useMemo() เพื่อป้องกัน re-render loop
[ ] 7. กำหนด callbacks.onSave สำหรับส่งข้อมูลกลับ API
[ ] 8. (Optional) กำหนด customContextMenuItems
[ ] 9. (Optional) กำหนด columnTags
[ ] 10. (Optional) สร้าง Custom Cell Components
[ ] 11. ทดสอบ: npm run build ผ่านไม่มี error
```

> **สำคัญ:** อย่าลืม wrap config ด้วย `useMemo()` ไม่งั้น React จะ re-render loop
> เพราะ `createSheetConfigFromApi()` สร้าง object ใหม่ทุกครั้งที่เรียก

---

## ตัวอย่างเต็ม (Full Example)

ตัวอย่างการเชื่อมต่อกับ API จริง พร้อม Column Tags + Custom Cells + Context Menu:

```tsx
import { useMemo, useState, useEffect } from 'react';
import type { SheetConfig, ApiColumnDefinition, CustomMenuContext, SheetCell } from '../sheet-core';
import { createSheetConfigFromApi } from '../sheet-core';
import CustomSheet from '../sheet-custom/CustomSheet';

// Custom Cell Component สำหรับ Status
function StatusCell({ cell, onChange, onBlur }: any) {
  const colors: Record<string, string> = {
    active: '#22c55e',
    inactive: '#ef4444',
    pending: '#f59e0b',
  };
  return (
    <span
      style={{
        background: colors[cell.value] || '#94a3b8',
        color: '#fff',
        padding: '2px 10px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '12px',
      }}
      onClick={() => {
        const next = cell.value === 'active' ? 'inactive' : 'active';
        onChange(next);
        onBlur();
      }}
    >
      {cell.value || 'N/A'}
    </span>
  );
}

export default function PayrollPage() {
  const [apiData, setApiData] = useState<{
    columns: ApiColumnDefinition[];
    rows: Record<string, any>[];
  } | null>(null);

  useEffect(() => {
    // ดึงข้อมูลจาก API
    fetch('/api/payroll')
      .then(r => r.json())
      .then(data => setApiData(data));
  }, []);

  const config = useMemo((): SheetConfig | null => {
    if (!apiData) return null;

    const baseConfig = createSheetConfigFromApi(
      apiData.columns,
      apiData.rows,
      {
        userName: 'Admin',
        maxUndoHistory: 50,
        allowInsertRow: true,
        allowInsertColumn: false,
        allowDeleteRow: true,
        allowDeleteColumn: false,
        defaultCellStyle: 'input-preview',

        // จัดกลุ่มคอลัมน์
        columnTags: [
          {
            key: 'income',
            label: 'รายได้',
            icon: 'fa-solid fa-circle-plus',
            color: '#22c55e',
            allowedFormats: ['number', 'readonly'],
          },
          {
            key: 'deduction',
            label: 'รายหัก',
            icon: 'fa-solid fa-circle-minus',
            color: '#ef4444',
            allowedFormats: ['number', 'readonly'],
          },
        ],

        // เมนูคลิกขวาเพิ่มเติม
        customContextMenuItems: [
          {
            key: 'approve',
            label: 'อนุมัติ',
            icon: 'fa-solid fa-check-circle',
            target: 'row-header',
            onClick: (ctx: CustomMenuContext) => {
              console.log('Approve row:', ctx.row?.id);
            },
          },
        ],

        callbacks: {
          onSave: (payload) => {
            fetch('/api/payroll', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: payload.data,
                changedCells: payload.changedCells,
              }),
            });
          },
        },
      },
    );

    // Inject custom cell components
    baseConfig.initialRows = baseConfig.initialRows.map(row => {
      if (row.cells['status']) {
        row.cells['status'] = {
          ...row.cells['status'],
          component: StatusCell,
        } as SheetCell;
      }
      return row;
    });

    return baseConfig;
  }, [apiData]);

  if (!config) return <div>Loading...</div>;
  return <CustomSheet config={config} />;
}
```
