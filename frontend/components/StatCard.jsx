export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="label-technical text-outline mb-1">{label}</p>
        <p className="text-2xl font-bold text-on-surface truncate">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      </div>
    </div>
  );
}
