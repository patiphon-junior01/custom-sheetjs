import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview', icon: 'fa-solid fa-house' },
  { to: '/univer', label: 'Univer Sheets', icon: 'fa-solid fa-table-cells-large' },
  { to: '/fortune-sheet', label: 'FortuneSheet', icon: 'fa-solid fa-table-list' },
  { to: '/handsontable', label: 'Handsontable', icon: 'fa-solid fa-table' },
  { to: '/jspreadsheet', label: 'Jspreadsheet CE', icon: 'fa-solid fa-table-cells' },
  { to: '/custom-sheet', label: 'Custom Sheet (HTML)', icon: 'fa-solid fa-code' },
  { to: '/comparison', label: 'Comparison', icon: 'fa-solid fa-scale-balanced' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200">
        <i className="fa-solid fa-sheet-plastic text-blue-600 text-xl mr-3"></i>
        <span className="font-bold text-slate-900 text-lg tracking-tight">
          Sheet Demo
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <i className={`${item.icon} w-5 text-center`}></i>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Payroll Spreadsheet Demo
        </p>
      </div>
    </aside>
  );
}
