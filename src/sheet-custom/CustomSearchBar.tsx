/* =========================================================================
   Custom Sheet - Search Bar
   ========================================================================= */

import { useRef, useEffect, memo } from 'react';
import type { UseSheetEngineReturn } from '../sheet-core';

interface CustomSearchBarProps {
  engine: UseSheetEngineReturn;
}

export const CustomSearchBar = memo(function CustomSearchBar({ engine }: CustomSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (engine.search.isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [engine.search.isOpen]);

  if (!engine.search.isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        engine.prevSearchResult();
      } else {
        engine.nextSearchResult();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      engine.closeSearch();
    }
  };

  return (
    <div className="cs-search-bar flex items-center bg-white px-4 py-2 border-b border-slate-200 gap-2 shadow-sm relative z-10 w-full top-0">
      <i className="fa-solid fa-magnifying-glass text-slate-400"></i>
      <input
        ref={inputRef}
        className="cs-search-input flex-1 px-3 py-1.5 outline-none border border-slate-200 rounded text-sm focus:border-blue-500 transition-colors"
        type="text"
        value={engine.search.query}
        onChange={(e) => engine.setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ค้นหาข้อมูล... (Enter ค้นหาถัดไป, Shift+Enter ย้อนกลับ)"
      />
      <span className="cs-search-count text-xs text-slate-500 min-w-16 text-right">
        {engine.search.results.length > 0
          ? `${engine.search.currentIndex + 1} / ${engine.search.results.length}`
          : engine.search.query
          ? 'ไม่พบ'
          : ''}
      </span>
      <div className="flex bg-slate-50 border border-slate-200 rounded overflow-hidden">
        <button className="px-3 py-1.5 hover:bg-slate-200 text-slate-500 transition-colors" onClick={engine.prevSearchResult} title="ก่อนหน้า (Shift+Enter)">
          <i className="fa-solid fa-chevron-up text-xs"></i>
        </button>
        <button className="px-3 py-1.5 hover:bg-slate-200 text-slate-500 transition-colors border-l border-slate-200" onClick={engine.nextSearchResult} title="ถัดไป (Enter)">
          <i className="fa-solid fa-chevron-down text-xs"></i>
        </button>
      </div>
      <button className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" onClick={engine.closeSearch} title="ปิด (Esc)">
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
});
