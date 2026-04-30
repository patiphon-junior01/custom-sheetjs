/* =========================================================================
   Custom Sheet - Main Component (Version 1: HTML Custom)
   ========================================================================= */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type {
  SheetConfig,
  CellPosition,
  ContextMenuItem,
  SheetColumn,
  CustomMenuContext,
  CellMode,
} from "../sheet-core";
import {
  useSheetEngine,
  useKeyboard,
  isCellInSelection,
  formatShortcut,
  generateFormulaTemplates,
  buildFormulaFromTemplate,
} from "../sheet-core";
import type { FormulaTemplate } from "../sheet-core";
import { CustomSheetCell } from "./CustomSheetCell";
import { CustomContextMenu } from "./CustomContextMenu";
import { CustomCommentPopover } from "./CustomCommentPopover";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Tooltip, Modal, Input, Typography, Tag, Space } from "antd";
import "./custom-sheet.css";

const { Text } = Typography;

interface FormulaSetupModalProps {
  isOpen: boolean;
  initialFormula: string;
  availableCols: { id: string; title: string }[];
  onSave: (formula: string) => void;
  onCancel: () => void;
  /** Template สูตรสำเร็จรูปที่แนะนำ */
  templates?: FormulaTemplate[];
  /** เมื่อเลือก Template จะส่งคืน templateKey + formula */
  onSelectTemplate?: (templateKey: string, formula: string) => void;
}

function FormulaSetupModal({
  isOpen,
  initialFormula,
  availableCols,
  onSave,
  onCancel,
  templates,
  onSelectTemplate,
}: FormulaSetupModalProps) {
  const [formula, setFormula] = useState(initialFormula);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setFormula(initialFormula);
    }
  }, [isOpen, initialFormula]);

  const handleInsertCol = (colId: string) => {
    setFormula((prev) => prev + `[${colId}]`);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Modal
      title="ตั้งค่าการคำนวณ (Formula)"
      open={isOpen}
      onOk={() => onSave(formula)}
      onCancel={onCancel}
      okText="บันทึกคอลัมน์คำนวณ"
      cancelText="ยกเลิก"
      width={500}
    >
      {/* Template Suggestions */}
      {templates && templates.length > 0 && (
        <div style={{ marginBottom: "16px", marginTop: "8px" }}>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "8px" }}
          >
            <i
              className="fa-solid fa-wand-magic-sparkles"
              style={{ marginRight: 6 }}
            ></i>
            สูตรแนะนำ (Template):
          </Text>
          <Space size={[8, 8]} wrap style={{ width: "100%" }}>
            {templates.map((t) => (
              <Tag
                key={t.key}
                color="green"
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  padding: "4px 12px",
                  fontSize: "13px",
                  borderRadius: "6px",
                }}
                onClick={() => {
                  if (onSelectTemplate) {
                    onSelectTemplate(t.key, t.key);
                  }
                }}
              >
                {t.icon && (
                  <i className={t.icon} style={{ marginRight: 6 }}></i>
                )}
                {t.label}
              </Tag>
            ))}
          </Space>
          <div
            style={{
              borderBottom: "1px solid #f0f0f0",
              margin: "12px 0 4px 0",
              marginTop: "20px",
              position: "relative",
            }}
          >
            <span
              style={{
                background: "#fff",
                padding: "0 8px",
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              หรือกรอกสูตรเอง
            </span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "16px", marginTop: "16px" }}>
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: "8px" }}
        >
          สูตรคำนวณ (อ้างอิงตัวแปรในวงเล็บก้ามปู):
        </Text>
        <Input.TextArea
          ref={inputRef}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="เช่น [baseSalary] + [bonus]"
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: "8px" }}
        >
          คลิกเพื่อเพิ่มตัวแปรลงในสูตร:
        </Text>
        <Space
          size={[8, 8]}
          wrap
          style={{ maxHeight: "150px", overflowY: "auto", width: "100%" }}
        >
          {availableCols.map((c) => (
            <Tag
              key={c.id}
              color="blue"
              style={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => handleInsertCol(c.id)}
            >
              {c.title} <span style={{ opacity: 0.6 }}>([{c.id}])</span>
            </Tag>
          ))}
        </Space>
      </div>
    </Modal>
  );
}

interface CustomSheetProps {
  config: SheetConfig;
  /** จำนวน row สูงสุดที่แสดงก่อนใช้ virtual scroll (default: 200) */
  virtualThreshold?: number;
}

export default function CustomSheet({
  config,
  virtualThreshold = 200,
}: CustomSheetProps) {
  const engine = useSheetEngine(config);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useKeyboard({ containerRef, engine, enabled: true });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    cellPos?: CellPosition;
    type: "cell" | "row-header" | "col-header";
  } | null>(null);

  // Comment popover state
  const [commentPopover, setCommentPopover] = useState<{
    position: { x: number; y: number };
    cellPos: CellPosition;
  } | null>(null);

  // ป้องกันการปิดหน้าถ้ามีข้อมูลแก้ไขแล้วแต่ยังไม่ได้บันทึก
  useEffect(() => {
    if (engine.readonly) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const lastSaveIdx = engine.actionLogs
        .map((l) => l.type)
        .lastIndexOf("save");

      let hasUnsavedChanges = false;
      for (let i = lastSaveIdx + 1; i < engine.actionLogs.length; i++) {
        const type = engine.actionLogs[i].type;
        if (
          type !== "selection-changed" &&
          type !== "sort-changed" &&
          type !== "column-resized"
        ) {
          hasUnsavedChanges = true;
          break;
        }
      }

      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [engine.actionLogs, engine.readonly]);

  // Drag state
  const [dragState, setDragState] = useState<{
    type: "row" | "column";
    fromIndex: number;
    overIndex: number | null;
  } | null>(null);

  // Resize state
  const [resizeState, setResizeState] = useState<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Multi-select drag
  const [isMouseSelecting, setIsMouseSelecting] = useState(false);

  // Formula Modal State
  const [formulaModal, setFormulaModal] = useState<{
    isOpen: boolean;
    colId: string;
    initialFormula: string;
    availableCols: { id: string; title: string }[];
  } | null>(null);

  const openFormulaModal = useCallback(
    (colId: string) => {
      const col = engine.columns.find((c) => c.id === colId);
      if (!col) return;
      setFormulaModal({
        isOpen: true,
        colId,
        initialFormula: col.formula || "",
        availableCols: engine.columns
          .filter((c) => c.id !== colId)
          .map((c) => ({ id: c.id, title: c.title })),
      });
    },
    [engine.columns],
  );

  const handleSaveFormula = useCallback(
    (formula: string) => {
      if (formulaModal) {
        engine.updateColumnProps(formulaModal.colId, {
          dataType: "formula",
          formula,
        });
        setFormulaModal(null);
      }
    },
    [formulaModal, engine],
  );

  // เมื่อ User เลือก Template สูตรสำเร็จรูป
  const handleSelectTemplate = useCallback(
    (templateKey: string) => {
      if (!formulaModal) return;
      const columnTags = config.columnTags || [];
      const { formula } = buildFormulaFromTemplate(
        templateKey,
        engine.columns,
        columnTags,
      );
      engine.updateColumnProps(formulaModal.colId, {
        dataType: "formula",
        formula,
        formulaTemplate: templateKey,
      });
      setFormulaModal(null);
    },
    [formulaModal, engine, config.columnTags],
  );

  // สร้าง Formula Templates จาก columnTags
  const formulaTemplates = useMemo(() => {
    return generateFormulaTemplates(config.columnTags || []);
  }, [config.columnTags]);

  const anchorRef = useRef<CellPosition | null>(null);

  // Column header inline rename
  const [editingColHeader, setEditingColHeader] = useState<{
    colId: string;
    title: string;
  } | null>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        engine.clearSelection();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [engine]);

  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent, pos: CellPosition) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        cellPos: pos,
        type: "cell",
      });
    },
    [],
  );

  const handleRowHeaderContextMenu = useCallback(
    (e: React.MouseEvent, rowId: string) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        cellPos: { rowId, colId: "" },
        type: "row-header",
      });
    },
    [],
  );

  const handleColHeaderContextMenu = useCallback(
    (e: React.MouseEvent, colId: string) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        cellPos: { rowId: "", colId },
        type: "col-header",
      });
    },
    [],
  );

  const allowInsertRow = config.allowInsertRow !== false && !engine.readonly;
  const allowInsertColumn =
    config.allowInsertColumn !== false && !engine.readonly;
  const allowDeleteRow = config.allowDeleteRow !== false && !engine.readonly;
  const allowDeleteColumn =
    config.allowDeleteColumn !== false && !engine.readonly;

  const contextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { type, cellPos } = contextMenu;
    const customItems = config.customContextMenuItems || [];

    // Helper: แปลง Custom Items เป็น ContextMenuItem[]
    const buildCustomItems = (
      menuType: "cell" | "row-header" | "col-header",
    ): ContextMenuItem[] => {
      const matching = customItems.filter(
        (ci) => ci.target === menuType || ci.target === "all",
      );
      if (matching.length === 0) return [];

      const row = cellPos
        ? engine.rows.find((r) => r.id === cellPos.rowId)
        : undefined;
      const col = cellPos
        ? engine.columns.find((c) => c.id === cellPos.colId)
        : undefined;
      const cell = row && cellPos ? row.cells[cellPos.colId] : undefined;

      const ctx: CustomMenuContext = {
        cellPos: cellPos || { rowId: "", colId: "" },
        row,
        column: col,
        cell,
        menuType,
      };

      return [
        { key: "div-custom", label: "", divider: true },
        ...matching.map((ci) => ({
          key: `custom-${ci.key}`,
          label: ci.label,
          icon: ci.icon,
          disabled: ci.disabled,
          danger: ci.danger,
          onClick: () => {
            ci.onClick(ctx);
            // Action Logging
            console.log(
              `%c[Custom Menu] ${ci.key}`,
              "color: #8b5cf6; font-weight: bold;",
              {
                key: ci.key,
                label: ci.label,
                menuType,
                cellPos: ctx.cellPos,
                row: ctx.row?.id,
                col: ctx.column?.id,
              },
            );
          },
        })),
      ];
    };

    if (type === "cell" && cellPos) {
      const row = engine.rows.find((r) => r.id === cellPos.rowId);
      const cell = row?.cells[cellPos.colId];
      const col = engine.columns.find((c) => c.id === cellPos.colId);
      const isColLocked = col?.locked ?? false;
      const isReadonly =
        engine.readonly || isColLocked || !cell?.editable || cell?.disabled;
      return [
        {
          key: "edit",
          label: "แก้ไข",
          icon: "fa-solid fa-pen",
          disabled: isReadonly,
          onClick: () => engine.startEditing(cellPos),
        },
        {
          key: "clear",
          label: "ล้างค่า",
          icon: "fa-solid fa-eraser",
          disabled: isReadonly || !cell?.deletable,
          onClick: () => engine.setCellValue(cellPos.rowId, cellPos.colId, ""),
        },
        { key: "div-clip", label: "", divider: true },
        {
          key: "copy",
          label: "คัดลอก",
          icon: "fa-solid fa-copy",
          onClick: () => engine.copySelection(),
        },
        {
          key: "paste",
          label: "วาง",
          icon: "fa-solid fa-paste",
          disabled: isColLocked || engine.readonly,
          onClick: () => engine.pasteFromClipboard(),
        },
        {
          key: "cut",
          label: "ตัด",
          icon: "fa-solid fa-scissors",
          disabled: isReadonly,
          onClick: () => {
            engine.copySelection();
            engine.clearSelectedCells();
          },
        },
        { key: "div1", label: "", divider: true },
        {
          key: "comment",
          label: cell?.comment ? "ดู Comment" : "เพิ่ม Comment",
          icon: "fa-solid fa-comment",
          onClick: () =>
            setCommentPopover({ position: contextMenu.position, cellPos }),
        },
        { key: "div2", label: "", divider: true },
        ...(allowInsertRow
          ? [
              {
                key: "insert-row-above",
                label: "เพิ่มแถวด้านบน",
                icon: "fa-solid fa-arrow-up",
                onClick: () => engine.insertRow("before", cellPos.rowId),
              },
              {
                key: "insert-row-below",
                label: "เพิ่มแถวด้านล่าง",
                icon: "fa-solid fa-arrow-down",
                onClick: () => engine.insertRow("after", cellPos.rowId),
              },
            ]
          : []),
        ...(allowInsertColumn
          ? [
              {
                key: "insert-col-before",
                label: "เพิ่มคอลัมน์ด้านซ้าย",
                icon: "fa-solid fa-arrow-left",
                onClick: () => engine.insertColumn("before", cellPos.colId),
              },
              {
                key: "insert-col-after",
                label: "เพิ่มคอลัมน์ด้านขวา",
                icon: "fa-solid fa-arrow-right",
                onClick: () => engine.insertColumn("after", cellPos.colId),
              },
            ]
          : []),
        { key: "div3", label: "", divider: true },
        ...(allowDeleteRow
          ? [
              {
                key: "delete-row",
                label: "ลบแถวนี้",
                icon: "fa-solid fa-trash",
                danger: true,
                disabled: !row?.deletable,
                onClick: () => engine.deleteRows([cellPos.rowId]),
              },
            ]
          : []),
        ...buildCustomItems("cell"),
      ];
    }

    if (type === "row-header" && cellPos) {
      const row = engine.rows.find((r) => r.id === cellPos.rowId);
      return [
        {
          key: "select-row",
          label: "เลือกทั้งแถว",
          icon: "fa-solid fa-arrow-right",
          onClick: () => engine.selectRow(cellPos.rowId),
        },
        { key: "div1", label: "", divider: true },
        ...(allowInsertRow
          ? [
              {
                key: "insert-above",
                label: "เพิ่มแถวด้านบน",
                icon: "fa-solid fa-arrow-up",
                onClick: () => engine.insertRow("before", cellPos.rowId),
              },
              {
                key: "insert-below",
                label: "เพิ่มแถวด้านล่าง",
                icon: "fa-solid fa-arrow-down",
                onClick: () => engine.insertRow("after", cellPos.rowId),
              },
              { key: "div2", label: "", divider: true },
            ]
          : []),
        ...(allowDeleteRow
          ? [
              {
                key: "delete",
                label: "ลบแถว",
                icon: "fa-solid fa-trash",
                danger: true,
                disabled: !row?.deletable,
                onClick: () => engine.deleteRows([cellPos.rowId]),
              },
            ]
          : []),
        ...buildCustomItems("row-header"),
      ];
    }

    if (type === "col-header" && cellPos) {
      const col = engine.columns.find((c) => c.id === cellPos.colId);
      const isLocked = col?.locked ?? false;
      const isDataTypeLocked = col?.lockDataType ?? false;
      const currentType = col?.dataType || col?.defaultMode || "editable-text";
      const isCustomNode = currentType === "custom";
      const currentTag = col?.columnTag || "";
      const columnTags = config.columnTags || [];
      const hasColumnTags = columnTags.length > 0;

      const defaultFormats: { key: string; mode: CellMode; label: string }[] = [
        {
          key: "type-text",
          mode: "editable-text",
          label: "ข้อความ (editable-text)",
        },
        {
          key: "type-number",
          mode: "number",
          label: "ตัวเลข (number)",
        },
        {
          key: "type-select",
          mode: "select",
          label: "ตัวเลือก (select)",
        },
        {
          key: "type-readonly",
          mode: "readonly",
          label: "ดูอย่างเดียว (readonly)",
        },
      ];

      // สร้างเมนูรูปแบบข้อมูล (Data Format) และแนบ Column Tags เป็น Submenu
      const formatMenuItems: ContextMenuItem[] = [
        { key: "div-type", label: "", divider: true },
        {
          key: "type-label",
          label: isDataTypeLocked
            ? `รูปแบบข้อมูล: ${currentType} (ล็อค)`
            : `รูปแบบข้อมูล: ${currentType}`,
          icon: isDataTypeLocked ? "fa-solid fa-lock" : "fa-solid fa-database",
          disabled: true,
        },
        ...defaultFormats.map((f) => {
          // หาประเภทคอลัมน์ (Tags) ที่รองรับรูปแบบข้อมูลนี้
          const tagsForThisFormat = columnTags.filter(
            (tag) => !tag.allowedFormats || tag.allowedFormats.includes(f.mode),
          );

          let children: ContextMenuItem[] | undefined = undefined;

          if (tagsForThisFormat.length > 0) {
            children = [
              {
                key: `tag-none-${f.mode}`,
                label: "(ไม่ระบุประเภท)",
                icon:
                  !currentTag && currentType === f.mode
                    ? "fa-solid fa-check"
                    : "fa-regular fa-circle",
                disabled: isCustomNode || engine.readonly || isDataTypeLocked,
                onClick: () => {
                  engine.updateColumnProps(cellPos.colId, {
                    dataType: f.mode,
                    columnTag: "",
                  });
                },
              },
              { key: `div-sub-${f.mode}`, label: "", divider: true },
              ...tagsForThisFormat.map((tag) => ({
                key: `tag-${tag.key}-${f.mode}`,
                label: tag.label,
                icon:
                  currentTag === tag.key && currentType === f.mode
                    ? "fa-solid fa-check"
                    : tag.icon || "fa-regular fa-circle",
                disabled: isCustomNode || engine.readonly || isDataTypeLocked,
                onClick: () => {
                  engine.updateColumnProps(cellPos.colId, {
                    dataType: f.mode,
                    columnTag: tag.key,
                  });
                },
              })),
            ];
          }

          return {
            key: f.key,
            label: f.label,
            icon:
              currentType === f.mode
                ? "fa-solid fa-check"
                : "fa-regular fa-circle",
            disabled: isCustomNode || engine.readonly || isDataTypeLocked,
            children,
            onClick: () => {
              // ถ้าคลิกตัวแม่ตรงๆ ให้เปลี่ยนแค่รูปแบบข้อมูล
              engine.updateColumnProps(cellPos.colId, { dataType: f.mode });
            },
          };
        }),
        {
          key: "type-formula",
          label: "สูตรคำนวณ (formula)",
          icon:
            currentType === "formula"
              ? "fa-solid fa-check"
              : "fa-regular fa-circle",
          disabled: isCustomNode || engine.readonly || isDataTypeLocked,
          onClick: () => openFormulaModal(cellPos.colId),
        },
      ];

      return [
        {
          key: "select-col",
          label:
            "\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e17\u0e31\u0e49\u0e07\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c",
          icon: "fa-solid fa-arrow-down",
          onClick: () => engine.selectColumn(cellPos.colId),
        },
        {
          key: "rename",
          label:
            "\u0e40\u0e1b\u0e25\u0e35\u0e48\u0e22\u0e19\u0e0a\u0e37\u0e48\u0e2d\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c",
          icon: "fa-solid fa-pen",
          disabled: isLocked || engine.readonly,
          onClick: () =>
            setEditingColHeader({
              colId: cellPos.colId,
              title: col?.title || "",
            }),
        },
        { key: "div-lock", label: "", divider: true },
        {
          key: "toggle-lock",
          label: isLocked
            ? "\u0e1b\u0e25\u0e14\u0e25\u0e47\u0e2d\u0e04\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c"
            : "\u0e25\u0e47\u0e2d\u0e04\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c (\u0e2b\u0e49\u0e32\u0e21\u0e41\u0e01\u0e49\u0e44\u0e02)",
          icon: isLocked ? "fa-solid fa-lock-open" : "fa-solid fa-lock",
          disabled: engine.readonly,
          onClick: () =>
            engine.updateColumnProps(cellPos.colId, { locked: !isLocked }),
        },
        ...formatMenuItems,
        // แสดง toggle "ยอดติดลบเป็นสีแดง" และ "บังคับแสดงเป็นค่าลบ" เฉพาะคอลัมน์สูตร
        ...(currentType === "formula"
          ? [
              {
                key: "toggle-force-negative",
                label: col?.forceNegativeDisplay
                  ? "ยกเลิกการแสดงเป็นยอดติดลบ"
                  : "บังคับแสดงเป็นยอดติดลบ",
                icon: col?.forceNegativeDisplay
                  ? "fa-solid fa-minus-circle"
                  : "fa-solid fa-minus",
                disabled: engine.readonly,
                onClick: () =>
                  engine.updateColumnProps(cellPos.colId, {
                    forceNegativeDisplay: !col?.forceNegativeDisplay,
                  }),
              },
              {
                key: "toggle-negative-red",
                label:
                  col?.showNegativeRed !== false
                    ? "ปิดแสดงยอดติดลบสีแดง"
                    : "เปิดแสดงยอดติดลบสีแดง",
                icon:
                  col?.showNegativeRed !== false
                    ? "fa-solid fa-toggle-on"
                    : "fa-solid fa-toggle-off",
                disabled: engine.readonly,
                onClick: () =>
                  engine.updateColumnProps(cellPos.colId, {
                    showNegativeRed: col?.showNegativeRed === false,
                  }),
              },
            ]
          : []),
        { key: "div1", label: "", divider: true },
        ...(allowInsertColumn
          ? [
              {
                key: "insert-before",
                label:
                  "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c\u0e14\u0e49\u0e32\u0e19\u0e0b\u0e49\u0e32\u0e22",
                icon: "fa-solid fa-arrow-left",
                onClick: () => engine.insertColumn("before", cellPos.colId),
              },
              {
                key: "insert-after",
                label:
                  "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c\u0e14\u0e49\u0e32\u0e19\u0e02\u0e27\u0e32",
                icon: "fa-solid fa-arrow-right",
                onClick: () => engine.insertColumn("after", cellPos.colId),
              },
              { key: "div2", label: "", divider: true },
            ]
          : []),
        ...(allowDeleteColumn
          ? [
              {
                key: "delete",
                label: "\u0e25\u0e1a\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c",
                icon: "fa-solid fa-trash",
                danger: true,
                disabled: col?.deletable === false,
                onClick: () => engine.deleteColumns([cellPos.colId]),
              },
            ]
          : []),
        ...buildCustomItems("col-header"),
      ];
    }

    return [];
  }, [contextMenu, engine, config.customContextMenuItems]);

  // =============================================
  // MOUSE SELECTION (drag to select range)
  // =============================================

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, pos: CellPosition) => {
      if (e.button !== 0) return; // เฉพาะคลิกซ้าย

      // ดักการแก้ไขช่องที่กำลัง Edit อยู่ (เพื่อป้องกันการรีเซ็ตเวลาคลิกช่องเดิม)
      if (
        engine.editingCell &&
        engine.editingCell.rowId === pos.rowId &&
        engine.editingCell.colId === pos.colId
      ) {
        return;
      }

      const anchor = engine.selection.anchor || anchorRef.current;
      if (e.shiftKey && anchor) {
        engine.selectRange(anchor, pos);
      } else {
        engine.selectCell(pos, e.metaKey || e.ctrlKey);
        anchorRef.current = pos;
      }
      setIsMouseSelecting(true);
    },
    [engine],
  );

  const handleCellMouseEnter = useCallback(
    (_e: React.MouseEvent, pos: CellPosition) => {
      if (!isMouseSelecting || !anchorRef.current) return;
      engine.selectRange(anchorRef.current, pos);
    },
    [isMouseSelecting, engine],
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseSelecting(false);
  }, []);

  // =============================================
  // COLUMN RESIZE (ใช้ setColumns โดยตรง ไม่สร้าง undo ทุก pixel)
  // =============================================

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: SheetColumn) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = col.width;
      const colId = col.id;
      const minW = col.minWidth || 50;
      const maxW = col.maxWidth || 800;

      setResizeState({ colId, startX, startWidth });

      const handleMouseMove = (me: MouseEvent) => {
        const diff = me.clientX - startX;
        const newWidth = Math.max(minW, Math.min(maxW, startWidth + diff));
        // อัปเดต visual แบบ direct (ไม่ผ่าน undo system)
        // ใช้ requestAnimationFrame เพื่อ performance
        requestAnimationFrame(() => {
          const th = document.querySelector(
            `[data-col-id="${colId}"]`,
          ) as HTMLElement;
          if (th) th.style.width = `${newWidth}px`;
        });
      };

      const handleMouseUp = (me: MouseEvent) => {
        const diff = me.clientX - startX;
        const finalWidth = Math.max(minW, Math.min(maxW, startWidth + diff));
        // Commit ครั้งเดียวตอนปล่อยเมาส์ (บันทึก undo 1 ครั้ง)
        if (finalWidth !== startWidth) {
          engine.resizeColumn(colId, finalWidth);
        }
        setResizeState(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [engine],
  );

  // =============================================
  // ROW DRAG & DROP
  // =============================================

  const handleRowDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      setDragState({ type: "row", fromIndex: index, overIndex: null });
    },
    [],
  );

  const handleRowDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragState((prev) => (prev ? { ...prev, overIndex: index } : null));
  }, []);

  const handleRowDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        engine.moveRow(fromIndex, toIndex);
      }
      setDragState(null);
    },
    [engine],
  );

  const handleDragEnd = useCallback(() => {
    setDragState(null);
  }, []);

  // =============================================
  // COLUMN DRAG & DROP
  // =============================================

  const handleColDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `col:${index}`);
      setDragState({ type: "column", fromIndex: index, overIndex: null });
    },
    [],
  );

  const handleColDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragState((prev) => (prev ? { ...prev, overIndex: index } : null));
  }, []);

  const handleColDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      if (data.startsWith("col:")) {
        const fromIndex = parseInt(data.replace("col:", ""), 10);
        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
          engine.moveColumn(fromIndex, toIndex);
        }
      }
      setDragState(null);
    },
    [engine],
  );

  // =============================================
  // COMMENT
  // =============================================

  const handleCommentClick = useCallback(
    (e: React.MouseEvent, pos: CellPosition) => {
      setCommentPopover({
        position: { x: e.clientX, y: e.clientY },
        cellPos: pos,
      });
    },
    [],
  );

  const handleCommentSave = useCallback(
    (rowId: string, colId: string, text: string) => {
      const row = engine.rows.find((r) => r.id === rowId);
      if (row?.cells[colId]?.comment) {
        engine.updateComment(rowId, colId, text);
      } else {
        engine.addComment(rowId, colId, text);
      }
    },
    [engine],
  );

  // =============================================
  // RENDER
  // =============================================

  const selectedCount = useMemo(() => {
    const { cells, ranges, rows, columns } = engine.selection;
    return cells.length + ranges.length + rows.length + columns.length;
  }, [engine.selection]);

  return (
    <div
      ref={containerRef}
      className="cs-container"
      tabIndex={0}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="cs-toolbar">
        <button
          className="cs-toolbar-btn"
          onClick={() => engine.undo()}
          disabled={!engine.canUndo || engine.readonly}
          title={`Undo (${formatShortcut("Mod+Z")})`}
        >
          <i className="fa-solid fa-rotate-left"></i>Undo
        </button>
        <button
          className="cs-toolbar-btn"
          onClick={() => engine.redo()}
          disabled={!engine.canRedo || engine.readonly}
          title={`Redo (${formatShortcut("Mod+Y")})`}
        >
          <i className="fa-solid fa-rotate-right"></i>Redo
        </button>

        {(allowInsertRow || allowInsertColumn) && (
          <div className="cs-toolbar-sep" />
        )}
        {allowInsertRow && (
          <button
            className="cs-toolbar-btn"
            onClick={() => engine.insertRow("end")}
            title="เพิ่มแถวท้ายสุด"
          >
            <i className="fa-solid fa-plus"></i>แถว
          </button>
        )}
        {allowInsertColumn && (
          <button
            className="cs-toolbar-btn"
            onClick={() => engine.insertColumn("end")}
            title="เพิ่มคอลัมน์ท้ายสุด"
          >
            <i className="fa-solid fa-plus"></i>คอลัมน์
          </button>
        )}

        <div className="cs-toolbar-sep" />

        {selectedCount > 0 && !engine.readonly && (
          <>
            <button
              className="cs-toolbar-btn danger"
              onClick={() => engine.clearSelectedCells()}
              title="ล้างค่าที่เลือก (Delete)"
            >
              <i className="fa-solid fa-eraser"></i>ล้างค่า
            </button>
            {allowDeleteRow && (
              <button
                className="cs-toolbar-btn danger"
                onClick={() => {
                  const rowIds = engine.selection.rows;
                  if (rowIds.length > 0) engine.deleteRows(rowIds);
                }}
                disabled={engine.selection.rows.length === 0}
                title="ลบแถวที่เลือก"
              >
                <i className="fa-solid fa-trash"></i>ลบแถว
              </button>
            )}
          </>
        )}

        <div className="cs-toolbar-sep" />

        {!engine.readonly && (
          <button
            className="cs-toolbar-btn primary"
            onClick={() => engine.save("button")}
            title={`บันทึก (${formatShortcut("Mod+S")})`}
          >
            <i className="fa-solid fa-floppy-disk"></i>บันทึก
          </button>
        )}

        <button
          className="cs-toolbar-btn"
          onClick={() =>
            alert(
              "ระบบเบราว์เซอร์ปัจจุบันไม่อนุญาตให้เปิดแถบค้นหาด้วยการส่งคำสั่งปุ่มครับ\n\n📌 โปรดกดปุ่ม ⌘ + F (สำหรับ Mac) หรือ Ctrl + F (สำหรับ Windows) บนคีย์บอร์ดเพื่อเปิดกล่องค้นหาของเบราว์เซอร์ครับ",
            )
          }
          title={`ค้นหา (${formatShortcut("Mod+F")})`}
        >
          <i className="fa-solid fa-magnifying-glass"></i> ค้นหา
        </button>

        <span className="cs-toolbar-info">
          {engine.rows.length} แถว / {engine.columns.length} คอลัมน์
          {engine.isDirty && " (มีการเปลี่ยนแปลง)"}
          {engine.actionLogs.length > 0 &&
            ` / ${engine.actionLogs.length} actions`}
        </span>

        {/* Sort status indicator */}
        {engine.sort.colId && (
          <span className="cs-toolbar-sort-status">
            <i
              className={`fa-solid ${engine.sort.direction === "asc" ? "fa-arrow-up-short-wide" : "fa-arrow-down-wide-short"}`}
            ></i>
            {engine.columns.find((c) => c.id === engine.sort.colId)?.title ||
              engine.sort.colId}
            <button
              className="cs-sort-clear-btn"
              onClick={() => engine.clearSort()}
              title="ยกเลิกการเรียง"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead className="cs-thead">
            <tr>
              {/* Row number header */}
              <th className="cs-th cs-th-row-num">#</th>
              {/* Column headers */}
              {engine.columns.map((col, colIdx) => {
                const isColSelected = engine.selection.columns.includes(col.id);
                const isSortedCol = engine.sort.colId === col.id;
                const sortDir = isSortedCol ? engine.sort.direction : null;
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.id}
                    data-col-id={col.id}
                    className={`cs-th ${dragState?.type === "column" && dragState.fromIndex === colIdx ? "dragging" : ""} ${dragState?.type === "column" && dragState.overIndex === colIdx ? "drag-over" : ""} ${isColSelected ? "bg-blue-50 text-blue-700" : ""}`}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth || 50,
                      cursor:
                        col.draggable && !engine.readonly
                          ? "all-scroll"
                          : "pointer",
                    }}
                    draggable={col.draggable && !engine.readonly}
                    onClick={() => engine.selectColumn(col.id)}
                    onDragStart={(e) => handleColDragStart(e, colIdx)}
                    onDragOver={(e) => handleColDragOver(e, colIdx)}
                    onDrop={(e) => handleColDrop(e, colIdx)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleColHeaderContextMenu(e, col.id)}
                  >
                    {editingColHeader?.colId === col.id ? (
                      <input
                        autoFocus
                        className="cs-col-header-input"
                        value={editingColHeader.title}
                        onChange={(e) =>
                          setEditingColHeader({
                            ...editingColHeader,
                            title: e.target.value,
                          })
                        }
                        onBlur={() => {
                          if (
                            editingColHeader.title.trim() &&
                            editingColHeader.title !== col.title
                          ) {
                            engine.renameColumn(
                              col.id,
                              editingColHeader.title.trim(),
                            );
                          }
                          setEditingColHeader(null);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            if (
                              editingColHeader.title.trim() &&
                              editingColHeader.title !== col.title
                            ) {
                              engine.renameColumn(
                                col.id,
                                editingColHeader.title.trim(),
                              );
                            }
                            setEditingColHeader(null);
                          }
                          if (e.key === "Escape") {
                            setEditingColHeader(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cs-col-header-text flex gap-2 items-center"
                        title={
                          [
                            col.locked ? "Locked - ห้ามแก้ไขข้อมูล" : null,
                            col.dataType ? `ประเภท: ${col.dataType}` : null,
                            col.defaultMode ? `Mode: ${col.defaultMode}` : null,
                          ]
                            .filter(Boolean)
                            .join(" | ") || undefined
                        }
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (engine.readonly || col.locked) return;
                          setEditingColHeader({
                            colId: col.id,
                            title: col.title,
                          });
                        }}
                      >
                        <p className="mb-0 splite-text">
                          {col.dataType === "formula" && (
                            <i
                              className="fa-solid fa-calculator"
                              style={{
                                marginRight: 6,
                                fontSize: "0.75em",
                                color: "#0ea5e9",
                                opacity: 0.9,
                              }}
                            ></i>
                          )}
                          {col.locked && (
                            <i
                              className="fa-solid fa-lock"
                              style={{
                                marginRight: 6,
                                fontSize: "0.7em",
                                color: "#94a3b8",
                                opacity: 0.7,
                              }}
                            ></i>
                          )}
                          {col.title}{" "}
                        </p>
                        {(col?.title ?? "").length > 13 && (
                          <Tooltip placement="top" title={col.title}>
                            <QuestionCircleOutlined />
                          </Tooltip>
                        )}
                        {/* Sort Indicator */}
                        {isSortable && (
                          <span
                            className={`cs-sort-indicator ${isSortedCol ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              engine.sortColumn(col.id);
                            }}
                            title={
                              sortDir === "asc"
                                ? "เรียง: น้อยไปมาก (คลิกเพื่อเปลี่ยน)"
                                : sortDir === "desc"
                                  ? "เรียง: มากไปน้อย (คลิกเพื่อยกเลิก)"
                                  : "คลิกเพื่อเรียงข้อมูล"
                            }
                          >
                            {sortDir === "asc" && (
                              <i className="fa-solid fa-arrow-up-short-wide"></i>
                            )}
                            {sortDir === "desc" && (
                              <i className="fa-solid fa-arrow-down-wide-short"></i>
                            )}
                            {!sortDir && <i className="fa-solid fa-sort"></i>}
                          </span>
                        )}

                        {/* แสดง tag badge สี ถ้าคอลัมน์มี columnTag */}
                        {/* {col.columnTag &&
                          config.columnTags &&
                          (() => {
                            const tagDef = config.columnTags?.find(
                              (t) => t.key === col.columnTag,
                            );
                            if (!tagDef) return null;
                            return (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: "0.65em",
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  background: tagDef.color || "#6b7280",
                                  color: "#fff",
                                  fontWeight: 600,
                                  verticalAlign: "middle",
                                  lineHeight: "1.4",
                                }}
                                title={tagDef.label}
                              >
                                {tagDef.label}
                              </span>
                            );
                          })()} */}
                      </span>
                    )}
                    {col.resizable && (
                      <div
                        className={`cs-resize-handle ${resizeState?.colId === col.id ? "resizing" : ""}`}
                        onMouseDown={(e) => handleResizeStart(e, col)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {engine.rows.map((row, rowIdx) => {
              const isRowSelected = engine.selection.rows.includes(row.id);
              const isDraggingRow =
                dragState?.type === "row" && dragState.fromIndex === rowIdx;
              const isDragOverTop =
                dragState?.type === "row" &&
                dragState.overIndex === rowIdx &&
                dragState.fromIndex > rowIdx;
              const isDragOverBottom =
                dragState?.type === "row" &&
                dragState.overIndex === rowIdx &&
                dragState.fromIndex < rowIdx;

              // เช็คว่าเซลล์ที่ Focus อยู่นั้นเป็นโหมดการอ้างอิง (Formula) หรือไม่
              const focusPos = engine.selection.focus;
              const focusedCol = focusPos
                ? engine.columns.find((c) => c.id === focusPos.colId)
                : null;
              const isFocusedFormula =
                focusedCol?.dataType === "formula" && focusedCol.formula;
              const dependentColIds =
                isFocusedFormula && focusPos?.rowId === row.id
                  ? engine.columns
                      .filter((c) => focusedCol.formula?.includes(`[${c.id}]`))
                      .map((c) => c.id)
                  : [];

              return (
                <tr
                  key={row.id}
                  className={`cs-tr ${row.className || ""} ${isRowSelected ? "selected-row" : ""} ${isDraggingRow ? "dragging" : ""} ${isDragOverTop ? "drag-over-top" : ""} ${isDragOverBottom ? "drag-over-bottom" : ""} ${row.component ? "cs-tr-custom" : ""}`}
                  onDragOver={(e) => handleRowDragOver(e, rowIdx)}
                  onDrop={(e) => handleRowDrop(e, rowIdx)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Row number / Drag Handle */}
                  <td
                    className="cs-td-row-num"
                    onClick={() => engine.selectRow(row.id)}
                    onContextMenu={(e) => handleRowHeaderContextMenu(e, row.id)}
                    draggable={row.draggable}
                    onDragStart={(e) => handleRowDragStart(e, rowIdx)}
                    style={{ cursor: row.draggable ? "all-scroll" : "default" }}
                  >
                    {rowIdx + 1}
                  </td>

                  {/* Row Component Mode: วาดทั้งแถวเป็น Custom Component */}
                  {row.component ? (
                    <td
                      colSpan={engine.columns.length}
                      className="cs-td cs-td-component"
                    >
                      {React.createElement(row.component, {
                        row,
                        columns: engine.columns,
                        rowIndex: rowIdx,
                      })}
                    </td>
                  ) : (
                    <>
                      {/* Normal Cells */}
                      {engine.columns.map((col) => {
                        const cell = row.cells[col.id];
                        if (!cell) return <td key={col.id} className="cs-td" />;

                        const pos: CellPosition = {
                          rowId: row.id,
                          colId: col.id,
                        };
                        const isFocused =
                          engine.selection.focus?.rowId === row.id &&
                          engine.selection.focus?.colId === col.id;
                        const isEditingThis =
                          engine.editingCell?.rowId === row.id &&
                          engine.editingCell?.colId === col.id;
                        const cellStyle =
                          col.cellStyle || config.defaultCellStyle || "plain";

                        return (
                          <CustomSheetCell
                            key={col.id}
                            cell={cell}
                            row={row}
                            column={col}
                            pos={pos}
                            isSelected={isCellInSelection(
                              pos,
                              engine.selection,
                            )}
                            isFocused={!!isFocused}
                            isEditing={isEditingThis}
                            isFormulaDependent={dependentColIds.includes(
                              col.id,
                            )}
                            onSelect={engine.selectCell}
                            onStartEditing={engine.startEditing}
                            onStopEditing={engine.stopEditing}
                            onCellChange={engine.setCellValue}
                            onContextMenu={handleCellContextMenu}
                            onMouseDown={handleCellMouseDown}
                            onMouseEnter={handleCellMouseEnter}
                            onCommentClick={handleCommentClick}
                            initialValue={
                              engine.editingCell?.rowId === row.id &&
                              engine.editingCell?.colId === col.id
                                ? engine.editingCell.initialValue
                                : undefined
                            }
                            cellStyle={cellStyle}
                          />
                        );
                      })}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CustomContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Comment Popover */}
      {commentPopover && (
        <CustomCommentPopover
          position={commentPopover.position}
          cellPos={commentPopover.cellPos}
          existingComment={
            engine.rows.find((r) => r.id === commentPopover.cellPos.rowId)
              ?.cells[commentPopover.cellPos.colId]?.comment
          }
          onSave={handleCommentSave}
          onDelete={engine.deleteComment}
          onClose={() => setCommentPopover(null)}
          readonly={engine.readonly}
        />
      )}

      {/* Formula Modal */}
      {formulaModal && (
        <FormulaSetupModal
          isOpen={formulaModal.isOpen}
          initialFormula={formulaModal.initialFormula}
          availableCols={formulaModal.availableCols}
          onSave={handleSaveFormula}
          onCancel={() => setFormulaModal(null)}
          templates={formulaTemplates}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
}
