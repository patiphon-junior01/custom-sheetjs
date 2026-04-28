import type { PayrollRow } from '../types/payroll';
import { calculateSummary, formatCurrency } from '../utils/payrollCalculations';

interface PayrollSummaryCardsProps {
  rows: PayrollRow[];
}

export default function PayrollSummaryCards({ rows }: PayrollSummaryCardsProps) {
  const summary = calculateSummary(rows);

  const cards = [
    {
      label: 'พนักงานทั้งหมด',
      value: summary.totalEmployees.toString(),
      icon: 'fa-solid fa-users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'ยอดรวมสุทธิ',
      value: formatCurrency(summary.totalNetPay),
      icon: 'fa-solid fa-money-bill-wave',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      prefix: 'THB',
    },
    {
      label: 'รวมหัก',
      value: formatCurrency(summary.totalDeductions),
      icon: 'fa-solid fa-arrow-trend-down',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      prefix: 'THB',
    },
    {
      label: 'รวมโบนัส',
      value: formatCurrency(summary.totalBonus),
      icon: 'fa-solid fa-gift',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      prefix: 'THB',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-9 h-9 ${card.bgColor} rounded-xl flex items-center justify-center`}
            >
              <i className={`${card.icon} ${card.color} text-sm`}></i>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-0.5">{card.label}</p>
          <p className="text-lg font-bold text-slate-900">
            {card.prefix && (
              <span className="text-xs font-normal text-slate-400 mr-1">
                {card.prefix}
              </span>
            )}
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
