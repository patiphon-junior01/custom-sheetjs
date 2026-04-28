interface ProsConsCardProps {
  pros: string[];
  cons: string[];
}

export default function ProsConsCard({ pros, cons }: ProsConsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pros */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-thumbs-up"></i>
          Pros
        </h3>
        <ul className="space-y-2">
          {pros.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
              <i className="fa-solid fa-check text-emerald-500 mt-0.5 text-xs"></i>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-thumbs-down"></i>
          Cons
        </h3>
        <ul className="space-y-2">
          {cons.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
              <i className="fa-solid fa-xmark text-rose-500 mt-0.5 text-xs"></i>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
