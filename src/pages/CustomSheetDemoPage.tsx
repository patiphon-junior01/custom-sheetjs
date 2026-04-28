/* =========================================================================
   Custom Sheet Demo Page - Version 1 (HTML Custom)
   ข้อมูล Payroll ชุดเดิม แปลงเป็น SheetConfig
   ========================================================================= */

import { useMemo, useCallback } from "react";
import type {
  SheetConfig,
  SheetRow,
  SheetColumn,
  SavePayload,
  ActionLog,
} from "../sheet-core";
import { createCell, createColumn, createRow } from "../sheet-core";
import CustomSheet from "../sheet-custom/CustomSheet";
import PageHeader from "../components/PageHeader";
import { Tag, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";

/* =========================================================================
   Payroll Data -> Sheet Data
   ========================================================================= */

function buildPayrollColumns(): SheetColumn[] {
  return [
    createColumn("empId", "รหัสพนักงาน", {
      width: 110,
      dataType: "text",
      locked: true,
    }), // ล็อคระดับคอลัมน์ ห้ามแก้รหัสพนักงาน
    createColumn("empName", "ชื่อพนักงาน", {
      width: 180,
      dataType: "editable-text",
    }),
    createColumn("department", "แผนก", {
      width: 130,
      dataType: "editable-text",
    }),
    createColumn("position", "ตำแหน่ง", {
      width: 150,
      dataType: "editable-text",
    }),
    createColumn("baseSalary", "เงินเดือน", { width: 120, dataType: "number" }), // บังคับเป็นชนิดตัวเลข
    createColumn("allowance", "เบี้ยเลี้ยง", {
      width: 100,
      dataType: "number",
    }),
    createColumn("overtime", "OT", { width: 90, dataType: "number" }),
    createColumn("bonus", "โบนัส", { width: 100, dataType: "number" }),
    createColumn("deductTax", "หักภาษี", { width: 100, dataType: "number" }),
    createColumn("deductSocial", "ประกันสังคม", {
      width: 110,
      dataType: "number",
    }),
    createColumn("netPay", "สุทธิ", {
      width: 120,
      dataType: "readonly",
      locked: true,
    }), // ล็อคระดับคอลัมน์ให้ดูได้อย่างเดียว
    createColumn("status", "สถานะ", {
      width: 120,
      defaultMode: "custom",
    }),
    createColumn("tags", "ทักษะ (Tags)", {
      width: 250,
      defaultMode: "custom",
      cellStyle: "plain",
    }),
    createColumn("note", "หมายเหตุ", {
      width: 180,
      defaultMode: "editable-text",
    }),
  ];
}

interface EmployeeData {
  empId: string;
  empName: string;
  department: string;
  position: string;
  baseSalary: number;
  allowance: number;
  overtime: number;
  bonus: number;
  deductTax: number;
  deductSocial: number;
  status: string;
  tags: string[];
  note: string;
  locked: boolean;
}

const MOCK_EMPLOYEES: EmployeeData[] = [
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
    status: "Approved",
    tags: ["React", "TypeScript", "Node.js"],
    note: "",
    locked: true,
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
    status: "Approved",
    tags: ["Recruitment", "Payroll", "Training"],
    note: "ปรับเงินเดือนใหม่",
    locked: true,
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
    status: "Pending",
    tags: ["Excel", "Tax", "Audit"],
    note: "",
    locked: false,
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
    status: "Draft",
    tags: ["SEO", "Content Strategy", "Ads"],
    note: "รอตรวจสอบ OT",
    locked: false,
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
    status: "Draft",
    tags: ["HTML", "CSS", "JS"],
    note: "",
    locked: false,
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
    status: "Pending",
    tags: ["Management", "Booking", "Support"],
    note: "",
    locked: false,
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
    status: "Draft",
    tags: ["AWS", "Docker", "CI/CD", "Linux"],
    note: "เพิ่งเริ่มงาน",
    locked: false,
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
    status: "Approved",
    tags: ["B2B", "Negotiation", "Leadership"],
    note: "Top performer",
    locked: true,
  },
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

function buildPayrollRows(): SheetRow[] {
  const rows = MOCK_EMPLOYEES.map((emp) => {
    const net =
      emp.baseSalary +
      emp.allowance +
      emp.overtime +
      emp.bonus -
      emp.deductTax -
      emp.deductSocial;
    const isLocked = emp.locked;

    return createRow(
      {
        empId: createCell("empId", emp.empId, {
          mode: "text",
          editable: false,
          disabled: isLocked,
        }),
        empName: createCell("empName", emp.empName, { disabled: isLocked }),
        department: createCell("department", emp.department, {
          disabled: isLocked,
        }),
        position: createCell("position", emp.position, { disabled: isLocked }),
        baseSalary: createCell("baseSalary", emp.baseSalary, {
          disabled: isLocked,
        }),
        allowance: createCell("allowance", emp.allowance, {
          disabled: isLocked,
        }),
        overtime: createCell("overtime", emp.overtime, { disabled: isLocked }),
        bonus: createCell("bonus", emp.bonus, { disabled: isLocked }),
        deductTax: createCell("deductTax", emp.deductTax, {
          disabled: isLocked,
        }),
        deductSocial: createCell("deductSocial", emp.deductSocial, {
          disabled: isLocked,
        }),
        netPay: createCell("netPay", net, {
          mode: "readonly",
          editable: false,
        }),
        status: createCell("status", emp.status, {
          mode: "custom",
          disabled: isLocked,
          component: CustomStatusCellComponent,
          className: "custom-status-cell",
          style: { padding: 0 },
        }),
        tags: createCell("tags", emp.tags, {
          mode: "custom",
          disabled: isLocked,
          component: CustomBadgeCellComponent,
          className: "custom-tags-cell",
        }),
        note: createCell("note", emp.note, {
          disabled: isLocked,
          placeholder: "พิมพ์หมายเหตุ...",
        }),
      },
      { deletable: !isLocked },
    );
  });

  return rows;
}

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
   PAGE COMPONENT
   ========================================================================= */

export default function CustomSheetDemoPage() {
  const config = useMemo((): SheetConfig => {
    return {
      initialRows: buildPayrollRows(),
      initialColumns: buildPayrollColumns(),
      userName: "Admin",
      maxUndoHistory: 50,
      allowInsertRow: true,
      allowInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      defaultCellStyle: "input-preview", // plain, input-preview
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
        onAction: (action: ActionLog) => {
          // Already logged by useActionLogger
        },
      },
      customContextMenuItems: [
        {
          key: "approve-employee",
          label: "อนุมัติพนักงาน",
          icon: "fa-solid fa-circle-check",
          target: "cell",
          onClick: (ctx) => {
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
          onClick: (ctx) => {
            const rowData = ctx.row
              ? Object.entries(ctx.row.cells).reduce(
                  (acc, [key, cell]) => {
                    acc[key] = cell.value;
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
          onClick: (ctx) => {
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
    };
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Custom Sheet (HTML)"
        subtitle="Version 1: Spreadsheet Component สร้างเองด้วย HTML/CSS/React ล้วนๆ - ไม่พึ่งพา Library ภายนอก"
        icon="fa-solid fa-code"
      />

      {/* Feature Guide */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <i className="fa-solid fa-circle-info mr-2"></i>
        <strong>วิธีใช้งาน:</strong>
        <ul className="mt-2 ml-4 space-y-1 list-disc text-xs">
          <li>คลิกเพื่อเลือก Cell, Double-click เพื่อแก้ไข, Enter เพื่อยืนยัน</li>
          <li>ลากเมาส์คลุมเพื่อเลือกหลาย Cell, คลิก # เพื่อเลือกทั้งแถว</li>
          <li>คลิกขวาเพื่อเปิดเมนู (เพิ่ม/ลบ แถว/คอลัมน์, Comment)</li>
          <li>ลาก Header เพื่อย้ายคอลัมน์, ลากขอบ Header เพื่อ Resize</li>
          <li>ลากแถวเพื่อเปลี่ยนลำดับ, Delete/Backspace เพื่อล้างค่า</li>
          <li>Ctrl/Cmd + Z/Y = Undo/Redo, Ctrl/Cmd + S = Save</li>
          <li>Ctrl/Cmd + C/V/X = Copy / Paste / Cut</li>
          <li>Double-click Header คอลัมน์เพื่อเปลี่ยนชื่อ หรือคลิกขวาเลือก เปลี่ยนชื่อคอลัมน์</li>
          <li>Cell สีเทา = Disabled (ถูก Lock ไม่สามารถแก้ไขได้)</li>
        </ul>
      </div> */}

      {/* Custom Sheet Component */}
      <CustomSheet config={config} />
    </div>
  );
}
