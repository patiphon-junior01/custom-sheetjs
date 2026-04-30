# Custom Sheet System

ระบบ Spreadsheet Component ที่ถูกพัฒนาขึ้นมาใหม่ทั้งหมด (Custom Built) ด้วย React 18 และ TypeScript เพื่อใช้งานในระบบ HR Admin หรือโปรเจคอื่นๆ ที่ต้องการตารางข้อมูลที่แก้ไขได้เหมือน Excel แต่ออกแบบมาให้ยืดหยุ่นและเป็นอิสระจากโครงสร้างฐานข้อมูล

## ✨ ความสามารถหลัก (Features)

- **Schema-less Data**: ไม่จำกัดรูปแบบข้อมูล รองรับข้อมูลทุกประเภทและทุก key
- **Topological Formula Engine**: ระบบสูตรคำนวณอัตโนมัติ พร้อมตรวจจับและป้องกันลูปสูตร (Circular Dependency Detection - `#CYCLE!`) แบบเรียลไทม์
- **High Performance**: ออกแบบ State แบบ Lazy Cloning และ Immutable แยกการอัปเดตข้อมูลดิบ (`baseRows`) กับ ข้อมูลที่ถูกคำนวณ (`rows`) ป้องกัน Memory บวม
- **Custom Column Types**: รองรับคอลัมน์หลายประเภท (Text, Number, Dropdown, Formula, Read-only) รวมถึง Custom React Components ในระดับเซลล์หรือแถว
- **Column Tagging**: ระบบจัดกลุ่มคอลัมน์ (เช่น หมวดรายได้, รายหัก) เพื่อการแสดงผลเมนูคลิกขวาและการเลือกประเภทที่เหมาะสม
- **Robust UI/UX**:
  - เมนูคลิกขวา (Context Menu) ที่ปรับเปลี่ยนตามบริบท และเพิ่มเมนูเองได้
  - ย่อขยายคอลัมน์ (Resizing) พร้อมระบบจำความกว้างลง Local Storage
  - ย้ายแถวและคอลัมน์ (Drag & Drop)
  - ค้นหาในตาราง (Search - `Ctrl+F`) และ เรียงลำดับ (Sort) หน้าบ้านโดยไม่กระทบข้อมูลหลัก
  - รองรับ Keyboard Navigation เต็มรูปแบบ (Tab, Arrow, Enter)
  - รองรับ Clipboard (Copy/Paste/Cut)

## 📁 โครงสร้างโปรเจค

โปรเจคถูกแบ่งออกเป็น 2 เลเยอร์หลัก เพื่อให้สามารถนำไปใช้งาน (Implement) กับระบบอื่นๆ ได้ง่าย:

1. **`src/sheet-core/`**: Logic Layer
   - ไม่ผูกกับ UI ของระบบ
   - ประกอบด้วย Hooks (`useSheetEngine`), Types, และ Utility functions (เช่น การแปลงจาก API เป็น Config)
2. **`src/sheet-custom/`**: UI Layer
   - ส่วนของ React Component หลัก (`CustomSheet.tsx`) และ Component ย่อย
   - ใช้ CSS บริสุทธิ์ (Vanilla CSS) ใน `custom-sheet.css`

## 🚀 การเริ่มต้นใช้งาน

### สิ่งที่ต้องติดตั้ง (Dependencies)

- `react`, `react-dom` (v18+)
- `antd`, `@ant-design/icons` (สำหรับ UI ของระบบ)
- `Font Awesome 6` (CDN ใน `index.html` หรือผ่าน npm)

### การ Build และ Run

โปรเจคใช้ **Node.js v24** (โปรดแน่ใจว่าเปิดใช้งาน v24 ก่อนเสมอ)

```bash
# ใช้ Node 24
nvm use 24

# ติดตั้ง Dependencies
npm install

# รันโหมด Development
npm run dev

# บิ้วต์สำหรับ Production
npm run build
```

## 📖 เอกสารอ้างอิงเพิ่มเติม

เพื่อให้การนำไปใช้งานและพัฒนาต่อเป็นไปได้อย่างราบรื่น โปรเจคมีเอกสาร 2 ชุด:

1. [**`USAGE.md`**](./USAGE.md) - **คู่มือการนำไปใช้งาน**
   - สำหรับนักพัฒนาที่จะนำ `CustomSheet` ไปใช้งานในโปรเจค
   - อธิบายวิธีส่งข้อมูลแบบต่างๆ (Data-only, Data+Config, API mapping)
   - ข้อมูล Config Options ทั้งหมด
2. [**`AGENTS.md`**](./AGENTS.md) - **คู่มือสถาปัตยกรรม**
   - สำหรับนักพัฒนา (หรือ AI Agent) ที่ต้องการ **แก้ไขหรือต่อยอด** Core Logic
   - รวมกฎการเขียนโค้ด (Coding Conventions) และ Data Flow ของระบบ

---
*ถูกออกแบบและพัฒนาเพื่อความเข้ากันได้อย่างสมบูรณ์กับระบบหลังบ้านสมัยใหม่ (Modern Admin Panels)*
