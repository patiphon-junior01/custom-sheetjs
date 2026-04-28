/* =========================================================================
   Custom Sheet - Context Menu Component
   Right-click menu สำหรับ row/column/cell operations
   ========================================================================= */

import { useEffect, useRef, memo } from 'react';
import type { ContextMenuItem } from '../sheet-core';

interface CustomContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const CustomContextMenu = memo(function CustomContextMenu({
  items,
  position,
  onClose,
}: CustomContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // ป้องกัน menu หลุดนอกจอ
  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 200),
    top: Math.min(position.y, window.innerHeight - 300),
  };

  return (
    <div className="cs-context-menu" ref={ref} style={style}>
      {items.map((item) => {
        if (item.divider) {
          return <div key={item.key} className="cs-context-divider" />;
        }

        return (
          <div
            key={item.key}
            className={`cs-context-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose();
            }}
          >
            {item.icon && <i className={item.icon}></i>}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
});
