# Quick Start - Custom Sheet System

> คู่มือเริ่มต้นแบบรวดเร็ว สำหรับทีมที่ต้องการนำ Custom Sheet ไปใช้กับโปรเจคอื่น
> อ่านเพิ่มเติม: [USAGE.md](./USAGE.md) | [AGENTS.md](./AGENTS.md)

## ขั้นตอนที่ 1: คัดลอกไฟล์

คัดลอก 2 โฟลเดอร์นี้ไปวางใน `src/` ของโปรเจคปลายทาง:

```
src/sheet-core/    (8 ไฟล์ - Logic Layer)
src/sheet-custom/  (6 ไฟล์ - UI Layer + CSS)
```

## ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
npm install antd @ant-design/icons
```

## ขั้นตอนที่ 3: เพิ่ม CDN ใน index.html

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
```

## ขั้นตอนที่ 4: ใช้งาน

### แบบง่ายที่สุด (ใช้ data อย่างเดียว)

```tsx
import { createSheetConfigFromData } from '../sheet-core';
import CustomSheet from '../sheet-custom/CustomSheet';

const data = [
  { name: 'สมชาย', salary: 50000 },
  { name: 'สมหญิง', salary: 45000 },
];

function MyPage() {
  const config = createSheetConfigFromData(data);
  return <CustomSheet config={config} />;
}
```

### แบบ API (แนะนำ)

```tsx
import { useMemo } from 'react';
import type { SheetConfig } from '../sheet-core';
import { createSheetConfigFromApi } from '../sheet-core';
import CustomSheet from '../sheet-custom/CustomSheet';

function MyPage() {
  const config = useMemo((): SheetConfig => {
    const columns = [
      { field: 'name', label: 'ชื่อ', type: 'editable-text', width: 180 },
      { field: 'salary', label: 'เงินเดือน', type: 'number', width: 120 },
      { field: 'note', label: 'หมายเหตุ', type: 'editable-text', width: 150, sortable: false },
    ];
    const rows = [
      { name: 'สมชาย', salary: 50000 },
      { name: 'สมหญิง', salary: 45000 },
    ];
    return createSheetConfigFromApi(columns, rows, {
      userName: 'Admin',
      callbacks: {
        onSave: (payload) => console.log('Save:', payload),
      },
    });
  }, []);

  return <CustomSheet config={config} />;
}
```

> **สำคัญ:** wrap config ด้วย `useMemo()` เสมอ ป้องกัน re-render loop

## อ่านเพิ่มเติม

- **[USAGE.md](./USAGE.md)** - คู่มือเต็ม: Column Tags, Formula, Custom Cells, Context Menu, Callbacks
- **[AGENTS.md](./AGENTS.md)** - Rules สำหรับ AI agents และนักพัฒนาที่จะแก้ไข core
