import React from 'react';

interface LibraryShowcaseCardProps {
  description: React.ReactNode;
  canDo: string[];
  cannotDo: string[];
}

export default function LibraryShowcaseCard({ description, canDo, cannotDo }: LibraryShowcaseCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-book-open text-blue-600"></i>
          คำอธิบายและข้อจำกัดของ Library นี้
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="p-5">
          <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-2 mb-3">
            <i className="fa-solid fa-circle-check"></i>
            สิ่งที่ทำได้และจุดเด่น
          </h4>
          <ul className="space-y-2">
            {canDo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 mt-0.5"><i className="fa-solid fa-check"></i></span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-5 bg-rose-50/30">
          <h4 className="text-sm font-semibold text-rose-700 flex items-center gap-2 mb-3">
            <i className="fa-solid fa-circle-xmark"></i>
            สิ่งที่ทำไม่ได้ หรือข้อจำกัดหลัก
          </h4>
          <ul className="space-y-2">
            {cannotDo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-rose-500 mt-0.5"><i className="fa-solid fa-xmark"></i></span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
