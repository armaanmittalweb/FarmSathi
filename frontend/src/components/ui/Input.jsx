/**
 * A labeled input with a consistent focus/error state. One place to get
 * spacing, contrast, and touch-target size right for every form in the app.
 */
export default function Input({ label, hint, error, icon: Icon, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className="block text-sm font-medium text-sand-700">
      {label}
      <div className="relative mt-1.5">
        {Icon && <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />}
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white py-3 text-[0.95rem] text-sand-900
            placeholder:text-sand-400 transition-colors
            ${Icon ? "pl-10 pr-3.5" : "px-3.5"}
            ${error ? "border-error focus:border-error" : "border-sand-200 focus:border-moss-500"}
            focus:outline-none disabled:bg-sand-50 disabled:text-sand-400
            ${className}`}
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-sand-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
    </label>
  );
}
