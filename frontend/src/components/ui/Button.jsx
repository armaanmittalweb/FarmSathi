const VARIANTS = {
  primary: "bg-moss-600 text-white hover:bg-moss-700 active:bg-moss-800 disabled:bg-moss-300",
  accent: "bg-clay-500 text-white hover:bg-clay-600 active:bg-clay-700 disabled:bg-clay-200",
  secondary: "bg-sand-100 text-sand-900 hover:bg-sand-200 active:bg-sand-300 disabled:text-sand-400",
  ghost: "bg-transparent text-moss-700 hover:bg-moss-50 active:bg-moss-100 disabled:text-sand-400",
  danger: "bg-error/10 text-error hover:bg-error/20",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-[0.95rem] gap-2",
  lg: "px-6 py-3.5 text-base gap-2.5",
};

/**
 * The one button component every page uses — consistent radius, motion,
 * and disabled state instead of Tailwind classes hand-rolled per page.
 */
export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  full = false,
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-full font-semibold
        transition-colors duration-150 ease-out
        disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "lg" ? 20 : 18} strokeWidth={2.25} />}
      {children}
    </Component>
  );
}
