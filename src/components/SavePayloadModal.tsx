import type { SavePayload } from '../types/payroll';

interface SavePayloadModalProps {
  payload: SavePayload | null;
  onClose: () => void;
}

export default function SavePayloadModal({ payload, onClose }: SavePayloadModalProps) {
  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-paper-plane text-emerald-600"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Save Payload Preview
              </h2>
              <p className="text-xs text-slate-500">
                {payload.changes.length} change(s) - {payload.updatedRows.length} row(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Submitted at: {new Date(payload.submittedAt).toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <i className="fa-regular fa-copy mr-1.5"></i>
              Copy
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
