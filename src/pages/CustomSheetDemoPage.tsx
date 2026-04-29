/* =========================================================================
   Custom Sheet Demo Page - Version 2 (Dynamic Data)
   จำลองข้อมูลจาก API: ไม่ต้องรู้ type ล่วงหน้า
   ใช้ createSheetConfigFromApi() สร้าง config อัตโนมัติ
   ========================================================================= */

import { useMemo } from "react";
import type {
  SheetConfig,
  SavePayload,
  ActionLog,
  ApiColumnDefinition,
  CustomMenuContext,
  SheetCell,
} from "../sheet-core";
import { createSheetConfigFromApi } from "../sheet-core";
import CustomSheet from "../sheet-custom/CustomSheet";
import PageHeader from "../components/PageHeader";
import { Tag, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

/* =========================================================================
   จำลอง API Response: Column Definitions
   ในการใช้งานจริง ส่วนนี้จะมาจาก API เช่น GET /api/payroll/columns
   ========================================================================= */

const API_COLUMNS: ApiColumnDefinition[] = [
  {
    field: "empId",
    label: "รหัสพนักงาน",
    type: "text",
    width: 110,
    locked: true,
    columnTag: "info",
  },
  {
    field: "empName",
    label: "ชื่อพนักงาน",
    type: "editable-text",
    width: 180,
    columnTag: "info",
  },
  {
    field: "department",
    label: "แผนก",
    type: "editable-text",
    width: 130,
  },
  {
    field: "position",
    label: "ตำแหน่ง",
    type: "editable-text",
    width: 150,
  },
  {
    field: "baseSalary",
    label: "เงินเดือน",
    type: "number",
    width: 120,
    columnTag: "income",
  },
  {
    field: "allowance",
    label: "เบี้ยเลี้ยง",
    type: "number",
    width: 100,
    columnTag: "income",
  },
  {
    field: "overtime",
    label: "OT",
    type: "number",
    width: 90,
    columnTag: "income",
  },
  {
    field: "bonus",
    label: "โบนัส",
    type: "number",
    width: 100,
    columnTag: "income",
  },
  {
    field: "deductTax",
    label: "หักภาษี",
    type: "number",
    width: 100,
    columnTag: "deduction",
  },
  {
    field: "deductSocial",
    label: "ประกันสังคม",
    type: "number",
    width: 110,
    columnTag: "deduction",
  },
  {
    field: "netPay",
    label: "สุทธิ",
    type: "readonly",
    width: 120,
    locked: true,
  },
  {
    field: "status",
    label: "สถานะ",
    type: "custom",
    width: 120,
  },
  {
    field: "tags",
    label: "ทักษะ (Tags)",
    type: "custom",
    width: 250,
    cellStyle: "plain",
    sortable: false, // ปิดการ sort สำหรับคอลัมน์นี้
  },
  {
    field: "note",
    label: "หมายเหตุ",
    type: "editable-text",
    width: 180,
    sortable: false, // ปิดการ sort สำหรับคอลัมน์นี้
  },
];

/* =========================================================================
   จำลอง API Response: Row Data
   ในการใช้งานจริง ส่วนนี้จะมาจาก API เช่น GET /api/payroll/data
   ข้อมูลเป็น Record<string, any>[] ไม่มี type กำหนดล่วงหน้า
   ========================================================================= */

const API_ROWS: Record<string, any>[] = [
  {
    empId: "EMP001",
    empName: "สมชาย สุขใจ",
    department: "IT",
    position: "Senior Developer",
    baseSalary: 55000,
    allowance: 5000,
    overtime: 3000,
    bonus: 10000,
    deductTax: 4200,
    deductSocial: 750,
    netPay: 68050,
    status: "Approved",
    tags: ["React", "TypeScript", "Node.js"],
    note: "",
  },
  {
    empId: "EMP002",
    empName: "สมหญิง ดีมาก",
    department: "HR",
    position: "HR Manager",
    baseSalary: 60000,
    allowance: 6000,
    overtime: 0,
    bonus: 15000,
    deductTax: 4200,
    deductSocial: 750,
    netPay: 76050,
    status: "Approved",
    tags: ["Recruitment", "Payroll", "Training"],
    note: "ปรับเงินเดือนใหม่",
  },
  {
    empId: "EMP003",
    empName: "วิชัย รักงาน",
    department: "Finance",
    position: "Accountant",
    baseSalary: 40000,
    allowance: 3000,
    overtime: 5000,
    bonus: 5000,
    deductTax: 2100,
    deductSocial: 750,
    netPay: 50150,
    status: "Pending",
    tags: ["Excel", "Tax", "Audit"],
    note: "",
  },
  {
    empId: "EMP004",
    empName: "นภา ใจสะอาด",
    department: "Marketing",
    position: "Marketing Lead",
    baseSalary: 50000,
    allowance: 4000,
    overtime: 2000,
    bonus: 8000,
    deductTax: 3000,
    deductSocial: 750,
    netPay: 60250,
    status: "Draft",
    tags: ["SEO", "Content Strategy", "Ads"],
    note: "รอตรวจสอบ OT",
  },
  {
    empId: "EMP005",
    empName: "ประยุทธ์ ทำดี",
    department: "IT",
    position: "Junior Developer",
    baseSalary: 30000,
    allowance: 2000,
    overtime: 8000,
    bonus: 3000,
    deductTax: 1500,
    deductSocial: 750,
    netPay: 40750,
    status: "Draft",
    tags: ["HTML", "CSS", "JS"],
    note: "",
  },
  {
    empId: "EMP006",
    empName: "พิมพ์ใจ มีเวลา",
    department: "Admin",
    position: "Office Manager",
    baseSalary: 35000,
    allowance: 3000,
    overtime: 0,
    bonus: 5000,
    deductTax: 1800,
    deductSocial: 750,
    netPay: 40450,
    status: "Pending",
    tags: ["Management", "Booking", "Support"],
    note: "",
  },
  {
    empId: "EMP007",
    empName: "กิตติ ชาญฉลาด",
    department: "IT",
    position: "DevOps Engineer",
    baseSalary: 52000,
    allowance: 5000,
    overtime: 4000,
    bonus: 7000,
    deductTax: 3200,
    deductSocial: 750,
    netPay: 64050,
    status: "Draft",
    tags: ["AWS", "Docker", "CI/CD", "Linux"],
    note: "เพิ่งเริ่มงาน",
  },
  {
    empId: "EMP008",
    empName: "มาลี รื่นรมย์",
    department: "Sales",
    position: "Sales Director",
    baseSalary: 70000,
    allowance: 8000,
    overtime: 0,
    bonus: 20000,
    deductTax: 5500,
    deductSocial: 750,
    netPay: 91750,
    status: "Approved",
    tags: ["B2B", "Negotiation", "Leadership"],
    note: "Top performer",
  },
];

/* =========================================================================
   Custom Cell Component ตัวอย่าง: Status วาดปุ่มเอง
   ========================================================================= */

function CustomStatusCellComponent({ cell, onChange, onBlur }: any) {
  const isApproved = cell.value === "Approved";
  const isRejected = cell.value === "Rejected";

  const handleUpdate = (val: string) => {
    onChange(val);
    if (onBlur) onBlur();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        width: "100%",
        padding: "0 8px",
      }}
    >
      <button
        onClick={() => handleUpdate("Approved")}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          border: isApproved ? "2px solid #22c55e" : "1px solid #d1d5db",
          background: isApproved ? "#dcfce7" : "#f3f4f6",
          color: isApproved ? "#166534" : "#4b5563",
          cursor: "pointer",
          fontWeight: isApproved ? "bold" : "normal",
          fontSize: "12px",
        }}
      >
        <i className="fa-solid fa-check"></i>
      </button>
      <button
        onClick={() => handleUpdate("Pending")}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          border:
            !isApproved && !isRejected
              ? "2px solid #eab308"
              : "1px solid #d1d5db",
          background: !isApproved && !isRejected ? "#fef9c3" : "#f3f4f6",
          color: !isApproved && !isRejected ? "#854d0e" : "#4b5563",
          cursor: "pointer",
          fontWeight: !isApproved && !isRejected ? "bold" : "normal",
          fontSize: "12px",
        }}
      >
        <i className="fa-solid fa-clock"></i>
      </button>
      <button
        onClick={() => handleUpdate("Rejected")}
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          border: isRejected ? "2px solid #ef4444" : "1px solid #d1d5db",
          background: isRejected ? "#fee2e2" : "#f3f4f6",
          color: isRejected ? "#991b1b" : "#4b5563",
          cursor: "pointer",
          fontWeight: isRejected ? "bold" : "normal",
          fontSize: "12px",
        }}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
}

/* =========================================================================
   Custom Cell Component ตัวอย่าง: Badge / Tag
   ========================================================================= */

function CustomBadgeCellComponent({ cell, onChange, onBlur, isEditing }: any) {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<any>(null);

  const tags: string[] = Array.isArray(cell.value)
    ? cell.value
    : cell.value && typeof cell.value === "string"
      ? cell.value.split(",").map((t: string) => t.trim())
      : [];

  useEffect(() => {
    if (isEditing) {
      setInputVisible(true);
    }
  }, [isEditing]);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  const handleClose = (removedTag: string) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    onChange(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    let newTags = [...tags];
    if (inputValue && tags.indexOf(inputValue) === -1) {
      newTags = [...tags, inputValue];
      onChange(newTags);
    }
    setInputVisible(false);
    setInputValue("");
    if (onBlur) onBlur();
  };

  const ANTD_COLORS = [
    "magenta",
    "red",
    "volcano",
    "orange",
    "gold",
    "lime",
    "green",
    "cyan",
    "blue",
    "geekblue",
    "purple",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: "4px",
        alignItems: "center",
        width: "100%",
        padding: "2px 8px",
        overflow: "hidden",
      }}
    >
      {tags.length === 0 && !inputVisible && (
        <span
          style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}
        >
          ไม่มีข้อมูล
        </span>
      )}
      {tags.map((tag, index) => {
        const isLongTag = tag.length > 20;
        return (
          <Tag
            key={tag}
            closable={isEditing || inputVisible}
            style={{
              userSelect: "none",
              margin: 0,
              fontSize: "11px",
              fontWeight: 500,
            }}
            onClose={() => handleClose(tag)}
            color={ANTD_COLORS[index % ANTD_COLORS.length]}
          >
            {isLongTag ? `${tag.slice(0, 20)}...` : tag}
          </Tag>
        );
      })}

      {inputVisible ? (
        <Input
          ref={inputRef}
          type="text"
          size="small"
          style={{ width: 78, margin: 0 }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
      ) : (
        isEditing && (
          <Tag
            style={{
              background: "#fff",
              borderStyle: "dashed",
              cursor: "pointer",
              margin: 0,
            }}
            onClick={showInput}
          >
            <PlusOutlined /> New Tag
          </Tag>
        )
      )}
    </div>
  );
}

/* =========================================================================
   Custom Cell Components Map
   ใช้สำหรับ inject component เข้า cell ตาม field name
   ========================================================================= */

const CUSTOM_CELL_MAP: Record<
  string,
  { component: any; cellOverrides?: Record<string, any> }
> = {
  status: {
    component: CustomStatusCellComponent,
    cellOverrides: { className: "custom-status-cell", style: { padding: 0 } },
  },
  tags: {
    component: CustomBadgeCellComponent,
    cellOverrides: { className: "custom-tags-cell" },
  },
};

/* =========================================================================
   PAGE COMPONENT
   ========================================================================= */

export default function CustomSheetDemoPage() {
  const config = useMemo((): SheetConfig => {
    // สร้าง config จาก API data (จำลองว่ารับจาก API โดยไม่รู้ type ล่วงหน้า)
    const baseConfig = createSheetConfigFromApi(API_COLUMNS, API_ROWS, {
      userName: "Admin",
      readonly: false,
      maxUndoHistory: 50,
      allowInsertRow: true,
      allowInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      defaultCellStyle: "input-preview", // plain, input-preview
      // กำหนดประเภทคอลัมน์ที่ใช้ในระบบ HR
      columnTags: [
        {
          key: "income",
          label: "รายได้",
          icon: "fa-solid fa-circle-plus",
          color: "#22c55e",
          allowedFormats: ["number", "readonly"],
        },
        {
          key: "deduction",
          label: "รายหัก",
          icon: "fa-solid fa-circle-minus",
          color: "#ef4444",
          allowedFormats: ["number", "readonly"],
        },
        {
          key: "info",
          label: "ข้อมูลทั่วไป",
          icon: "fa-solid fa-circle-info",
          color: "#3b82f6",
        },
      ],
      callbacks: {
        onSave: (payload: SavePayload) => {
          console.log(
            "%c[Custom Sheet] Save triggered",
            "color: #22c55e; font-weight: bold;",
            payload,
          );
          alert(
            `บันทึกสำเร็จ!\nSource: ${payload.source}\nChanged cells: ${payload.changedCells.length}\nAction logs: ${payload.actionLogs.length}`,
          );
        },
        onAction: (_action: ActionLog) => {
          // Already logged by useActionLogger
        },
      },
      customContextMenuItems: [
        {
          key: "approve-employee",
          label: "อนุมัติพนักงาน",
          icon: "fa-solid fa-circle-check",
          target: "cell",
          onClick: (ctx: CustomMenuContext) => {
            console.log(
              "%c[Custom Action] อนุมัติพนักงาน",
              "color: #22c55e; font-weight: bold;",
              {
                action: "approve-employee",
                rowId: ctx.row?.id,
                colId: ctx.column?.id,
                cellValue: ctx.cell?.value,
                position: ctx.cellPos,
                timestamp: new Date().toISOString(),
              },
            );
            alert(
              `อนุมัติพนักงานสำเร็จ!\nRow: ${ctx.row?.id}\nCell Value: ${ctx.cell?.value}`,
            );
          },
        },
        {
          key: "export-row",
          label: "ส่งออกข้อมูลแถวนี้",
          icon: "fa-solid fa-file-export",
          target: "row-header",
          onClick: (ctx: CustomMenuContext) => {
            const rowData = ctx.row
              ? Object.entries(ctx.row.cells).reduce(
                  (acc, [key, cell]) => {
                    acc[key] = (cell as SheetCell).value;
                    return acc;
                  },
                  {} as Record<string, any>,
                )
              : {};
            console.log(
              "%c[Custom Action] ส่งออกข้อมูล",
              "color: #f59e0b; font-weight: bold;",
              {
                action: "export-row",
                rowId: ctx.row?.id,
                data: rowData,
                timestamp: new Date().toISOString(),
              },
            );
            alert(
              `ส่งออกข้อมูล: ${ctx.row?.id}\n\n${JSON.stringify(rowData, null, 2)}`,
            );
          },
        },
        {
          key: "column-stats",
          label: "ดูสถิติแท็ก",
          icon: "fa-solid fa-chart-bar",
          target: "col-header",
          onClick: (ctx: CustomMenuContext) => {
            console.log(
              "%c[Custom Action] ดูสถิติแท็ก",
              "color: #3b82f6; font-weight: bold;",
              {
                action: "column-stats",
                colId: ctx.column?.id,
                colTitle: ctx.column?.title,
                dataType: ctx.column?.dataType,
                locked: ctx.column?.locked,
                timestamp: new Date().toISOString(),
              },
            );
            alert(
              `ดูสถิติแท็ก: ${ctx.column?.title}\nID: ${ctx.column?.id}\nDataType: ${ctx.column?.dataType || "N/A"}\nLocked: ${ctx.column?.locked ? "Yes" : "No"}`,
            );
          },
        },
      ],
    });

    // Inject custom cell components สำหรับ columns ที่เป็น 'custom' mode
    // ในโปรเจคจริง ส่วนนี้คือจุดเชื่อมระหว่าง frontend กับ API
    baseConfig.initialRows = baseConfig.initialRows.map((row) => {
      const updatedCells = { ...row.cells };
      for (const [fieldKey, mapping] of Object.entries(CUSTOM_CELL_MAP)) {
        if (updatedCells[fieldKey]) {
          updatedCells[fieldKey] = {
            ...updatedCells[fieldKey],
            component: mapping.component,
            ...mapping.cellOverrides,
          };
        }
      }
      return { ...row, cells: updatedCells };
    });

    return baseConfig;
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Custom Sheet (HTML)"
        subtitle="Version 2: ข้อมูลจาก API แบบ Dynamic - ไม่ต้องรู้ Type ล่วงหน้า"
        icon="fa-solid fa-code"
      />

      {/* Custom Sheet Component */}
      <CustomSheet config={config} />
    </div>
  );
}
