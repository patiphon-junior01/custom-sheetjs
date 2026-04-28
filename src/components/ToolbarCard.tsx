interface ToolbarCardProps {
  children: React.ReactNode;
}

export default function ToolbarCard({ children }: ToolbarCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center flex-wrap gap-3">{children}</div>
    </div>
  );
}
