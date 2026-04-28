/* =========================================================================
   Custom Sheet - Comment Popover
   แสดง/เพิ่ม/แก้ไข comment ของ cell
   ========================================================================= */

import { useState, useRef, useEffect, memo } from 'react';
import type { CellPosition, CellComment } from '../sheet-core';

interface CustomCommentPopoverProps {
  position: { x: number; y: number };
  cellPos: CellPosition;
  existingComment?: CellComment;
  onSave: (rowId: string, colId: string, text: string) => void;
  onDelete: (rowId: string, colId: string) => void;
  onClose: () => void;
}

export const CustomCommentPopover = memo(function CustomCommentPopover({
  position,
  cellPos,
  existingComment,
  onSave,
  onDelete,
  onClose,
}: CustomCommentPopoverProps) {
  const [text, setText] = useState(existingComment?.text || '');
  const [isEditing, setIsEditing] = useState(!existingComment);
  const ref = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 260),
    top: Math.min(position.y, window.innerHeight - 200),
  };

  const handleSave = () => {
    if (text.trim()) {
      onSave(cellPos.rowId, cellPos.colId, text.trim());
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete(cellPos.rowId, cellPos.colId);
    onClose();
  };

  return (
    <div className="cs-comment-popover" ref={ref} style={style}>
      {existingComment && !isEditing ? (
        <>
          <div className="cs-comment-header">
            <span className="cs-comment-author">{existingComment.author}</span>
            <span className="cs-comment-date">
              {new Date(existingComment.createdAt).toLocaleDateString('th-TH')}
            </span>
          </div>
          <div className="cs-comment-text">{existingComment.text}</div>
          <div className="cs-comment-actions">
            <button className="cs-toolbar-btn" onClick={() => setIsEditing(true)}>
              <i className="fa-solid fa-pen" style={{ fontSize: 10 }}></i>
              แก้ไข
            </button>
            <button className="cs-toolbar-btn danger" onClick={handleDelete}>
              <i className="fa-solid fa-trash" style={{ fontSize: 10 }}></i>
              ลบ
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className="cs-comment-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
          />
          <div className="cs-comment-actions">
            <button className="cs-toolbar-btn" onClick={onClose}>
              ยกเลิก
            </button>
            <button className="cs-toolbar-btn primary" onClick={handleSave} disabled={!text.trim()}>
              บันทึก
            </button>
          </div>
        </>
      )}
    </div>
  );
});
