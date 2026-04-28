import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Tooltip } from 'antd';
import type { SheetCell, SheetRow, SheetColumn, CellPosition } from '../sheet-core/types';

export interface CustomSheetCellProps {
  cell: SheetCell;
  row: SheetRow;
  column: SheetColumn;
  pos: CellPosition;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  onSelect: (pos: CellPosition, multi: boolean) => void;
  onCellChange: (rowId: string, colId: string, value: any) => void;
  onStartEditing: (pos: CellPosition) => void;
  onStopEditing: () => void;
  onMouseDown: (e: React.MouseEvent, pos: CellPosition) => void;
  onMouseEnter: (e: React.MouseEvent, pos: CellPosition) => void;
  onContextMenu?: (e: React.MouseEvent, pos: CellPosition) => void;
  onCommentClick?: (e: React.MouseEvent, pos: CellPosition) => void;
  initialValue?: string;
  cellStyle?: 'plain' | 'input-preview';
  isFormulaDependent?: boolean;
}

export const CustomSheetCell = memo(function CustomSheetCell({
  cell,
  row,
  column,
  pos,
  isSelected,
  isFocused,
  isEditing,
  onSelect,
  onCellChange,
  onStartEditing,
  onStopEditing,
  onMouseDown,
  onMouseEnter,
  onContextMenu,
  onCommentClick,
  initialValue,
  cellStyle = 'plain',
  isFormulaDependent,
}: CustomSheetCellProps) {
  const [localValue, setLocalValue] = useState(cell.value);
  const inputRef = useRef<HTMLInputElement>(null);
  const localValueRef = useRef(localValue);

  // Sync ref
  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  // ซิงค์ localValue กับ cell.value เมื่อมีการแก้จากภายนอก
  useEffect(() => {
    setLocalValue(cell.value);
  }, [cell.value]);

  // Focus Input เมื่อเปลี่ยนเป็นโหมด Editing
  useEffect(() => {
    if (isEditing) {
      if (initialValue !== undefined) {
        setLocalValue(initialValue);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (initialValue === undefined) {
             inputRef.current.select();
          } else {
             inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
          }
        }
      }, 10);
    }
  }, [isEditing, cell.value, initialValue]);

  const handleMouseDownCell = useCallback(
    (e: React.MouseEvent) => {
      onMouseDown(e, pos);
    },
    [onMouseDown, pos]
  );

  const handleMouseEnterCell = useCallback(
    (e: React.MouseEvent) => {
      onMouseEnter(e, pos);
    },
    [onMouseEnter, pos]
  );
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const effectiveMode = column.dataType || cell.mode || column.defaultMode || 'text';
    if (effectiveMode === 'custom') {
      return; // ไม่อนุญาตให้เปิด Context Menu สำหรับ Custom Cell
    }

    if (!isSelected) {
      onSelect(pos, false);
    }
    if (onContextMenu) {
      onContextMenu(e, pos);
    }
  }, [isSelected, onSelect, pos, onContextMenu, column.dataType, cell.mode, column.defaultMode]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (cell.disabled || !cell.selectable) return;
      onSelect(pos, e.shiftKey || e.metaKey || e.ctrlKey);
    },
    [cell.disabled, cell.selectable, onSelect, pos]
  );

  const handleDoubleClick = useCallback(() => {
    const effectiveMode = column.dataType || cell.mode || column.defaultMode || 'text';
    const isCellLocked = column.locked || cell.disabled || !cell.editable;
    if (isCellLocked) return;
    if (effectiveMode === 'text' || effectiveMode === 'readonly' || effectiveMode === 'formula') return;
    onStartEditing(pos);
  }, [column.locked, cell.disabled, cell.editable, column.dataType, cell.mode, column.defaultMode, onStartEditing, pos]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      const effectiveMode = column.dataType || cell.mode || column.defaultMode || 'text';
      // สำหรับ select mode, commit ทันที
      if (effectiveMode === 'select') {
        onCellChange(row.id, column.id, newValue);
      }
    },
    [column.dataType, cell.mode, column.defaultMode, onCellChange, row.id, column.id]
  );

  const handleInputBlur = useCallback(() => {
    if (isEditing) {
      const currentLocal = localValueRef.current;
      if (currentLocal !== cell.value) {
        onCellChange(row.id, column.id, currentLocal);
      }
      onStopEditing();
    }
  }, [isEditing, cell.value, onCellChange, row.id, column.id, onStopEditing]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentLocal = localValueRef.current;
        if (currentLocal !== cell.value) {
           onCellChange(row.id, column.id, currentLocal);
        }
        onStopEditing();
      }
    },
    [cell.value, onCellChange, row.id, column.id, onStopEditing]
  );

  const handleCommentIndicatorClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCommentClick) {
        onCommentClick(e, pos);
      }
    },
    [onCommentClick, pos]
  );

  const effectiveMode = column.dataType || cell.mode || column.defaultMode || 'text';
  const isCellLocked = column.locked || cell.disabled;
  const isReadonlyItem = isCellLocked || effectiveMode === 'readonly' || effectiveMode === 'formula';

  const tdClasses = useMemo(() => {
    return [
      'cs-td',
      effectiveMode ? `mode-${effectiveMode}` : '',
      isCellLocked ? 'disabled' : '',
      isReadonlyItem ? 'readonly-fixed' : '',
      isSelected ? 'selected' : '',
      isFocused ? 'focused' : '',
      isEditing ? 'editing' : '',
      isFormulaDependent ? 'formula-dependent' : '',
      cellStyle === 'input-preview' && !isReadonlyItem ? 'cell-input-preview' : '',
      cell.className || '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [isSelected, isFocused, isCellLocked, effectiveMode, isEditing, isReadonlyItem, isFormulaDependent, cellStyle, cell.className]);

  // =============================================
  // RENDER: ตาม cell.mode
  // =============================================

  const renderContent = () => {
    // Mode: custom -> ใช้ component ที่กำหนด
    if (effectiveMode === 'custom' && cell.component) {
      const Component = cell.component;
      return (
        <Component
          cell={cell}
          row={row}
          column={column}
          isSelected={isSelected}
          isEditing={isEditing}
          onChange={(v: any) => onCellChange(row.id, column.id, v)}
          onBlur={onStopEditing}
        />
      );
    }

    // Mode: select -> dropdown
    if (effectiveMode === 'select') {
      const effectiveOptions = column.options || cell.options || [];
      return (
        <select
          className="cs-cell-select"
          value={localValue ?? ''}
          onChange={handleInputChange}
          disabled={isCellLocked}
        >
          <option value="">--</option>
          {effectiveOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Mode: input -> always show input
    if (effectiveMode === 'input') {
      return (
        <input
          ref={inputRef}
          className="cs-cell-input"
          value={localValue ?? ''}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={isCellLocked}
          placeholder={cell.placeholder}
        />
      );
    }

    // Mode: editable-text or number -> show text, double-click to edit
    if (effectiveMode === 'editable-text' || effectiveMode === 'number') {
      if (isEditing) {
        return (
          <input
            ref={inputRef}
            type={effectiveMode === 'number' ? 'number' : 'text'}
            className="cs-cell-input"
            value={localValue ?? ''}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={cell.placeholder}
          />
        );
      }
      return (
        <div className="cs-cell-content">
          <span className="cs-cell-text">
            {cell.value !== undefined && cell.value !== null && cell.value !== ''
              ? String(cell.value)
              : '\u00A0'}
          </span>
        </div>
      );
    }

    // Mode: text / readonly / formula -> แสดงข้อความอย่างเดียว
    const textColor = effectiveMode === 'readonly' 
       ? '#94a3b8' 
       : effectiveMode === 'formula' 
       ? '#0ea5e9' // สีฟ้าเพื่อบอกว่าช่องนี้มาจากการคำนวณ
       : undefined;

    return (
      <div className="cs-cell-content">
        <span className="cs-cell-text" style={textColor ? { color: textColor, fontWeight: effectiveMode === 'formula' ? 600 : 'normal' } : undefined}>
          {cell.value !== undefined && cell.value !== null && cell.value !== ''
            ? String(cell.value)
            : '\u00A0'}
        </span>
      </div>
    );
  };

  return (
    <td
      id={`cs-cell-${row.id}-${column.id}`}
      className={tdClasses}
      style={{ width: column.width, maxWidth: column.width, ...cell.style }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDownCell}
      onMouseEnter={handleMouseEnterCell}
    >
      {effectiveMode === 'formula' && column.formula ? (
        <Tooltip title={`[สูตรอ้างอิง]: ${column.formula}`} placement="topLeft">
          {renderContent()}
        </Tooltip>
      ) : (
        renderContent()
      )}
      {cell.comment && (
        <div
          className="cs-comment-indicator"
          title={`${cell.comment.author}: ${cell.comment.text}`}
          onClick={handleCommentIndicatorClick}
        />
      )}
    </td>
  );
});
