/* =========================================================================
   Custom Sheet - Context Menu Component
   Right-click menu สำหรับ row/column/cell operations
   รองรับ submenu ที่ปรับทิศทางตามพื้นที่ว่างอัตโนมัติ
   ========================================================================= */

import { useEffect, useRef, memo, useState, useCallback } from 'react';
import type { ContextMenuItem } from '../sheet-core';

interface CustomContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

/** ขนาดโดยประมาณของ submenu เพื่อใช้คำนวณทิศทาง */
const SUBMENU_WIDTH = 200;
const SUBMENU_HEIGHT = 250;

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

  // คำนวณ CSS class สำหรับทิศทาง submenu
  // ตรวจสอบว่าพื้นที่ขวาและล่างเพียงพอหรือไม่ ถ้าไม่พอก็สลับทิศทาง
  const getSubmenuClasses = useCallback((itemEl: HTMLElement | null) => {
    const classes: string[] = [];
    if (!itemEl) return '';

    const rect = itemEl.getBoundingClientRect();

    // ตรวจสอบแนวนอน: ถ้าขอบขวาของ submenu จะเกินหน้าจอ ให้เปิดไปซ้าย
    if (rect.right + SUBMENU_WIDTH > window.innerWidth) {
      classes.push('submenu-left');
    }

    // ตรวจสอบแนวตั้ง: ถ้าขอบล่างของ submenu จะเกินหน้าจอ ให้เปิดขึ้นบน
    if (rect.top + SUBMENU_HEIGHT > window.innerHeight) {
      classes.push('submenu-up');
    }

    return classes.join(' ');
  }, []);

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
          <ContextMenuItemRow
            key={item.key}
            item={item}
            activeSubmenu={activeSubmenu}
            onSubmenuEnter={setActiveSubmenu}
            onSubmenuLeave={() => setActiveSubmenu(null)}
            onClose={onClose}
            getSubmenuClasses={getSubmenuClasses}
          />
        );
      })}
    </div>
  );
});

/* =========================================================================
   ContextMenuItemRow - แต่ละรายการในเมนู
   แยกออกมาเพื่อเก็บ ref ของแต่ละ item สำหรับคำนวณทิศทาง submenu
   ========================================================================= */

interface ContextMenuItemRowProps {
  item: ContextMenuItem;
  activeSubmenu: string | null;
  onSubmenuEnter: (key: string) => void;
  onSubmenuLeave: () => void;
  onClose: () => void;
  getSubmenuClasses: (el: HTMLElement | null) => string;
}

const ContextMenuItemRow = memo(function ContextMenuItemRow({
  item,
  activeSubmenu,
  onSubmenuEnter,
  onSubmenuLeave,
  onClose,
  getSubmenuClasses,
}: ContextMenuItemRowProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [submenuClasses, setSubmenuClasses] = useState('');

  // คำนวณทิศทาง submenu ตอน hover
  const handleMouseEnter = useCallback(() => {
    onSubmenuEnter(item.key);
    if (item.children) {
      setSubmenuClasses(getSubmenuClasses(itemRef.current));
    }
  }, [item.key, item.children, onSubmenuEnter, getSubmenuClasses]);

  return (
    <div
      ref={itemRef}
      className={`cs-context-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''} ${item.children ? 'has-submenu' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onSubmenuLeave}
      onClick={() => {
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
        <i
          className={`fa-solid ${submenuClasses.includes('submenu-left') ? 'fa-chevron-left' : 'fa-chevron-right'}`}
          style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }}
        />
      )}

      {/* วาด Submenu - ปรับทิศทางตามพื้นที่ว่างอัตโนมัติ */}
      {item.children && activeSubmenu === item.key && (
        <div className={`cs-context-submenu ${submenuClasses}`} style={{ display: 'block' }}>
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
});
