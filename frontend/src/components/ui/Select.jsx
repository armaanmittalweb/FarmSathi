export default function Select({ label, className = "", id, name, children, ...props }) {
  const selectId = id || name;
  return (
    <label htmlFor={selectId} className="block text-sm font-medium text-sand-700">
      {label}
      <select
        id={selectId}
        name={name}
        className={`mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-3.5 py-3 text-[0.95rem]
          text-sand-900 focus:border-moss-500 focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
