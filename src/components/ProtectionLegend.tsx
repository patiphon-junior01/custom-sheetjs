export default function ProtectionLegend() {
  const items = [
    {
      color: 'bg-amber-100 border-amber-300',
      textColor: 'text-amber-800',
      icon: 'fa-solid fa-lock',
      label: 'Cell ที่ Locked',
      description: 'แก้ไขไม่ได้ (พื้นหลังสีเหลือง)',
    },
    {
      color: 'bg-slate-100 border-slate-300',
      textColor: 'text-slate-600',
      icon: 'fa-solid fa-ban',
      label: 'Field ที่ Read-only ตลอด',
      description: 'employeeId, employeeName, netPay',
    },
    {
      color: 'bg-rose-50 border-rose-300',
      textColor: 'text-rose-700',
      icon: 'fa-solid fa-shield-halved',
      label: 'Row ที่ Locked ทั้งแถว',
      description: 'Status = Paid / Locked หรือ locked = true',
    },
    {
      color: 'bg-emerald-50 border-emerald-300',
      textColor: 'text-emerald-700',
      icon: 'fa-solid fa-pen',
      label: 'Cell ที่แก้ไขได้',
      description: 'สามารถแก้ไขได้อิสระ',
    },
    {
      color: 'bg-blue-50 border-blue-300',
      textColor: 'text-blue-700',
      icon: 'fa-solid fa-trash-can',
      label: 'ลบ Row ได้',
      description: 'เฉพาะ paymentStatus = Draft AND locked = false',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <i className="fa-solid fa-circle-info text-blue-600"></i>
        สัญลักษณ์ Protection
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${item.color}`}
          >
            <i className={`${item.icon} ${item.textColor} text-sm`}></i>
            <div>
              <span className={`text-sm font-medium ${item.textColor}`}>
                {item.label}
              </span>
              <p className="text-xs text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
