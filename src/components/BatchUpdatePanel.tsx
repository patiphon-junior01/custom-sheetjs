import { useState } from 'react';
import type { PayrollField } from '../types/payroll';
import {
  EDITABLE_BATCH_FIELDS,
  FIELD_LABELS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../types/payroll';

interface BatchUpdatePanelProps {
  title?: string;
  selectedCount: number;
  onApply: (field: PayrollField, value: string | number) => void;
}

export default function BatchUpdatePanel({
  title = 'อัพเดทหลายรายการพร้อมกัน (Batch Update)',
  selectedCount,
  onApply,
}: BatchUpdatePanelProps) {
  const [field, setField] = useState<PayrollField>('paymentStatus');
  const [value, setValue] = useState<string>('');

  const isDropdownField = field === 'paymentStatus' || field === 'paymentMethod';
  const isNumberField = ['allowance', 'overtime', 'bonus'].includes(field);

  const getOptions = () => {
    if (field === 'paymentStatus') return PAYMENT_STATUS_OPTIONS;
    if (field === 'paymentMethod') return PAYMENT_METHOD_OPTIONS;
    return [];
  };

  const handleApply = () => {
    if (!value) return;
    const parsedValue = isNumberField ? Number(value) : value;
    onApply(field, parsedValue);
    setValue('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-wand-magic-sparkles text-blue-600"></i>
        {title}
        {selectedCount > 0 && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {selectedCount} รายการ
          </span>
        )}
      </h3>
      <div className="flex items-end gap-3 flex-wrap">
        {/* Field Select */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            ฟิลด์ที่จะแก้ไข
          </label>
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value as PayrollField);
              setValue('');
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {EDITABLE_BATCH_FIELDS.map((f) => (
              <option key={f} value={f}>
                {FIELD_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">
            ค่าใหม่
          </label>
          {isDropdownField ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">เลือก...</option>
              {getOptions().map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={isNumberField ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isNumberField ? '0' : 'พิมพ์ค่า...'}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!value || selectedCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          <i className="fa-solid fa-check mr-1.5"></i>
          อัพเดท
        </button>
      </div>
    </div>
  );
}
