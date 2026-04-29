/* =========================================================================
   Custom Sheet - Context Menu Component
   Right-click menu สำหรับ row/column/cell operations
   ========================================================================= */

import { useEffect, useRef, memo, useState } from 'react';
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
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

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
            className={`cs-context-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''} ${item.children ? 'has-submenu' : ''}`}
            onMouseEnter={() => setActiveSubmenu(item.key)}
            onMouseLeave={() => setActiveSubmenu(null)}
            onClick={(e) => {
              if (item.disabled) return;
              if (item.onClick) {
                item.onClick();
              }
              // ถ้าไม่มีลูกให้ปิดเมนู
              if (!item.children) {
                onClose();
              }
            }}
          >
            {item.icon && <i className={item.icon}></i>}
            <span>{item.label}</span>
            
            {/* วาดไอคอนลูกศรชี้ว่ามี Submenu */}
            {item.children && (
              <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }} />
            )}

            {/* วาด Submenu */}
            {item.children && activeSubmenu === item.key && (
              <div className="cs-context-submenu" style={{ display: 'block' }}>
                {item.children.map((child) => (
                  <div
                    key={child.key}
                    className={`cs-context-item ${child.danger ? 'danger' : ''} ${child.disabled ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (child.disabled) return;
                      child.onClick?.();
                      onClose();
                    }}
                  >
                    {child.icon && <i className={child.icon}></i>}
                    <span>{child.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
