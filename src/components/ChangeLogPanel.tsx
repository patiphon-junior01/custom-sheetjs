import type { ChangeLogEntry } from '../types/payroll';

interface ChangeLogPanelProps {
  logs: ChangeLogEntry[];
  onClear?: () => void;
}

export default function ChangeLogPanel({ logs, onClear }: ChangeLogPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-blue-600"></i>
          Change Log (ประวัติการเปลี่ยนแปลง)
          {logs.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {logs.length}
            </span>
          )}
        </h3>
        {onClear && logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ล้าง
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            <i className="fa-regular fa-clipboard text-2xl mb-2 block"></i>
            ยังไม่มีการเปลี่ยนแปลง
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {[...logs].reverse().map((log) => (
              <div
                key={log.id}
                className="px-5 py-3 text-sm animate-fade-in hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      log.action === 'delete'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        log.action === 'delete' ? 'fa-trash-can' : 'fa-pen-to-square'
                      } text-[10px]`}
                    ></i>
                    {log.action === 'delete' ? 'ลบ' : 'แก้ไข'}
                  </span>
                  <span className="font-medium text-slate-700">
                    {log.employeeId}
                  </span>
                  <span className="text-slate-400">-</span>
                  <span className="text-slate-500">{log.employeeName}</span>
                </div>
                {log.action === 'update' ? (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{log.field}</span>
                    {': '}
                    <span className="line-through text-slate-400">
                      {String(log.oldValue)}
                    </span>
                    {' -> '}
                    <span className="text-emerald-600 font-medium">
                      {String(log.newValue)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-rose-500">ลบ row แล้ว</p>
                )}
                <p className="text-[10px] text-slate-300 mt-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
